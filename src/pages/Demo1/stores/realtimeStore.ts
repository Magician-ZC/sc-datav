import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// 城市统计（新格式：对象形式）
interface CityStatItem {
  volume: number;
  count: number;  // 加盟商数量
}

// 城市统计映射
type CityStatsMap = Record<string, CityStatItem>;

// 内部使用的实时数据格式
export interface RealtimeData {
  timestamp: string;
  total_volume: number;
  volume_change_rate: number;
  predicted_volume: number;
  city_stats: CityStatsMap;
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
  
  // 轮询连接（替代SSE，减少服务器压力）
  connect: () => void;
  disconnect: () => void;
}

let pollingTimer: ReturnType<typeof setInterval> | null = null;
const MAX_RETRY_COUNT = 3; // 最大重试次数
const POLLING_INTERVAL = 30000; // 轮询间隔：30秒（与爬虫推送频率一致）

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
      
      // 新格式：city_stats 是对象 { "泉州": { volume, count }, ... }
      Object.entries(data.city_stats).forEach(([city, stat]) => {
        // 标准化城市名称（添加"市"后缀）
        let cityName = city;
        if (!cityName.endsWith('市')) {
          cityName = cityName + '市';
        }
        
        cityMapData[cityName] = {
          population: Math.floor(stat.volume / 100), // 用于光柱高度
          totalVolume: stat.volume.toLocaleString(),
          franchiseeCount: String(stat.count),
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
    
    // 使用轮询替代 SSE，减少服务器长连接压力
    connect: () => {
      // 如果已有轮询定时器，先清除
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      
      const fetchData = async () => {
        try {
          const baseUrl = window.parent !== window 
            ? window.parent.location.origin 
            : window.location.origin;
          
          const response = await fetch(`${baseUrl}/crm/api/realtime/current`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const rawData = result.data;
            let data: RealtimeData;
            
            if (rawData.update_time && rawData.data) {
              // 新格式：包裹在 data 字段中
              data = {
                timestamp: rawData.update_time,
                total_volume: rawData.data.total_volume,
                volume_change_rate: rawData.data.volume_change_rate,
                predicted_volume: rawData.data.predicted_volume,
                city_stats: rawData.data.city_stats,
              };
            } else {
              // 兼容旧格式
              data = rawData as RealtimeData;
            }
            
            get().setData(data);
            set({ isConnected: true, error: null, retryCount: 0 });
            console.log('[Realtime] 轮询获取数据成功:', data.timestamp);
          } else {
            // 暂无数据，但连接正常
            set({ isConnected: true, error: null });
          }
        } catch (error) {
          console.error('[Realtime] 轮询获取数据失败:', error);
          const newRetryCount = get().retryCount + 1;
          
          if (newRetryCount >= MAX_RETRY_COUNT) {
            set({ 
              isConnected: false, 
              error: '连接失败，请检查服务器状态',
              retryCount: newRetryCount,
            });
          } else {
            set({ 
              error: `获取数据失败，重试中(${newRetryCount}/${MAX_RETRY_COUNT})...`,
              retryCount: newRetryCount,
            });
          }
        }
      };
      
      // 立即获取一次数据
      fetchData();
      
      // 启动定时轮询
      pollingTimer = setInterval(fetchData, POLLING_INTERVAL);
      console.log(`[Realtime] 轮询模式已启动，间隔 ${POLLING_INTERVAL / 1000} 秒`);
    },
    
    disconnect: () => {
      // 清除轮询定时器
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        console.log('[Realtime] 轮询已停止');
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
      // 转换为内部格式（API返回的可能是新格式或旧格式）
      const rawData = result.data;
      let data: RealtimeData;
      
      if (rawData.update_time && rawData.data) {
        // 新格式：包裹在 data 字段中
        data = {
          timestamp: rawData.update_time,
          total_volume: rawData.data.total_volume,
          volume_change_rate: rawData.data.volume_change_rate,
          predicted_volume: rawData.data.predicted_volume,
          city_stats: rawData.data.city_stats,
        };
      } else {
        // 兼容旧格式
        data = rawData as RealtimeData;
      }
      
      useRealtimeStore.getState().setData(data);
    }
  } catch (error) {
    console.error('[Realtime] 获取当前数据失败:', error);
  }
}
