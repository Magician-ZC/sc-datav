import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { fetchDistrictMapData, useMapStatsStore } from "./mapStatsStore";

// 导出其他stores
export { useEventStore, fetchTodayEvents } from "./eventStore";
export { useRealtimeStore, fetchCurrentData } from "./realtimeStore";
export { useMapStatsStore, fetchMapStatsData, fetchDistrictMapData, fetch2DChartData } from "./mapStatsStore";
export type { MapStatsData, CityMapStatsData } from "./mapStatsStore";

interface ConfigStore {
  mapPlayComplete: boolean;
  cloud: boolean;
  bar: boolean;
  rotation: boolean;
  bgMode: "light" | "starry";  // 背景模式: light(浅色) / starry(星空)
  mode: boolean;
  tooltipAlwaysShow: boolean;  // 面板信息是否始终显示（false时仅hover显示）
  // 地图视图状态
  viewLevel: "province" | "city";
  selectedCity: string | null;
  selectedCityCode: number | null;
  // 全屏状态
  isFullscreen: boolean;
  labelScale: number;  // 标签缩放比例
  toggle: (key: keyof Omit<ConfigStore, "toggle" | "setSelectedCity" | "backToProvince" | "toggleBgMode" | "setFullscreen">) => void;
  toggleBgMode: () => void;
  setSelectedCity: (city: string, adcode: number) => void;
  backToProvince: () => void;
  setFullscreen: (isFullscreen: boolean) => void;
}

export const useConfigStore = create<ConfigStore>()(
  subscribeWithSelector((set) => ({
    mapPlayComplete: false,
    cloud: true,
    bar: true,
    rotation: true,
    bgMode: "light",
    mode: true,
    tooltipAlwaysShow: false,  // 默认不显示面板信息
    viewLevel: "province",
    selectedCity: null,
    selectedCityCode: null,
    isFullscreen: false,
    labelScale: 1,
    toggle: (key) => set((s) => ({ [key]: !s[key] })),
    toggleBgMode: () => set((s) => ({ bgMode: s.bgMode === "light" ? "starry" : "light" })),
    // 切换视图时不重置mapPlayComplete，避免表单动效重新播放
    setSelectedCity: (city, adcode) => {
      set({ 
        viewLevel: "city", 
        selectedCity: city, 
        selectedCityCode: adcode,
      });
      // 获取区县级地图统计数据
      fetchDistrictMapData(city).then((data) => {
        useMapStatsStore.getState().setDistrictData(city, data);
        console.log(`[MapStats] 已加载 ${city} 区县数据:`, Object.keys(data).length, '个区县');
      });
    },
    backToProvince: () => set({ 
      viewLevel: "province", 
      selectedCity: null, 
      selectedCityCode: null,
    }),
    setFullscreen: (isFullscreen) => set({ 
      isFullscreen,
      // 全屏时放大1.5倍，退出全屏恢复
      labelScale: isFullscreen ? 1.5 : 1,
    }),
  }))
);
