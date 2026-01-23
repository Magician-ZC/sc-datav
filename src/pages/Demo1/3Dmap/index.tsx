import styled from "styled-components";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls, Stars } from "@react-three/drei";
import Lights from "./lights";
import Scene from "./scene";
import { useConfigStore } from "../stores";

const CanvasWrapper = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

export default function Index() {
  const bgMode = useConfigStore((s) => s.bgMode);

  return (
    <CanvasWrapper>
      <Canvas
        flat
        shadows
        camera={{ position: [-20, 60, 120], fov: 50, far: 2000, near: 1 }}
        dpr={[1, 2]}
>
        <color attach="background" args={[bgMode === "starry" ? "#FFFFFF" : "#FAFAFA"]} />
        {bgMode === "starry" && (
          <>
            <Stars fade count={1000} factor={8} saturation={0} speed={2} />
            <Grid
              infiniteGrid
              position={[0, -1, 0]}
              cellSize={10}
              cellThickness={0.6}
              sectionSize={50}
              sectionThickness={1.5}
              sectionColor="#7fe5a8"
              cellColor="#6f6f6f"
              fadeDistance={500}
              fadeStrength={1}
            />
          </>
        )}
        <Lights />

        <Scene />

        {/* 星空模式下隐藏ContactShadows，避免与Grid产生z-fighting */}
        {bgMode !== "starry" && (
          <ContactShadows
            opacity={0.5}
            scale={300}
            blur={0.5}
            resolution={256}
            color="#000000"
          />
        )}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          zoomSpeed={0.3}
          minDistance={80}
          maxDistance={250}
          maxPolarAngle={1.5}
        />
      </Canvas>
    </CanvasWrapper>
  );
}
