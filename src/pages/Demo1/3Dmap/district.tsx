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
import { getDistrictData } from "../districtData";
import { useConfigStore } from "../stores";
import { useMapStatsStore } from "../stores/mapStatsStore";

export interface DistrictProps {
  bbox: Box2;
  depth: number;
  color: string;
  sideColor: string;
  offset: [number, number];
  alwaysShowTooltip?: boolean; // 是否始终显示tooltip
  data: {
    name: string;
    centerId: [x: number, y: number, z: number];
    points: Vector2[][];
  };
}

export default function District(props: DistrictProps) {
  const { data, bbox, depth, color, sideColor, offset, alwaysShowTooltip = true } = props;
  const groupRef = useRef<Group>(null!);
  const tooltipRef = useRef<{ open: () => void; close: () => void; setAlwaysShow: (show: boolean) => void }>(null!);
  const vector3 = useRef(new Vector3(1, 1, 1));

  // 获取当前选中的城市名称
  const mapPlayComplete = useConfigStore((s) => s.mapPlayComplete);
  const tooltipAlwaysShow = useConfigStore((s) => s.tooltipAlwaysShow);
  
  // 优先使用地图统计数据中的区县数据
  const districtStatsData = useMapStatsStore((s) => s.districtData);
  
  // 获取区县数据：优先使用API数据，回退到静态数据
  const staticDistrictInfo = getDistrictData(data.name);
  const districtInfo = districtStatsData[data.name] ?? staticDistrictInfo;

  // 地图加载完成后根据tooltipAlwaysShow状态决定是否自动显示tooltip
  useEffect(() => {
    if (mapPlayComplete && tooltipRef.current) {
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

  // 点击区县 - 通知父页面切换到2D视图并定位到该区县
  const handleClick = (e?: { stopPropagation: () => void }) => {
    e?.stopPropagation();
    
    const districtName = data.name;
    
    // 通过 postMessage 通知父页面（dashboard）切换到2D视图
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'navigateToDistrict',
          district: districtName,
          zoom: 14
        }, '*');
      }
    } catch (err) {
      console.error('发送消息失败:', err);
    }
  };

  return (
    <group
      ref={groupRef}
      position={[offset[0], offset[1], 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        vector3.current.setZ(1.3);
        tooltipRef.current.open();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        vector3.current.setZ(1);
        tooltipRef.current.close();
        document.body.style.cursor = "auto";
      }}>
      <ShapeMesh position-z={depth + 0.1} bbox={bbox} args={[shape]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </ShapeMesh>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth, steps: 1, bevelEnabled: false }]} />
        <meshStandardMaterial
          transparent
          opacity={0}
          metalness={0.2}
          roughness={0.5}
          side={DoubleSide}
          color={sideColor}
        />
      </mesh>
      {linePoints.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#E60000"
          lineWidth={2}
          transparent
          opacity={0}
        />
      ))}

      <Bar
        position={data.centerId}
        value={districtInfo.population}
        max={600}
        factor={4}>
        {(barHeight) => (
          <>
            <Label
              center
              position={[0, 0, barHeight + 0.2]}
              distanceFactor={100}
              zIndexRange={[100 - 1000]}
              onClick={handleClick}>
              {data.name}
            </Label>
            <Tooltip
              ref={tooltipRef}
              data={{
                city: data.name,
                ...districtInfo,
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
