import { Html } from "@react-three/drei";
import type { ComponentProps } from "react";
import styled from "styled-components";
import { useConfigStore } from "../stores";

type HtmlProps = ComponentProps<typeof Html>;

const StyledLabel = styled.div<{ $scale: number }>`
  pointer-events: none;
  width: max-content;
  display: flex;
  background: #ffffff;
  border: 1px solid currentColor;
  color: #fdb961;
  font-size: ${(props) => 14 * props.$scale}px;
  padding-inline: ${(props) => 4 * props.$scale}px;
  border-radius: 4px;
  transform: scale(${(props) => props.$scale});
  transform-origin: center bottom;
`;

export default function Label(
  props: HtmlProps & { children?: React.ReactNode }
) {
  const labelScale = useConfigStore((s) => s.labelScale);
  const { children, ...htmlProps } = props;

  return (
    <Html {...htmlProps}>
      <StyledLabel $scale={labelScale}>{children}</StyledLabel>
    </Html>
  );
}
