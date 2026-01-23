// 福建省城市配置 - 颜色
// 偏移量在base.tsx中根据质心位置动态计算

export interface CityConfig {
  color: string;      // 顶面颜色
  sideColor: string;  // 侧面颜色
}

// 城市颜色配置 - 白色顶面
export const cityColors: Record<string, CityConfig> = {
  福州市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  厦门市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  莆田市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  三明市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  泉州市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  漳州市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  南平市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  龙岩市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
  宁德市: { color: "#FFFFFF", sideColor: "#F0F0F0" },
};

// 默认配置 - 白色
export const defaultCityConfig: CityConfig = {
  color: "#FFFFFF",
  sideColor: "#F0F0F0",
};

// 获取城市配置
export function getCityConfig(cityName: string): CityConfig {
  return cityColors[cityName] || defaultCityConfig;
}
