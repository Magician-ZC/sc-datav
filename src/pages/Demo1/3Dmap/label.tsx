import { Html } from "@react-three/drei";
import type { ComponentProps } from "react";
import styled from "styled-components";
import { useConfigStore } from "../stores";

type HtmlProps = ComponentProps<typeof Html>;

const StyledLabel = styled.div<{ $scale: number }>`
  pointer-events: auto;
  cursor: pointer;
  width: max-content;
  display: flex;
  background: #ffffff;
  border: 1px solid #E60000;
  color: #333333;
  font-size: ${(props) => 16 * props.$scale}px;
  font-weight: 500;
  padding-inline: ${(props) => 4 * props.$scale}px;
  padding-block: ${(props) => 1 * props.$scale}px;
  border-radius: 3px;
  transform: scale(${(props) => props.$scale});
  transform-origin: center bottom;
  
  &:hover {
    background: #fff5f5;
    border-color: #cc0000;
  }
`;

interface LabelProps extends HtmlProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function Label(props: LabelProps) {
  const labelScale = useConfigStore((s) => s.labelScale);
  const { children, onClick, ...htmlProps } = props;

  return (
    <Html {...htmlProps}>
      <StyledLabel $scale={labelScale} onClick={onClick}>
        {children}
      </StyledLabel>
    </Html>
  );
}
