import { useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import AutoFit from "@/components/autoFit";
import { useConfigStore } from "./stores";
import { useEventStore, fetchTodayEvents } from "./stores/eventStore";

import Headder from "./headder";
import Footer from "./footer";
import RealtimePanel from "./RealtimePanel";
import RightDataPanel from "./RightDataPanel";

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

// 弹幕容器 - 右侧下方，支持滚动查看历史（最新消息在底部）
const BubbleContainer = styled.div`
  position: fixed;
  right: 30px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  z-index: 90;
  max-height: 30vh;
  overflow-y: auto;
  overflow-x: hidden;
  align-items: flex-end;
  padding-right: 8px;
  
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(234, 88, 12, 0.3);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(234, 88, 12, 0.5);
  }
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
    customer_add: ['#166534', '#4ade80'],     // 深绿/亮绿 - 新客户开发成功
    task_complete: ['#1e40af', '#60a5fa'],    // 深蓝/亮蓝 - 任务完成
    volume_high: ['#c2410c', '#fb923c'],      // 深橙/亮橙 - 发件量超历史最高
    business_ratio: ['#7e22ce', '#c084fc'],   // 深紫/亮紫 - 业务占比达标
    new_customer: ['#166534', '#4ade80'],     // 深绿/亮绿 - 新客户（兼容）
  };
  const [dark, light] = colors[type] || ['#374151', '#9ca3af'];
  return isLight ? dark : light;
};

// 单个弹幕项 - 透明背景，颜色根据背景模式调整
const BubbleItem = styled.div<{ $type: string; $isLight: boolean }>`
  padding: 8px 0;
  background: transparent;
  color: ${props => getEventColor(props.$type, props.$isLight)};
  font-size: 18px;
  font-weight: 600;
  animation: ${fadeInUp} 0.5s ease-out;
  text-shadow: ${props => props.$isLight 
    ? '0 1px 2px rgba(255, 255, 255, 0.8)' 
    : '0 2px 8px rgba(0, 0, 0, 0.6)'};
  white-space: nowrap;
  
  .event-icon {
    margin-right: 8px;
    font-size: 18px;
  }
  
  .event-time {
    font-size: 12px;
    opacity: 0.7;
    margin-left: 12px;
    color: ${props => props.$isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)'};
  }
`;

// 事件类型图标
const getEventIcon = (type: string) => {
  switch(type) {
    case 'customer_add': return '🎉';      // 新客户开发成功
    case 'new_customer': return '🎉';      // 新客户（兼容）
    case 'task_complete': return '✅';     // 任务完成
    case 'volume_high': return '📈';       // 发件量超历史最高
    case 'business_ratio': return '🏆';    // 业务占比达标
    default: return '📢';
  }
};

// 事件数据接口（从store导入）
// interface SystemEvent 已从 eventStore 导入

export default function Content() {
  const viewLevel = useConfigStore((s) => s.viewLevel);
  const selectedCity = useConfigStore((s) => s.selectedCity);
  const backToProvince = useConfigStore((s) => s.backToProvince);
  const mode = useConfigStore((s) => s.mode);
  const bgMode = useConfigStore((s) => s.bgMode);
  const isLightBg = bgMode === "light";
  
  // 使用事件流store
  const events = useEventStore((s) => s.events);
  const connect = useEventStore((s) => s.connect);
  const disconnect = useEventStore((s) => s.disconnect);
  const setEvents = useEventStore((s) => s.setEvents);
  const clearEvents = useEventStore((s) => s.clearEvents);
  
  // 调试：监控events变化
  useEffect(() => {
    console.log(`[Content] events 更新, 数量: ${events.length}, mode: ${mode}`);
  }, [events, mode]);
  
  // 弹幕容器ref，用于自动滚动到底部
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  
  // 连接事件流（根据视图级别筛选）
  useEffect(() => {
    clearEvents();
    
    // 加载今日历史事件
    const city = viewLevel === 'city' && selectedCity ? selectedCity : null;
    fetchTodayEvents(city).then((todayEvents) => {
      if (todayEvents.length > 0) {
        // 后端返回按时间倒序（最新在前），直接使用
        setEvents(todayEvents);
      }
    });
    
    // 连接轮询，接收新事件
    connect(city);
    
    return () => disconnect();
  }, [viewLevel, selectedCity]);
  
  // 新事件到来时自动滚动到底部（最新消息在底部）
  useEffect(() => {
    if (bubbleContainerRef.current && events.length > 0) {
      bubbleContainerRef.current.scrollTop = bubbleContainerRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <AutoFit>
      {/* 区县视图时显示返回按钮 */}
      {viewLevel === "city" && selectedCity && (
        <BackButton onClick={backToProvince}>
          返回福建省 · 当前: {selectedCity}
        </BackButton>
      )}
      
      <Headder />
      
      {/* 左侧实时数据面板 */}
      <RealtimePanel />
      
      {/* 右侧数据看板 - 拜访次数和触达件量 */}
      <RightDataPanel />
      
      {/* 右侧事件弹幕 - 时间早的在上面，可滚动查看历史 */}
      {mode && events.length > 0 && (
        <BubbleContainer ref={bubbleContainerRef}>
          {events.map((event) => (
            <BubbleItem 
              key={event.id} 
              $type={event.type}
              $isLight={isLightBg}
            >
              <span className="event-icon">{getEventIcon(event.type)}</span>
              {event.content}
              <span className="event-time">{event.created_at}</span>
            </BubbleItem>
          ))}
        </BubbleContainer>
      )}
      
      <Footer />
    </AutoFit>
  );
}
