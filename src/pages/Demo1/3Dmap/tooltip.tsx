import { Html } from "@react-three/drei";
import { useImperativeHandle, useState, type Ref } from "react";
import styled from "styled-components";
import { useConfigStore } from "../stores";

const TooltipBox = styled.div<{ $scale: number }>`
  background: rgba(255, 245, 232, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: ${props => 12 * props.$scale}px ${props => 16 * props.$scale}px;
  color: #656565;
  font-size: ${props => 12 * props.$scale}px;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: ${props => 140 * props.$scale}px;
  transform: scale(${props => props.$scale});
  transform-origin: center bottom;
`;

const CityName = styled.div<{ $scale: number }>`
  font-weight: bold;
  margin-bottom: ${props => 8 * props.$scale}px;
  color: #7c3aed;
  font-size: ${props => 14 * props.$scale}px;
`;

const DataItem = styled.div<{ $scale: number }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => 4 * props.$scale}px;
  gap: ${props => 12 * props.$scale}px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.span`
  color: #6b7280;
`;

const Value = styled.span`
  font-weight: 600;
  color: #374151;
`;

interface TooltipProps {
  ref?: Ref<{ open: () => void; close: () => void }>;
  data: {
    city: string;
    population?: number;
    // 旧格式（CRM客户数据）
    totalCustomers?: string;
    touchedRate?: string;
    convertRate?: string;
    // 新格式（实时发单量数据）
    totalVolume?: string;
    franchiseeCount?: string;
    volumeRaw?: number;
  };
  position: [number, number, number];
  visible: boolean;
}

export default function Tooltip(props: TooltipProps) {
  const { ref, data, position } = props;
  const [visible, setVisible] = useState(false);
  const labelScale = useConfigStore((s) => s.labelScale);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  // 判断是否为实时发单量数据
  const isRealtimeData = data.totalVolume !== undefined;

  return (
    visible && (
      <Html
        center
        position={position}
        distanceFactor={100}
        zIndexRange={[1001 - 1500]}
        style={{ pointerEvents: "none" }}>
        <TooltipBox $scale={labelScale}>
          <CityName $scale={labelScale}>📊 {data.city}</CityName>
          {isRealtimeData ? (
            // 实时发单量数据展示
            <>
              <DataItem $scale={labelScale}>
                <Label>当前发单量:</Label>
                <Value style={{ color: '#ea580c' }}>{data.totalVolume} 单</Value>
              </DataItem>
              <DataItem $scale={labelScale}>
                <Label>加盟商数量:</Label>
                <Value style={{ color: '#3b82f6' }}>{data.franchiseeCount} 个</Value>
              </DataItem>
            </>
          ) : (
            // 旧格式CRM客户数据展示
            <>
              <DataItem $scale={labelScale}>
                <Label>客户总数:</Label>
                <Value>{data.totalCustomers}</Value>
              </DataItem>
              <DataItem $scale={labelScale}>
                <Label>触达率:</Label>
                <Value style={{ color: '#3b82f6' }}>{data.touchedRate}</Value>
              </DataItem>
              <DataItem $scale={labelScale}>
                <Label>转化率:</Label>
                <Value style={{ color: '#10b981' }}>{data.convertRate}</Value>
              </DataItem>
            </>
          )}
        </TooltipBox>
      </Html>
    )
  );
}
