import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { Box2, LineSegments, Mesh, Vector2, type Group } from "three";
import { geoMercator } from "d3-geo";
import type { CityGeoJSON } from "@/types/map";
import District from "./district";
import { loadDistrictData } from "../helpers/loadDistrictData";

export interface DistrictMapProps {
  cityCode: number;
  depth?: number;
}

// 区县颜色列表
const districtColors = [
  { color: "#3498db", sideColor: "#2980b9" },
  { color: "#e74c3c", sideColor: "#c0392b" },
  { color: "#2ecc71", sideColor: "#27ae60" },
  { color: "#9b59b6", sideColor: "#8e44ad" },
  { color: "#f39c12", sideColor: "#d68910" },
  { color: "#1abc9c", sideColor: "#16a085" },
  { color: "#e67e22", sideColor: "#d35400" },
  { color: "#34495e", sideColor: "#2c3e50" },
  { color: "#27ae60", sideColor: "#2ecc71" },
  { color: "#c0392b", sideColor: "#e74c3c" },
  { color: "#d35400", sideColor: "#e67e22" },
  { color: "#8e44ad", sideColor: "#9b59b6" },
  { color: "#2980b9", sideColor: "#3498db" },
];

// 浮岛间隙系数 - 区县级更大
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
  const projection = useMemo(() => {
    if (!mapData || mapData.features.length === 0) return null;
    
    // 计算所有区县的边界框中心作为投影中心
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    mapData.features.forEach((feature) => {
      const center = feature.properties.centroid ?? feature.properties.center;
      if (center) {
        minLng = Math.min(minLng, center[0]);
        maxLng = Math.max(maxLng, center[0]);
        minLat = Math.min(minLat, center[1]);
        maxLat = Math.max(maxLat, center[1]);
      }
    });
    
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    
    return geoMercator()
      .center([centerLng, centerLat])
      .scale(2500)  // 放大2.5倍
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
      if (obj instanceof Mesh || obj instanceof LineSegments) {
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
