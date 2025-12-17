import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ConfigStore {
  mapPlayComplete: boolean;
  cloud: boolean;
  bar: boolean;
  rotation: boolean;
  bgMode: "light" | "starry";  // 背景模式: light(浅色) / starry(星空)
  mode: boolean;
  // 地图视图状态
  viewLevel: "province" | "city";
  selectedCity: string | null;
  selectedCityCode: number | null;
  toggle: (key: keyof Omit<ConfigStore, "toggle" | "setSelectedCity" | "backToProvince" | "toggleBgMode">) => void;
  toggleBgMode: () => void;
  setSelectedCity: (city: string, adcode: number) => void;
  backToProvince: () => void;
}

export const useConfigStore = create<ConfigStore>()(
  subscribeWithSelector((set) => ({
    mapPlayComplete: false,
    cloud: true,
    bar: true,
    rotation: true,
    bgMode: "light",
    mode: true,
    viewLevel: "province",
    selectedCity: null,
    selectedCityCode: null,
    toggle: (key) => set((s) => ({ [key]: !s[key] })),
    toggleBgMode: () => set((s) => ({ bgMode: s.bgMode === "light" ? "starry" : "light" })),
    // 切换视图时不重置mapPlayComplete，避免表单动效重新播放
    setSelectedCity: (city, adcode) => set({ 
      viewLevel: "city", 
      selectedCity: city, 
      selectedCityCode: adcode,
    }),
    backToProvince: () => set({ 
      viewLevel: "province", 
      selectedCity: null, 
      selectedCityCode: null,
    }),
  }))
);
