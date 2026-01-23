import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { Box2, Mesh, Vector2, type Group } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { geoMercator } from "d3-geo";
import type { CityGeoJSON } from "@/types/map";
import District from "./district";
import { loadDistrictData } from "../helpers/loadDistrictData";

export interface DistrictMapProps {
  cityCode: number;
  depth?: number;
}

// 区县颜色列表 - 极兔品牌风格（浅灰白）
const districtColors = [
  { color: "#E8E8E8", sideColor: "#D0D0D0" },
];

// 浮岛间隙系数 - 区县级保持间隙效果
const GAP_FACTOR = 0.35;

export default function DistrictMap(props: DistrictMapProps) {
  const { cityCode, depth = 6 } = props;
  const groupRef = useRef<Group>(null!);
  const [mapData, setMapData] = useState<CityGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadDistrictData(cityCode)
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load district data:", err);
        setLoading(false);
      });
  }, [cityCode]);

  // 使用固定的中心点进行投影，确保地图居中显示
  // 根据城市面积动态调整缩放比例，保证小城市也能正常显示
  const projection = useMemo(() => {
    if (!mapData || mapData.features.length === 0) return null;
    
    // 计算所有区县的边界框
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    mapData.features.forEach((feature) => {
      // 遍历所有坐标点来计算真实边界
      feature.geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coord: number[]) => {
            minLng = Math.min(minLng, coord[0]);
            maxLng = Math.max(maxLng, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
          });
        });
      });
    });
    
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    
    // 计算经纬度跨度
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    const maxSpan = Math.max(lngSpan, latSpan);
    
    // 目标视口大小（Three.js单位），让地图铺满大约80的范围
    const TARGET_SIZE = 80;
    
    // 考虑浮岛间隙：间隙会让地图整体变大，需要额外的空间
    // GAP_FACTOR=0.35 意味着每个区块会向外偏移其到中心距离的35%
    // 整体地图大小约为原始大小的 (1 + GAP_FACTOR) 倍
    const GAP_EXPANSION = 1 + GAP_FACTOR;
    
    // 根据跨度动态计算缩放比例
    // 经验值：scale=1000时，1度约等于17.5个单位
    const UNITS_PER_DEGREE_AT_1000 = 17.5;
    
    // 计算需要的缩放比例，使地图（含间隙）铺满目标大小
    const scale = (TARGET_SIZE / (maxSpan * GAP_EXPANSION)) * (1000 / UNITS_PER_DEGREE_AT_1000);
    
    console.log(`[DistrictMap] 城市边界: lng(${minLng.toFixed(2)}-${maxLng.toFixed(2)}), lat(${minLat.toFixed(2)}-${maxLat.toFixed(2)}), span: ${maxSpan.toFixed(3)}, scale: ${scale.toFixed(0)}`);
    
    return geoMercator()
      .center([centerLng, centerLat])
      .scale(scale)
      .translate([0, 0]); // 投影到原点，确保居中
  }, [mapData]);

  const { regions, bbox } = useMemo(() => {
    if (!mapData || !projection) {
      return { regions: [], bbox: new Box2() };
    }

    const bbox = new Box2();
    
    // 计算所有区县的质心
    const districtCentroids: { x: number; y: number }[] = [];
    mapData.features.forEach((feature) => {
      const center = feature.properties.centroid ?? feature.properties.center;
      if (center) {
        const [x, y] = projection(center)!;
        districtCentroids.push({ x, y: -y });
      }
    });
    
    // 计算城市整体中心（用于偏移计算）
    const cityCenter = {
      x: districtCentroids.reduce((sum, c) => sum + c.x, 0) / districtCentroids.length,
      y: districtCentroids.reduce((sum, c) => sum + c.y, 0) / districtCentroids.length,
    };

    const toV2 = (coord: number[]) => {
      const [x, y] = projection(coord as [number, number])!;
      const projected = new Vector2(x, -y);
      bbox.expandByPoint(projected);
      return projected;
    };

    const regions: {
      name: string;
      centerId: [number, number, number];
      points: Vector2[][];
      colorIndex: number;
      offset: [number, number];
    }[] = [];

    mapData.features.forEach((feature, idx) => {
      const points = feature.geometry.coordinates.reduce<Vector2[][]>(
        (pre, cur) => [
          ...pre,
          ...cur.map<Vector2[]>((coordinates) => coordinates.map(toV2)),
        ],
        []
      );

      const center = feature.properties.centroid ?? feature.properties.center;
      const [x, y] = projection(center)!;
      const districtCenter = { x, y: -y };
      
      // 计算从城市中心指向区县中心的方向，沿此方向偏移
      const dx = districtCenter.x - cityCenter.x;
      const dy = districtCenter.y - cityCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const offset: [number, number] = distance > 0.1
        ? [dx * GAP_FACTOR, dy * GAP_FACTOR]
        : [0, 0];

      regions.push({
        name: feature.properties.name,
        centerId: [x, -y, depth + 0.1],
        points,
        colorIndex: idx % districtColors.length,
        offset,
      });
    });

    return { regions, bbox };
  }, [projection, mapData, depth]);

  // 区县地图入场动画 - 不触发mapPlayComplete，避免表单动效重新播放
  useLayoutEffect(() => {
    if (!groupRef.current || !mapData) return;
    
    const tl = gsap.timeline({ paused: true });

    // 只做地图本身的动画，不影响其他UI
    tl.add(
      tl.to(
        groupRef.current.scale,
        { x: 1, y: 1, z: 1, duration: 0.8, ease: "circ.out" },
        0
      )
    );
    groupRef.current.traverse((obj) => {
      if (obj instanceof Mesh || obj instanceof Line2) {
        tl.add(
          tl.to(obj.material, { opacity: 1, duration: 0.6, ease: "circ.out" }, 0.2),
          0
        );
      }
    });

    tl.play();

    return () => {
      tl.kill();
    };
  }, [mapData]);

  if (loading || !mapData) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      rotation={[-Math.PI / 2, 0, 0]}
      scale-z={0.01}
      position-x={20}>
      {regions.map((region, idx) => (
        <District
          key={idx}
          depth={depth}
          bbox={bbox}
          data={region}
          color={districtColors[region.colorIndex].color}
          sideColor={districtColors[region.colorIndex].sideColor}
          offset={region.offset}
        />
      ))}
    </group>
  );
}
