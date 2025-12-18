import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 平台发单量
interface PlatformVolume {
  platform_name: string;
  volume: number;
}

// 加盟商排名
interface FranchiseeRank {
  rank: number;
  name: string;
  volume: number;
}

// 城市统计
interface CityStats {
  city: string;
  volume: number;
  franchisee_count: number;
}

// 实时数据
export interface RealtimeData {
  timestamp: string;
  platform_volume: PlatformVolume[];
  total_volume: number;
  volume_change_rate: number;
  predicted_volume: number;
  top_franchisees: FranchiseeRank[];
  city_stats: CityStats[];
}

// 城市地图数据（用于光柱展示）
export interface CityMapData {
  [cityName: string]: {
    population: number;      // 用于光柱高度
    totalVolume: string;     // 格式化的发单量
    franchiseeCount: string; // 加盟商数量
    volumeRaw: number;       // 原始发单量
  };
}

interface RealtimeStore {
  // 数据状态
  data: RealtimeData | null;
  cityMapData: CityMapData;
  isConnected: boolean;
  lastUpdate: string | null;
  error: string | null;
  retryCount: number;
  
  // 操作方法
  setData: (data: RealtimeData) => void;
  setCityMapData: (data: CityMapData) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  resetRetry: () => void;
  
  // SSE连接
  connect: () => void;
  disconnect: () => void;
}

let eventSource: EventSource | null = null;
const MAX_RETRY_COUNT = 3; // 最大重试次数

export const useRealtimeStore = create<RealtimeStore>()(
  subscribeWithSelector((set, get) => ({
    data: null,
    cityMapData: {},
    isConnected: false,
    lastUpdate: null,
    error: null,
    retryCount: 0,
    
    setData: (data) => {
      // 转换城市数据为地图格式
      const cityMapData: CityMapData = {};
      data.city_stats.forEach((stat) => {
        // 标准化城市名称（添加"市"后缀）
        let cityName = stat.city;
        if (!cityName.endsWith('市')) {
          cityName = cityName + '市';
        }
        
        cityMapData[cityName] = {
          population: Math.floor(stat.volume / 100), // 用于光柱高度
          totalVolume: stat.volume.toLocaleString(),
          franchiseeCount: String(stat.franchisee_count),
          volumeRaw: stat.volume,
        };
      });
      
      set({
        data,
        cityMapData,
        lastUpdate: data.timestamp,
        error: null,
        retryCount: 0, // 成功收到数据，重置重试计数
      });
    },
    
    setCityMapData: (data) => set({ cityMapData: data }),
    setConnected: (connected) => set({ isConnected: connected }),
    setError: (error) => set({ error }),
    resetRetry: () => set({ retryCount: 0 }),
    
    connect: () => {
      const currentRetry = get().retryCount;
      
      // 超过最大重试次数，停止重试
      if (currentRetry >= MAX_RETRY_COUNT) {
        console.log(`[Realtime] 已达到最大重试次数(${MAX_RETRY_COUNT})，停止重连`);
        set({ 
          isConnected: false, 
          error: '连接失败，请检查服务器状态',
          data: null,  // 清空数据，显示未连接状态
        });
        return;
      }
      
      // 如果已连接，先断开
      if (eventSource) {
        eventSource.close();
      }
      
      // 获取基础URL（支持iframe嵌入场景）
      const baseUrl = window.parent !== window 
        ? window.parent.location.origin 
        : window.location.origin;
      
      eventSource = new EventSource(`${baseUrl}/crm/api/realtime/stream`);
      
      eventSource.onopen = () => {
        console.log('[Realtime] SSE连接已建立');
        set({ isConnected: true, error: null, retryCount: 0 });
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeData;
          get().setData(data);
          console.log('[Realtime] 收到数据更新:', data.timestamp);
        } catch (e) {
          console.error('[Realtime] 数据解析失败:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('[Realtime] SSE连接错误:', error);
        const newRetryCount = get().retryCount + 1;
        set({ 
          isConnected: false, 
          error: `连接断开，重试中(${newRetryCount}/${MAX_RETRY_COUNT})...`,
          retryCount: newRetryCount,
        });
        
        // 关闭当前连接
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // 如果未超过最大重试次数，5秒后尝试重连
        if (newRetryCount < MAX_RETRY_COUNT) {
          setTimeout(() => {
            if (!get().isConnected) {
              console.log(`[Realtime] 尝试重新连接(${newRetryCount + 1}/${MAX_RETRY_COUNT})...`);
              get().connect();
            }
          }, 5000);
        } else {
          // 超过重试次数，清空数据显示未连接状态
          set({ 
            error: '连接失败，请检查服务器状态',
            data: null,
          });
        }
      };
    },
    
    disconnect: () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      set({ isConnected: false, retryCount: 0 });
    },
  }))
);

// 初始化时获取当前数据
export async function fetchCurrentData(): Promise<void> {
  try {
    const baseUrl = window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
    
    const response = await fetch(`${baseUrl}/crm/api/realtime/current`);
    const result = await response.json();
    
    if (result.success && result.data) {
      useRealtimeStore.getState().setData(result.data);
    }
  } catch (error) {
    console.error('[Realtime] 获取当前数据失败:', error);
  }
}
