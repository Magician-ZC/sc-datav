import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/**
 * 系统事件数据接口
 */
export type SystemEvent = {
  id: number;
  type: string;
  content: string;
  user_name?: string;
  customer_name?: string;
  city?: string;
  district?: string;
  created_at: string;
};

interface EventStore {
  // 状态
  events: SystemEvent[];
  isConnected: boolean;
  error: string | null;
  retryCount: number;
  currentCity: string | null;
  lastEventId: number; // 记录最后一条事件ID，用于增量获取
  
  // 操作方法
  addEvent: (event: SystemEvent) => void;
  setEvents: (events: SystemEvent[]) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  resetRetry: () => void;
  clearEvents: () => void;
  
  // 轮询连接（替代SSE，减少服务器压力）
  connect: (city?: string | null) => void;
  disconnect: () => void;
}

let pollingTimer: ReturnType<typeof setInterval> | null = null;
const MAX_RETRY_COUNT = 3;
const MAX_EVENTS = 50; // 最多保留50条事件
const POLLING_INTERVAL = 5000; // 弹幕轮询间隔：5秒（弹幕需要更实时）

export const useEventStore = create<EventStore>()(
  subscribeWithSelector((set, get) => ({
    events: [],
    isConnected: false,
    error: null,
    retryCount: 0,
    currentCity: null,
    lastEventId: 0,
    
    addEvent: (event) => {
      set((state) => {
        // 检查是否已存在（避免重复）
        if (state.events.some(e => e.id === event.id)) {
          return state;
        }
        // 添加新事件，保持最多MAX_EVENTS条
        const newEvents = [...state.events, event].slice(-MAX_EVENTS);
        // 更新最后事件ID
        const newLastId = Math.max(state.lastEventId, event.id);
        return { events: newEvents, lastEventId: newLastId };
      });
    },
    
    setEvents: (events) => {
      // 后端返回按时间倒序（最新在前），需要反转为正序（旧的在前，新的在后）
      // 配合 flex-direction: column，最新的会显示在底部
      const sortedEvents = [...events].reverse();
      const lastId = sortedEvents.length > 0 ? Math.max(...sortedEvents.map(e => e.id)) : 0;
      set({ events: sortedEvents.slice(-MAX_EVENTS), lastEventId: lastId });
    },
    setConnected: (connected) => set({ isConnected: connected }),
    setError: (error) => set({ error }),
    resetRetry: () => set({ retryCount: 0 }),
    clearEvents: () => set({ events: [], lastEventId: 0 }),
    
    // 使用轮询替代 SSE，减少服务器长连接压力
    connect: (city = null) => {
      const currentCity = get().currentCity;
      
      // 如果城市变化，清空事件
      if (currentCity !== city) {
        set({ events: [], currentCity: city, lastEventId: 0 });
      }
      
      // 如果已有轮询定时器，先清除
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      
      const fetchEvents = async () => {
        try {
          const baseUrl = window.parent !== window 
            ? window.parent.location.origin 
            : window.location.origin;
          
          const currentCity = get().currentCity;
          const lastEventId = get().lastEventId;
          
          // 构建URL，支持增量获取（只获取比lastEventId大的事件）
          let url = `${baseUrl}/crm/api/v4/events/today?limit=50`;
          if (currentCity) {
            url += `&city=${encodeURIComponent(currentCity)}`;
          }
          if (lastEventId > 0) {
            url += `&after_id=${lastEventId}`;
          }
          
          const response = await fetch(url);
          const result = await response.json();
          
          if (result.success) {
            const events = result.events || [];
            
            if (lastEventId === 0) {
              // 首次加载，设置所有事件
              get().setEvents(events);
              console.log(`[EventStream] 首次加载 ${events.length} 条事件`);
            } else if (events.length > 0) {
              // 增量更新，只添加新事件
              console.log(`[EventStream] 获取到 ${events.length} 条新事件`);
              events.forEach((event: SystemEvent) => {
                get().addEvent(event);
              });
              // 调试：打印更新后的事件数量
              console.log(`[EventStream] 更新后事件总数: ${get().events.length}`);
            }
            
            set({ isConnected: true, error: null, retryCount: 0 });
          }
        } catch (error) {
          console.error('[EventStream] 轮询获取事件失败:', error);
          const newRetryCount = get().retryCount + 1;
          
          if (newRetryCount >= MAX_RETRY_COUNT) {
            set({ 
              isConnected: false, 
              error: '事件流连接失败',
              retryCount: newRetryCount,
            });
          } else {
            set({ 
              error: `获取事件失败，重试中(${newRetryCount}/${MAX_RETRY_COUNT})...`,
              retryCount: newRetryCount,
            });
          }
        }
      };
      
      // 立即获取一次
      fetchEvents();
      
      // 启动定时轮询
      pollingTimer = setInterval(fetchEvents, POLLING_INTERVAL);
      set({ currentCity: city });
      console.log(`[EventStream] 轮询模式已启动，间隔 ${POLLING_INTERVAL / 1000} 秒`);
    },
    
    disconnect: () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        console.log('[EventStream] 轮询已停止');
      }
      set({ isConnected: false, retryCount: 0, currentCity: null });
    },
  }))
);

/**
 * 获取今日事件（初始加载用）
 */
export async function fetchTodayEvents(city?: string | null): Promise<SystemEvent[]> {
  try {
    const baseUrl = window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
    
    let url = `${baseUrl}/crm/api/v4/events/today?limit=50`;
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.events) {
      return result.events;
    }
    return [];
  } catch (error) {
    console.error('[EventStream] 获取今日事件失败:', error);
    return [];
  }
}
