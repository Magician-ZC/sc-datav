import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import {
  DoubleSide,
  Shape,
  ShapeGeometry,
  Vector3,
  type Box2,
  type Group,
  type Vector2,
} from "three";
import ShapeMesh from "./shape";
import Tooltip from "./tooltip";
import Bar from "./bar";
import Label from "./label";

import staticCityData from "../cityData";
import { getCityConfig } from "../cityConfig";
import { useConfigStore } from "../stores";
import { useRealtimeStore } from "../stores/realtimeStore";
import { useMapStatsStore } from "../stores/mapStatsStore";

export interface CityProps {
  bbox: Box2;
  depth: number;
  adcode?: number;
  offset: [number, number]; // 浮岛偏移量
  data: {
    city: string;
    cityId: [x: number, y: number, z: number];
    points: Vector2[][];
  };
  alwaysShowTooltip?: boolean; // 是否始终显示tooltip
}

export default function City(props: CityProps) {
  const { data, bbox, depth, adcode, offset, alwaysShowTooltip = true } = props;
  const groupRef = useRef<Group>(null!);
  const tooltipRef = useRef<{ open: () => void; close: () => void; setAlwaysShow: (show: boolean) => void }>(null!);
  const vector3 = useRef(new Vector3(1, 1, 1));

  const config = getCityConfig(data.city);
  const setSelectedCity = useConfigStore((s) => s.setSelectedCity);
  const viewLevel = useConfigStore((s) => s.viewLevel);
  const mapPlayComplete = useConfigStore((s) => s.mapPlayComplete);
  const tooltipAlwaysShow = useConfigStore((s) => s.tooltipAlwaysShow);
  
  // 优先使用地图统计数据，其次是实时数据，最后是静态数据
  const mapStatsData = useMapStatsStore((s) => s.data);
  const districtData = useMapStatsStore((s) => s.districtData);
  const realtimeCityData = useRealtimeStore((s) => s.cityMapData);
  const realtimeData = useRealtimeStore((s) => s.data);
  
  // 根据视图级别选择数据源
  // 区县级视图使用districtData，省级视图使用mapStatsData
  const baseCityData = viewLevel === "city"
    ? (districtData[data.city] ?? realtimeCityData[data.city] ?? staticCityData[data.city as keyof typeof staticCityData])
    : (mapStatsData[data.city] ?? realtimeCityData[data.city] ?? staticCityData[data.city as keyof typeof staticCityData]);
  
  // 从实时推送数据获取发件量（城市名可能有/无"市"后缀）
  const cityNameWithoutSuffix = data.city.endsWith('市') ? data.city.slice(0, -1) : data.city;
  const realtimeVolume = realtimeData?.city_stats?.[cityNameWithoutSuffix]?.volume || 
                         realtimeData?.city_stats?.[data.city]?.volume || 0;
  
  // 合并数据：优先使用实时发件量
  const cityData = baseCityData ? {
    ...baseCityData,
    // 如果有实时发件量，覆盖 cooperationVolume
    ...(realtimeVolume > 0 ? { cooperationVolume: realtimeVolume.toLocaleString() } : {}),
  } : undefined;

  // 地图加载完成后根据tooltipAlwaysShow状态决定是否自动显示tooltip
  useEffect(() => {
    if (mapPlayComplete && tooltipRef.current) {
      // 延迟显示，等待动画完成
      const timer = setTimeout(() => {
        // 根据alwaysShowTooltip属性和全局tooltipAlwaysShow状态决定是否始终显示
        const shouldAlwaysShow = alwaysShowTooltip && tooltipAlwaysShow;
        tooltipRef.current?.setAlwaysShow(shouldAlwaysShow);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [alwaysShowTooltip, mapPlayComplete, tooltipAlwaysShow]);

  const [shape, , linePoints] = useMemo(() => {
    const shapes = data.points.map((e) => new Shape(e));
    const shapeGeometry = new ShapeGeometry(shapes);
    // 提取边界线点用于粗线条渲染
    const lines: [number, number, number][][] = data.points.map((polygon) =>
      polygon.map((p) => [p.x, p.y, depth + 0.2] as [number, number, number])
    );
    return [shapes, shapeGeometry, lines];
  }, [data.points, depth]);

  useFrame(() => {
    groupRef.current.scale.lerp(vector3.current, 0.1);
  });

  const handleClick = (e?: { stopPropagation: () => void }) => {
    e?.stopPropagation();
    if (viewLevel === "province" && adcode) {
      setSelectedCity(data.city, adcode);
    }
  };

  // Label点击处理（HTML元素点击）
  const handleLabelClick = () => {
    handleClick();
  };

  return (
    <group
      ref={groupRef}
      position={[offset[0], offset[1], 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        vector3.current.setZ(1.5);
        tooltipRef.current.open();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        vector3.current.setZ(1);
        tooltipRef.current.close();
        document.body.style.cursor = "auto";
      }}>
      <ShapeMesh position-z={depth + 0.1} bbox={bbox} args={[shape]}>
        <meshStandardMaterial color={config.color} metalness={0.3} roughness={0.6} />
      </ShapeMesh>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth, steps: 1, bevelEnabled: false }]} />
        <meshStandardMaterial
          transparent
          opacity={0}
          metalness={0.2}
          roughness={0.5}
          side={DoubleSide}
          color={config.sideColor}
        />
      </mesh>
      {linePoints.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#E60000"
          lineWidth={2}
        />
      ))}

      <Bar
        position={data.cityId}
        value={cityData?.population ?? 0}>
        {(barHeight) => (
          <>
            <Label
              center
              position={[0, 0, barHeight + 0.2]}
              distanceFactor={100}
              zIndexRange={[100 - 1000]}
              onClick={handleLabelClick}>
              {data.city}
            </Label>
            <Tooltip
              ref={tooltipRef}
              data={{
                city: data.city,
                ...cityData,
              }}
              position={[0, 0, barHeight + 7]}
              visible={false}
            />
          </>
        )}
      </Bar>
    </group>
  );
}
