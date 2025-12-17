import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import AutoFit from "@/components/autoFit";
import { useConfigStore } from "./stores";

import Headder from "./headder";
import Footer from "./footer";

const BackButton = styled.button`
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  padding: 12px 24px;
  background: rgba(234, 88, 12, 0.9);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  pointer-events: auto;
  
  &:hover {
    background: rgba(234, 88, 12, 1);
    transform: translateX(-50%) scale(1.05);
  }
  
  &::before {
    content: "←";
    font-size: 18px;
  }
`;

// 弹幕容器 - 右侧，新事件在底部出现，旧事件往上推
const BubbleContainer = styled.div`
  position: fixed;
  right: 30px;
  bottom: 140px;
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  pointer-events: none;
  z-index: 100;
  max-height: 60vh;
  overflow: hidden;
`;

// 入场动画 - 从底部淡入
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 获取事件颜色（根据背景模式）
const getEventColor = (type: string, isLight: boolean) => {
  // 亮色背景用深色，暗色背景用亮色
  const colors: Record<string, [string, string]> = {
    customer_add: ['#166534', '#4ade80'],     // 深绿/亮绿
    task_complete: ['#1e40af', '#60a5fa'],    // 深蓝/亮蓝
    volume_high: ['#c2410c', '#fb923c'],      // 深橙/亮橙
    business_ratio: ['#7e22ce', '#c084fc'],   // 深紫/亮紫
  };
  const [dark, light] = colors[type] || ['#374151', '#9ca3af'];
  return isLight ? dark : light;
};

// 单个弹幕项 - 透明背景，颜色根据背景模式调整
const BubbleItem = styled.div<{ $type: string; $isLight: boolean }>`
  padding: 10px 0;
  background: transparent;
  color: ${props => getEventColor(props.$type, props.$isLight)};
  font-size: 18px;
  font-weight: 600;
  animation: ${fadeInUp} 0.5s ease-out;
  text-shadow: ${props => props.$isLight 
    ? '0 1px 2px rgba(255, 255, 255, 0.8)' 
    : '0 2px 8px rgba(0, 0, 0, 0.6)'};
  
  .event-icon {
    margin-right: 10px;
    font-size: 20px;
  }
  
  .event-time {
    font-size: 13px;
    opacity: 0.7;
    margin-top: 4px;
    color: ${props => props.$isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)'};
  }
`;

// 事件类型图标
const getEventIcon = (type: string) => {
  switch(type) {
    case 'customer_add': return '👤';
    case 'task_complete': return '✅';
    case 'volume_high': return '📈';
    case 'business_ratio': return '🎯';
    default: return '📢';
  }
};

// 事件数据接口
interface SystemEvent {
  id: number;
  type: string;
  content: string;
  created_at: string;
}

// 备用mock数据（按时间正序，早的在前）
const fallbackEvents: SystemEvent[] = [
  { id: 4, type: 'business_ratio', content: '漳州AA快递 业务占比量超过50%', created_at: '10:10' },
  { id: 3, type: 'volume_high', content: '泉州ZZ物流 当日发件量超历史最高值', created_at: '10:15' },
  { id: 2, type: 'task_complete', content: '李四 完成了 厦门YY科技 的跟进任务', created_at: '10:18' },
  { id: 1, type: 'customer_add', content: '张三 新增了客户 福州XX贸易有限公司', created_at: '10:23' },
];

export default function Content() {
  const viewLevel = useConfigStore((s) => s.viewLevel);
  const selectedCity = useConfigStore((s) => s.selectedCity);
  const backToProvince = useConfigStore((s) => s.backToProvince);
  const mode = useConfigStore((s) => s.mode);
  const bgMode = useConfigStore((s) => s.bgMode);
  const isLightBg = bgMode === "light";
  
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState<(SystemEvent & { delay: number })[]>([]);
  
  // 加载事件数据（根据视图级别筛选：省级=全省，市级=该市）
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // 构建API URL，市级视图时传city参数
        let url = '/crm/api/v4/events/today?limit=50';
        if (viewLevel === 'city' && selectedCity) {
          url += `&city=${encodeURIComponent(selectedCity)}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.events?.length > 0) {
          // 反转数组，让时间早的在前面先出现
          setEvents([...data.events].reverse());
        } else {
          // 省级视图用fallback，市级视图无数据则显示空
          setEvents(viewLevel === 'province' ? fallbackEvents : []);
        }
      } catch (err) {
        console.warn('获取事件数据失败，使用备用数据', err);
        // 省级视图用fallback，市级视图无数据则显示空
        setEvents(viewLevel === 'province' ? fallbackEvents : []);
      }
    };
    
    // 切换视图时重置弹幕状态
    setVisibleEvents([]);
    setCurrentIndex(0);
    
    fetchEvents();
    // 每30秒刷新一次
    const timer = setInterval(fetchEvents, 30000);
    return () => clearInterval(timer);
  }, [viewLevel, selectedCity]);
  
  // 循环显示事件弹幕
  useEffect(() => {
    if (events.length === 0 || !mode) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % events.length;
        return next;
      });
    }, 3000); // 每3秒显示一个新事件
    
    return () => clearInterval(interval);
  }, [events, mode]);
  
  // 更新可见事件列表
  useEffect(() => {
    if (events.length === 0) return;
    
    const event = events[currentIndex];
    if (event) {
      setVisibleEvents(prev => {
        const newEvents = [...prev, { ...event, delay: 0 }];
        // 保留最近5个事件
        return newEvents.slice(-5);
      });
    }
  }, [currentIndex, events]);

  return (
    <AutoFit>
      {/* 区县视图时显示返回按钮 */}
      {viewLevel === "city" && selectedCity && (
        <BackButton onClick={backToProvince}>
          返回福建省 · 当前: {selectedCity}
        </BackButton>
      )}
      
      <Headder />
      
      {/* 右侧事件弹幕 - 时间早的在上面，新事件从底部冒出 */}
      {mode && (
        <BubbleContainer>
          {visibleEvents.map((event, index) => (
            <BubbleItem 
              key={`${event.id}-${index}`} 
              $type={event.type}
              $isLight={isLightBg}
            >
              <span className="event-icon">{getEventIcon(event.type)}</span>
              {event.content}
              <div className="event-time">{event.created_at}</div>
            </BubbleItem>
          ))}
        </BubbleContainer>
      )}
      
      <Footer />
    </AutoFit>
  );
}
