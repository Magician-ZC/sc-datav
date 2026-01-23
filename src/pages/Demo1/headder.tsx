import type { ComponentProps } from "react";
import styled from "styled-components";
import { useConfigStore } from "./stores";

const TitleWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
`;

const Title = styled.div`
  font-size: 36px;
  letter-spacing: 8px;
  color: #fff;
  text-shadow: 0 8px 10px rgba(220, 38, 38, 0.8);
  font-weight: 700;
  background: linear-gradient(to bottom, #dc2626, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;

  &::after {
    content: "ACC CUSTOMER STRATEGY MAP";
    display: block;
    font-size: 12px;
    letter-spacing: 12px;
    text-align: center;
    color: rgba(220, 38, 38, 0.6);
    margin-top: -5px;
    -webkit-text-fill-color: rgba(220, 38, 38, 0.6);
  }
`;

// 背景SVG组件，支持深色/浅色模式
const BgSvg = ({ isDark }: { isDark: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1920 82"
    width="100%"
    height="100%"
    preserveAspectRatio="none"
    style={{ position: 'absolute', inset: 0, zIndex: -1 }}
  >
    <defs>
      <radialGradient id="radialGradient" cx="50%" cy="50%" fx="100%" fy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" stopOpacity="1" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id="svgline-1">
        <circle r="100" cx="0" cy="0" fill="url(#radialGradient)">
          <animateMotion
            begin="0s"
            dur="3s"
            path="M0,60 L620,60 L670,80 L960,80"
            rotate="auto"
            keyPoints="0;1"
            keyTimes="0;1"
            repeatCount="indefinite"
          />
        </circle>
      </mask>
      <mask id="svgline-2">
        <circle r="100" cx="0" cy="0" fill="url(#radialGradient)">
          <animateMotion
            begin="0s"
            dur="3s"
            path="M1920,60 L1300,60 L1250,80 L960,80"
            rotate="auto"
            keyPoints="0;1"
            keyTimes="0;1"
            repeatCount="indefinite"
          />
        </circle>
      </mask>
    </defs>
    <path
      d="M0,0 L1920,0 L1920,60 L1300,60 L1250,80 L670,80 L620,60 L0,60 Z"
      fill={isDark ? "#26282a" : "rgb(255, 245, 232)"}
    />
    <path
      d="M0,60 L620,60 L670,80 L1250,80 L1300,60 L1920,60"
      fill="none"
      stroke="rgb(234, 88, 12)"
      strokeWidth="1"
    />
    <path
      d="M0,60 L620,60 L670,80 L960,80"
      fill="none"
      stroke="#ff6715"
      strokeWidth="4"
      mask="url(#svgline-1)"
    />
    <path
      d="M1920,60 L1300,60 L1250,80 L960,80"
      fill="none"
      stroke="#ff6715"
      strokeWidth="4"
      mask="url(#svgline-2)"
    />
  </svg>
);

export default function Headder(props: ComponentProps<typeof TitleWrapper>) {
  const bgMode = useConfigStore((s) => s.bgMode);
  const isDark = bgMode === "starry";
  
  return (
    <TitleWrapper {...props}>
      <BgSvg isDark={isDark} />
      <Title>ACC客户战略地图</Title>
    </TitleWrapper>
  );
}
