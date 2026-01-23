import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/**
 * 地图统计数据接口
 * 
 * 每个城市/区县的统计数据：
 * - 兔通达份额（后台配置）
 * - 触达件量（客户预计件量总和）
 * - 触达占比
 * - 发件量（极兔发件量总和）
 * - 今日拜访数
 * - 累计拜访数
 */
export interface MapStatsData {
  population: number;           // 用于光柱高度
  marketCapacity: string;       // 兔通达份额（格式化）
  touchedVolume: string;        // 触达件量（格式化）
  touchedRate: string;          // 触达占比
  cooperationVolume: string;    // 发件量（格式化）
  todayVisits: string;          // 今日拜访数
  totalVisits: string;          // 累计拜访数
  // 原始数值（用于图表）
  marketCapacityRaw: number;
  touchedVolumeRaw: number;
  cooperationVolumeRaw: number;
  // 辅助数据
  customerCount: string;
  cooperatedCount: string;
}

// 城市地图数据
export type CityMapStatsData = Record<string, MapStatsData>;

interface MapStatsStore {
  // 数据状态
  data: CityMapStatsData;           // 省级数据
  districtData: CityMapStatsData;   // 区县级数据
  currentCity: string | null;       // 当前选中的城市
  isConnected: boolean;
  lastUpdate: string | null;
  error: string | null;
  retryCount: number;
  
  // 操作方法
  setData: (data: CityMapStatsData) => void;
  setDistrictData: (city: string, data: CityMapStatsData) => void;
  setCurrentCity: (city: string | null) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  resetRetry: () => void;
  
  // 轮询连接（替代SSE，减少服务器压力）
  connect: () => void;
  disconnect: () => void;
}

let pollingTimer: ReturnType<typeof setInterval> | null = null;
const MAX_RETRY_COUNT = 3;
const POLLING_INTERVAL = 30000; // 地图统计轮询间隔：30秒

export const useMapStatsStore = create<MapStatsStore>()(
  subscribeWithSelector((set, get) => ({
    data: {},
    districtData: {},
    currentCity: null,
    isConnected: false,
    lastUpdate: null,
    error: null,
    retryCount: 0,
    
    setData: (data) => {
      set({
        data,
        lastUpdate: new Date().toISOString(),
        error: null,
        retryCount: 0,
      });
    },
    
    setDistrictData: (city, data) => {
      set({
        districtData: data,
        currentCity: city,
        lastUpdate: new Date().toISOString(),
      });
    },
    
    setCurrentCity: (city) => set({ currentCity: city }),
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
          
          const response = await fetch(`${baseUrl}/crm/api/map-stats/3d-map-data`);
          const result = await response.json();
          
          if (result.success && result.data) {
            get().setData(result.data);
            set({ isConnected: true, error: null, retryCount: 0 });
            console.log('[MapStats] 轮询获取数据成功');
          }
        } catch (error) {
          console.error('[MapStats] 轮询获取数据失败:', error);
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
      
      // 立即获取一次
      fetchData();
      
      // 启动定时轮询
      pollingTimer = setInterval(fetchData, POLLING_INTERVAL);
      console.log(`[MapStats] 轮询模式已启动，间隔 ${POLLING_INTERVAL / 1000} 秒`);
    },
    
    disconnect: () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
        console.log('[MapStats] 轮询已停止');
      }
      set({ isConnected: false, retryCount: 0 });
    },
  }))
);

/**
 * 获取当前地图统计数据（初始加载用）
 */
export async function fetchMapStatsData(): Promise<CityMapStatsData> {
  try {
    const baseUrl = window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
    
    const response = await fetch(`${baseUrl}/crm/api/map-stats/3d-map-data`);
    const result = await response.json();
    
    if (result.success && result.data) {
      useMapStatsStore.getState().setData(result.data);
      return result.data;
    }
    return {};
  } catch (error) {
    console.error('[MapStats] 获取地图数据失败:', error);
    return {};
  }
}

/**
 * 获取区县级地图数据
 */
export async function fetchDistrictMapData(city: string): Promise<CityMapStatsData> {
  try {
    const baseUrl = window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
    
    const response = await fetch(`${baseUrl}/crm/api/map-stats/district-map-data/${encodeURIComponent(city)}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    return {};
  } catch (error) {
    console.error('[MapStats] 获取区县地图数据失败:', error);
    return {};
  }
}

/**
 * 获取2D柱状图数据
 */
export async function fetch2DChartData(): Promise<{
  cities: string[];
  series: { name: string; data: number[] }[];
} | null> {
  try {
    const baseUrl = window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
    
    const response = await fetch(`${baseUrl}/crm/api/map-stats/2d-chart-data`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('[MapStats] 获取2D图表数据失败:', error);
    return null;
  }
}

/**
 * 今日员工拜访数据接口
 */
export interface EmployeeVisitData {
  user_id: number;
  user_name: string;
  department: string;
  new_customers: number;
  follow_ups: number;
  total_visits: number;
}

export interface EmployeeVisitsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: EmployeeVisitData[];
}

/**
 * 获取今日员工拜访数据
 */
export async function fetchTodayEmployeeVisits(
  page: number = 1, 
  pageSize: number = 10,
  city: string | null = null
): Promise<EmployeeVisitsResponse | null> {
  try {
    const baseUrl = window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
    
    let url = `${baseUrl}/crm/api/map-stats/today-employee-visits?page=${page}&page_size=${pageSize}`;
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('[MapStats] 获取今日员工拜访数据失败:', error);
    return null;
  }
}
