import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { Box2, Mesh, Vector2, type Group } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { geoMercator } from "d3-geo";
import type { CityGeoJSON } from "@/types/map";
import City, { type CityProps } from "./city";
import { useConfigStore } from "../stores";

export interface BaseProps {
  depth?: number;
  data: CityGeoJSON;
  outlineData?: CityGeoJSON;
}

// 浮岛间隙系数 - 控制区域之间的间距大小（增大以便更好展示tooltip）
const GAP_FACTOR = 0.6;

export default function Base(props: BaseProps) {
  const { data, depth = 6 } = props;
  const groupRef = useRef<Group>(null!);
  const camera = useThree((state) => state.camera);

  const projection = useMemo(() => {
    return geoMercator()
      .center(data.features[0].properties.centroid)
      .scale(1000)
      .translate([0, 0]);
  }, [data]);

  const { regions, bbox } = useMemo(() => {
    const regions: (CityProps["data"] & { adcode?: number; offset: [number, number] })[] = [];
    const bbox = new Box2();
    
    // 先计算所有城市的质心投影坐标
    const cityCentroids: { x: number; y: number }[] = [];
    
    data.features.forEach((feature) => {
      const center = feature.properties.centroid ?? feature.properties.center;
      const [x, y] = projection(center)!;
      cityCentroids.push({ x, y: -y });
    });
    
    // 计算省的整体中心（所有城市质心的平均值）
    const provinceCenter = {
      x: cityCentroids.reduce((sum, c) => sum + c.x, 0) / cityCentroids.length,
      y: cityCentroids.reduce((sum, c) => sum + c.y, 0) / cityCentroids.length,
    };

    const toV2 = (coord: number[]) => {
      const [x, y] = projection(coord as [number, number])!;
      const projected = new Vector2(x, -y);
      bbox.expandByPoint(projected);
      return projected;
    };

    data.features.forEach((feature) => {
      const points = feature.geometry.coordinates.reduce<Vector2[][]>(
        (pre, cur) => [
          ...pre,
          ...cur.map<Vector2[]>((coordinates) => coordinates.map(toV2)),
        ],
        []
      );

      const center = feature.properties.centroid ?? feature.properties.center;
      const [x, y] = projection(center)!;
      const cityCenter = { x, y: -y };
      
      // 计算从省中心指向城市中心的方向向量
      const dx = cityCenter.x - provinceCenter.x;
      const dy = cityCenter.y - provinceCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 沿着这个方向偏移，偏移量与距离成正比
      const offset: [number, number] = distance > 0.1 
        ? [dx * GAP_FACTOR, dy * GAP_FACTOR]
        : [0, 0];

      regions.push({
        city: feature.properties.name,
        cityId: [x, -y, depth + 0.1],
        points,
        adcode: feature.properties.adcode,
        offset,
      });
    });

    return {
      regions,
      bbox,
    };
  }, [projection, data, depth]);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        useConfigStore.setState({ mapPlayComplete: true });
      },
    });

    // 摄像头动画：从远处移动到近处，更好的展示效果
    tl.add(
      gsap.to(camera.position, {
        x: 30,
        y: 70,
        z: 100,
        duration: 2,
        ease: "circ.out",
      })
    );
    tl.add(
      tl.to(
        groupRef.current.scale,
        { x: 1, y: 1, z: 1, duration: 1, ease: "circ.out" },
        2
      )
    );
    groupRef.current.traverse((obj) => {
      if (obj instanceof Mesh || obj instanceof Line2) {
        tl.add(
          tl.to(obj.material, { opacity: 1, duration: 1, ease: "circ.out" }, 2),
          3
        );
      }
    });

    tl.play();

    return () => {
      tl.kill();
    };
  }, [camera]);

  return (
    <group
      ref={groupRef}
      rotation={[-Math.PI / 2, 0, 0]}
      scale-z={0.01}
      position-x={20}>
      {regions.map((region, idx) => (
        <City
          key={idx}
          depth={depth}
          bbox={bbox}
          data={region}
          adcode={region.adcode}
          offset={region.offset}
          alwaysShowTooltip={true}
        />
      ))}
    </group>
  );
}
