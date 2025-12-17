// 区县数据 - 用于区县级地图展示
// 由于区县数据较多，这里提供一个通用的生成函数
// 实际使用时可以替换为真实数据

export interface DistrictInfo {
  population: number;
  totalCustomers: string;
  touchedRate: string;
  convertRate: string;
}

// 区县数据缓存
const districtDataCache: Record<string, DistrictInfo> = {};

// 根据区县名称生成模拟数据（实际项目中应从API获取）
export function getDistrictData(districtName: string): DistrictInfo {
  if (districtDataCache[districtName]) {
    return districtDataCache[districtName];
  }

  // 使用名称hash生成稳定的随机数据
  let hash = 0;
  for (let i = 0; i < districtName.length; i++) {
    hash = (hash << 5) - hash + districtName.charCodeAt(i);
    hash = hash & hash;
  }

  const population = 100 + Math.abs(hash % 500);
  const touchedRate = 50 + Math.abs((hash >> 4) % 30);
  const convertRate = 25 + Math.abs((hash >> 8) % 25);

  const data: DistrictInfo = {
    population,
    totalCustomers: population.toLocaleString(),
    touchedRate: `${touchedRate}%`,
    convertRate: `${convertRate}%`,
  };

  districtDataCache[districtName] = data;
  return data;
}
