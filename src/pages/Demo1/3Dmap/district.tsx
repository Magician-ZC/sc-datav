import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

export interface DistrictProps {
  bbox: Box2;
  depth: number;
  color: string;
  sideColor: string;
  offset: [number, number];
  data: {
    name: string;
    centerId: [x: number, y: number, z: number];
    points: Vector2[][];
  };
}

export default function District(props: DistrictProps) {
  const { data, bbox, depth, color, sideColor, offset } = props;
  const groupRef = useRef<Group>(null!);
  const tooltipRef = useRef<{ open: () => void; close: () => void }>(null!);
  const vector3 = useRef(new Vector3(1, 1, 1));

  // 获取当前选中的城市名称
  const selectedCity = useConfigStore((s) => s.selectedCity);
  
  // 获取区县数据
  const districtInfo = getDistrictData(data.name);

  const [shape, shapeGeometry] = useMemo(() => {
    const shapes = data.points.map((e) => new Shape(e));
    const shapeGeometry = new ShapeGeometry(shapes);
    return [shapes, shapeGeometry];
  }, [data.points]);

  useFrame(() => {
    groupRef.current.scale.lerp(vector3.current, 0.1);
  });

  // 点击区县跳转到CRM地图（父页面跳转，因为当前是iframe）
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    
    // 构建跳转URL，带上city和district参数
    const params = new URLSearchParams();
    if (selectedCity) {
      // 去掉"市"后缀，与CRM地图参数格式一致
      params.set('city', selectedCity.replace('市', ''));
    }
    // 区县名称直接使用
    params.set('district', data.name);
    params.set('zoom', '15'); // 设置合适的缩放级别
    
    // 通过父页面跳转到CRM地图（因为当前组件在iframe中）
    const targetUrl = `/crm/map?${params.toString()}`;
    
    // 尝试跳转父页面，如果失败则跳转当前页面
    try {
      if (window.parent && window.parent !== window) {
        window.parent.location.href = targetUrl;
      } else {
        window.location.href = targetUrl;
      }
    } catch {
      // 跨域情况下使用postMessage
      window.parent.postMessage({ type: 'navigate', url: targetUrl }, '*');
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
      <lineSegments position-z={depth + 0.2} raycast={() => null}>
        <edgesGeometry args={[shapeGeometry]} />
        <lineBasicMaterial transparent opacity={0} color="#ffffff" />
      </lineSegments>

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
              zIndexRange={[100 - 1000]}>
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
