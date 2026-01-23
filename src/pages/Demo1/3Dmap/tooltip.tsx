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
  min-width: ${props => 180 * props.$scale}px;
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
  ref?: Ref<{ open: () => void; close: () => void; setAlwaysShow: (show: boolean) => void }>;
  data: {
    city: string;
    population?: number;
    // 新格式（地图统计数据）
    marketCapacity?: string;
    touchedVolume?: string;
    touchedRate?: string;
    cooperationVolume?: string;
    todayVisits?: string;
    totalVisits?: string;
    // 旧格式（CRM客户数据）- 兼容
    totalCustomers?: string;
    touchedRate_old?: string;
    convertRate?: string;
    // 实时发单量数据 - 兼容
    totalVolume?: string;
    franchiseeCount?: string;
    volumeRaw?: number;
  };
  position: [number, number, number];
  visible: boolean;
}

export default function Tooltip(props: TooltipProps) {
  const { ref, data, position, visible: initialVisible } = props;
  const [visible, setVisible] = useState(initialVisible);
  const [alwaysShow, setAlwaysShow] = useState(false);
  const labelScale = useConfigStore((s) => s.labelScale);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => {
      // 如果设置了始终显示，则不关闭
      if (!alwaysShow) {
        setVisible(false);
      }
    },
    // 设置始终显示模式
    setAlwaysShow: (show: boolean) => {
      setAlwaysShow(show);
      // show=true时显示，show=false时立即隐藏
      setVisible(show);
    },
  }));

  // 判断数据类型
  const isMapStatsData = data.marketCapacity !== undefined;
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
          {isMapStatsData ? (
            // 新格式：地图统计数据展示
            <>
              <DataItem $scale={labelScale}>
                <Label>兔通达件量:</Label>
                <Value style={{ color: '#6366f1' }}>{data.marketCapacity} 单/日</Value>
              </DataItem>
              <DataItem $scale={labelScale}>
                <Label>触达件量:</Label>
                <Value style={{ color: '#ea580c' }}>{data.touchedVolume} 单</Value>
              </DataItem>
              <DataItem $scale={labelScale}>
                <Label>触达占比:</Label>
                <Value style={{ color: '#10b981' }}>{data.touchedRate}</Value>
              </DataItem>
              <DataItem $scale={labelScale}>
                <Label>发件量:</Label>
                <Value style={{ color: '#f59e0b' }}>{data.cooperationVolume} 单</Value>
              </DataItem>
            </>
          ) : isRealtimeData ? (
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
                <Value style={{ color: '#3b82f6' }}>{data.touchedRate_old}</Value>
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
