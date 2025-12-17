// 福建省城市配置 - 颜色
// 偏移量在base.tsx中根据质心位置动态计算

export interface CityConfig {
  color: string;      // 顶面颜色
  sideColor: string;  // 侧面颜色
}

// 城市颜色配置
export const cityColors: Record<string, CityConfig> = {
  福州市: { color: "#3498db", sideColor: "#2980b9" },
  厦门市: { color: "#e74c3c", sideColor: "#c0392b" },
  莆田市: { color: "#2ecc71", sideColor: "#27ae60" },
  三明市: { color: "#9b59b6", sideColor: "#8e44ad" },
  泉州市: { color: "#f39c12", sideColor: "#d68910" },
  漳州市: { color: "#1abc9c", sideColor: "#16a085" },
  南平市: { color: "#e67e22", sideColor: "#d35400" },
  龙岩市: { color: "#34495e", sideColor: "#2c3e50" },
  宁德市: { color: "#16a085", sideColor: "#1abc9c" },
};

// 默认配置
export const defaultCityConfig: CityConfig = {
  color: "#1a5276",
  sideColor: "#154360",
};

// 获取城市配置
export function getCityConfig(cityName: string): CityConfig {
  return cityColors[cityName] || defaultCityConfig;
}
