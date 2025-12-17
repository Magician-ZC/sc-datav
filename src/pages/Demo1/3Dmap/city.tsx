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

import staticCityData from "../cityData";
import { getCityConfig } from "../cityConfig";
import { useConfigStore } from "../stores";
import { useRealtimeStore } from "../stores/realtimeStore";

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
}

export default function City(props: CityProps) {
  const { data, bbox, depth, adcode, offset } = props;
  const groupRef = useRef<Group>(null!);
  const tooltipRef = useRef<{ open: () => void; close: () => void }>(null!);
  const vector3 = useRef(new Vector3(1, 1, 1));

  const config = getCityConfig(data.city);
  const setSelectedCity = useConfigStore((s) => s.setSelectedCity);
  const viewLevel = useConfigStore((s) => s.viewLevel);
  
  // 获取实时数据，如果没有则使用静态数据
  const realtimeCityData = useRealtimeStore((s) => s.cityMapData);
  const cityData = realtimeCityData[data.city] ?? staticCityData[data.city as keyof typeof staticCityData];

  const [shape, shapeGeometry] = useMemo(() => {
    const shapes = data.points.map((e) => new Shape(e));
    const shapeGeometry = new ShapeGeometry(shapes);
    return [shapes, shapeGeometry];
  }, [data.points]);

  useFrame(() => {
    groupRef.current.scale.lerp(vector3.current, 0.1);
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (viewLevel === "province" && adcode) {
      setSelectedCity(data.city, adcode);
    }
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
      <lineSegments position-z={depth + 0.2} raycast={() => null}>
        <edgesGeometry args={[shapeGeometry]} />
        <lineBasicMaterial transparent opacity={0} color="#ffffff" />
      </lineSegments>

      <Bar
        position={data.cityId}
        value={cityData?.population ?? 0}>
        {(barHeight) => (
          <>
            <Label
              center
              position={[0, 0, barHeight + 0.2]}
              distanceFactor={100}
              zIndexRange={[100 - 1000]}>
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
