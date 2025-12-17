import { Html } from "@react-three/drei";
import { useImperativeHandle, useState, type Ref } from "react";
import styled from "styled-components";

const TooltipBox = styled.div`
  background: rgba(255, 245, 232, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 12px 16px;
  color: #656565;
  font-size: 12px;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 140px;
`;

const CityName = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #7c3aed;
  font-size: 14px;
`;

const DataItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 12px;

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
    population: number;
    totalCustomers: string;
    touchedRate: string;
    convertRate: string;
  };
  position: [number, number, number];
  visible: boolean;
}

export default function Tooltip(props: TooltipProps) {
  const { ref, data, position } = props;
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  return (
    visible && (
      <Html
        center
        position={position}
        distanceFactor={100}
        zIndexRange={[1001 - 1500]}
        style={{ pointerEvents: "none" }}>
        <TooltipBox>
          <CityName>📊 {data.city}</CityName>
          <DataItem>
            <Label>客户总数:</Label>
            <Value>{data.totalCustomers}</Value>
          </DataItem>
          <DataItem>
            <Label>触达率:</Label>
            <Value style={{ color: '#3b82f6' }}>{data.touchedRate}</Value>
          </DataItem>
          <DataItem>
            <Label>转化率:</Label>
            <Value style={{ color: '#10b981' }}>{data.convertRate}</Value>
          </DataItem>
        </TooltipBox>
      </Html>
    )
  );
}
