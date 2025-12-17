import styled from "styled-components";
import { useRealtimeStore } from "./stores/realtimeStore";
import { useConfigStore } from "./stores";
import AnimatedNumber from "./components/AnimatedNumber";

// 面板容器 - 左侧
const PanelContainer = styled.div<{ $isLight: boolean }>`
  position: fixed;
  left: 30px;
  top: 120px;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
  pointer-events: auto;
`;

// 数据卡片
const DataCard = styled.div<{ $isLight: boolean }>`
  background: ${props => props.$isLight 
    ? 'rgba(255, 245, 232, 0.9)' 
    : 'rgba(30, 30, 40, 0.85)'};
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid ${props => props.$isLight 
    ? 'rgba(234, 88, 12, 0.2)' 
    : 'rgba(255, 255, 255, 0.1)'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const CardTitle = styled.div<{ $isLight: boolean }>`
  font-size: 13px;
  color: ${props => props.$isLight ? '#6b7280' : '#9ca3af'};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MainValue = styled.div<{ $isLight: boolean }>`
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => (props.$isLight ? "#ea580c" : "#fb923c")};
  text-shadow: ${(props) =>
    props.$isLight ? "none" : "0 2px 10px rgba(251, 146, 60, 0.3)"};
`;

const SubValue = styled.div<{ $isLight: boolean; $positive?: boolean }>`
  font-size: 14px;
  color: ${props => {
    if (props.$positive === undefined) return props.$isLight ? '#6b7280' : '#9ca3af';
    return props.$positive ? '#10b981' : '#ef4444';
  }};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// 平台列表
const PlatformList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const PlatformItem = styled.div<{ $isLight: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.$isLight 
    ? 'rgba(234, 88, 12, 0.08)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
`;

const PlatformName = styled.span<{ $isLight: boolean }>`
  font-size: 13px;
  color: ${props => props.$isLight ? '#374151' : '#e5e7eb'};
`;

const PlatformVolume = styled.span<{ $isLight: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$isLight ? '#ea580c' : '#fb923c'};
`;

// TOP加盟商列表
const RankList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  max-height: 280px;
  overflow-y: auto;
  pointer-events: auto;
  
  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(234, 88, 12, 0.4);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(234, 88, 12, 0.6);
  }
`;

const RankItem = styled.div<{ $isLight: boolean; $rank: number }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: ${props => props.$isLight 
    ? 'rgba(234, 88, 12, 0.05)' 
    : 'rgba(255, 255, 255, 0.03)'};
  border-radius: 6px;
`;

const RankBadge = styled.span<{ $rank: number }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.$rank === 1) return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
    if (props.$rank === 2) return 'linear-gradient(135deg, #9ca3af, #6b7280)';
    if (props.$rank === 3) return 'linear-gradient(135deg, #cd7f32, #b87333)';
    return 'rgba(107, 114, 128, 0.3)';
  }};
  color: ${props => props.$rank <= 3 ? 'white' : '#9ca3af'};
`;

const RankName = styled.span<{ $isLight: boolean }>`
  flex: 1;
  font-size: 12px;
  color: ${props => props.$isLight ? '#374151' : '#d1d5db'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RankVolume = styled.span<{ $isLight: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$isLight ? '#ea580c' : '#fb923c'};
`;

// 连接状态指示器
const ConnectionStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${props => props.$connected ? '#10b981' : '#ef4444'};
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$connected ? '#10b981' : '#ef4444'};
    animation: ${props => props.$connected ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const UpdateTime = styled.div<{ $isLight: boolean }>`
  font-size: 11px;
  color: ${props => props.$isLight ? '#9ca3af' : '#6b7280'};
  margin-top: 8px;
`;

export default function RealtimePanel() {
  const data = useRealtimeStore((s) => s.data);
  const isConnected = useRealtimeStore((s) => s.isConnected);
  const lastUpdate = useRealtimeStore((s) => s.lastUpdate);
  const bgMode = useConfigStore((s) => s.bgMode);
  const mode = useConfigStore((s) => s.mode);
  const isLight = bgMode === "light";

  // 关闭了mode时不显示面板
  if (!mode) return null;

  // 没有数据时显示等待状态
  if (!data) {
    return (
      <PanelContainer $isLight={isLight}>
        <DataCard $isLight={isLight}>
          <CardTitle $isLight={isLight}>
            📦 实时发单数据
            <ConnectionStatus $connected={isConnected}>
              {isConnected ? '已连接' : '连接中...'}
            </ConnectionStatus>
          </CardTitle>
          <MainValue $isLight={isLight} style={{ fontSize: '18px', opacity: 0.6 }}>
            等待数据推送...
          </MainValue>
          <SubValue $isLight={isLight}>
            请确保爬虫服务正在运行
          </SubValue>
        </DataCard>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer $isLight={isLight}>
      {/* 总发单量卡片 */}
      <DataCard $isLight={isLight}>
        <CardTitle $isLight={isLight}>
          📦 当前发单总量
          <ConnectionStatus $connected={isConnected}>
            {isConnected ? '实时' : '离线'}
          </ConnectionStatus>
        </CardTitle>
        <MainValue $isLight={isLight}>
          <AnimatedNumber value={data.total_volume} />
        </MainValue>
        <SubValue $isLight={isLight} $positive={data.volume_change_rate >= 0}>
          {data.volume_change_rate >= 0 ? '↑' : '↓'} 
          环比 {Math.abs(data.volume_change_rate).toFixed(2)}%
        </SubValue>
        <SubValue $isLight={isLight}>
          预测当日: <AnimatedNumber value={data.predicted_volume} /> 单
        </SubValue>
        {lastUpdate && (
          <UpdateTime $isLight={isLight}>
            更新时间: {lastUpdate} 每30S更新一次
          </UpdateTime>
        )}
      </DataCard>

      {/* 平台发单量 */}
      {data.platform_volume.length > 0 && (
        <DataCard $isLight={isLight}>
          <CardTitle $isLight={isLight}>🏢 平台发单量</CardTitle>
          <PlatformList>
            {data.platform_volume.slice(0, 5).map((p, i) => (
              <PlatformItem key={i} $isLight={isLight}>
                <PlatformName $isLight={isLight}>{p.platform_name}</PlatformName>
                <PlatformVolume $isLight={isLight}>
                  <AnimatedNumber value={p.volume} /> 单
                </PlatformVolume>
              </PlatformItem>
            ))}
          </PlatformList>
        </DataCard>
      )}

      {/* TOP10加盟商 */}
      {data.top_franchisees.length > 0 && (
        <DataCard $isLight={isLight}>
          <CardTitle $isLight={isLight}>🏆 加盟商排名 TOP10</CardTitle>
          <RankList>
            {data.top_franchisees.map((f) => (
              <RankItem key={f.rank} $isLight={isLight} $rank={f.rank}>
                <RankBadge $rank={f.rank}>{f.rank}</RankBadge>
                <RankName $isLight={isLight} title={f.name}>
                  {f.name}
                </RankName>
                <RankVolume $isLight={isLight}>
                  <AnimatedNumber value={f.volume} />
                </RankVolume>
              </RankItem>
            ))}
          </RankList>
        </DataCard>
      )}
    </PanelContainer>
  );
}
