// 从后端代理加载区县级GeoJSON数据（避免阿里云DataV的403限流）
import type { CityGeoJSON } from "@/types/map";

// 使用后端代理，避免前端直接请求阿里云被限流
const PROXY_BASE_URL = "/crm/api/map/district";

// 缓存已加载的数据
const cache = new Map<number, CityGeoJSON>();

/**
 * 加载指定城市的区县级GeoJSON数据
 * @param adcode 城市行政区划代码
 * @returns GeoJSON数据
 */
export async function loadDistrictData(adcode: number): Promise<CityGeoJSON> {
  // 检查缓存
  if (cache.has(adcode)) {
    return cache.get(adcode)!;
  }

  try {
    // 通过后端代理加载数据
    const url = `${PROXY_BASE_URL}/${adcode}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load district data: ${response.status}`);
    }
    
    const data = await response.json() as CityGeoJSON;
    
    // 缓存数据
    cache.set(adcode, data);
    
    return data;
  } catch (error) {
    console.error(`Error loading district data for adcode ${adcode}:`, error);
    throw error;
  }
}

/**
 * 清除缓存
 */
export function clearDistrictCache() {
  cache.clear();
}
