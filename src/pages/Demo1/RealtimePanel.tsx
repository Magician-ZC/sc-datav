import styled from "styled-components";
import { useState, useEffect } from "react";
import { useRealtimeStore } from "./stores/realtimeStore";
import { useConfigStore, useMapStatsStore } from "./stores";
import { fetchTodayEmployeeVisits, type EmployeeVisitsResponse } from "./stores/mapStatsStore";
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

// 触达占比进度条
const ProgressBar = styled.div<{ $isLight: boolean }>`
  width: 100%;
  height: 8px;
  background: ${props => props.$isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${props => Math.min(props.$percent, 100)}%;
  background: ${props => props.$color};
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
`;

const StatLabel = styled.span<{ $isLight: boolean }>`
  font-size: 12px;
  color: ${props => props.$isLight ? '#6b7280' : '#9ca3af'};
`;

const StatValue = styled.span<{ $isLight: boolean; $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$color || (props.$isLight ? '#374151' : '#e5e7eb')};
`;

export default function RealtimePanel() {
  const data = useRealtimeStore((s) => s.data);
  const isConnected = useRealtimeStore((s) => s.isConnected);
  const lastUpdate = useRealtimeStore((s) => s.lastUpdate);
  const error = useRealtimeStore((s) => s.error);
  const resetRetry = useRealtimeStore((s) => s.resetRetry);
  const connect = useRealtimeStore((s) => s.connect);
  const bgMode = useConfigStore((s) => s.bgMode);
  const mode = useConfigStore((s) => s.mode);
  const viewLevel = useConfigStore((s) => s.viewLevel);
  const selectedCity = useConfigStore((s) => s.selectedCity);
  const isLight = bgMode === "light";
  
  // 地图统计数据
  const mapStatsData = useMapStatsStore((s) => s.data);
  const mapStatsLastUpdate = useMapStatsStore((s) => s.lastUpdate);
  
  // 实时推送的城市发件量数据
  const realtimeCityStats = data?.city_stats;

  if (!mode) return null;

  const handleReconnect = () => {
    resetRetry();
    connect();
  };

  // 根据视图级别计算统计数据
  // 省级视图：汇总所有城市数据
  // 区县视图：只显示当前城市数据
  const currentStats = (() => {
    if (viewLevel === "city" && selectedCity) {
      // 区县视图：使用当前城市的数据
      const cityData = mapStatsData[selectedCity];
      // 从实时数据获取发件量（去掉"市"后缀匹配）
      const cityNameWithoutSuffix = selectedCity.endsWith('市') ? selectedCity.slice(0, -1) : selectedCity;
      const realtimeVolume = realtimeCityStats?.[cityNameWithoutSuffix]?.volume || 
                            realtimeCityStats?.[selectedCity]?.volume || 0;
      
      if (cityData) {
        return {
          title: selectedCity,
          marketCapacity: cityData.marketCapacityRaw || 0,
          touchedVolume: cityData.touchedVolumeRaw || 0,
          cooperationVolume: realtimeVolume || cityData.cooperationVolumeRaw || 0,
          touchedRate: cityData.marketCapacityRaw > 0 
            ? ((cityData.touchedVolumeRaw || 0) / cityData.marketCapacityRaw * 100).toFixed(2)
            : '0.00',
        };
      }
      // 即使没有 mapStatsData，也可以显示实时发件量
      if (realtimeVolume > 0) {
        return {
          title: selectedCity,
          marketCapacity: 0,
          touchedVolume: 0,
          cooperationVolume: realtimeVolume,
          touchedRate: '0.00',
        };
      }
      return null;
    } else {
      // 省级视图：汇总所有城市
      // 计算实时发件量总和
      let totalRealtimeVolume = 0;
      if (realtimeCityStats) {
        Object.values(realtimeCityStats).forEach(stat => {
          totalRealtimeVolume += stat.volume || 0;
        });
      }
      
      if (Object.keys(mapStatsData).length === 0) {
        // 没有 mapStatsData 但有实时数据
        if (totalRealtimeVolume > 0) {
          return {
            title: '福建省',
            marketCapacity: 0,
            touchedVolume: 0,
            cooperationVolume: totalRealtimeVolume,
            touchedRate: '0.00',
          };
        }
        return null;
      }
      
      const totalMarketCapacity = Object.values(mapStatsData).reduce((sum, city) => sum + (city.marketCapacityRaw || 0), 0);
      const totalTouchedVolume = Object.values(mapStatsData).reduce((sum, city) => sum + (city.touchedVolumeRaw || 0), 0);
      // 优先使用实时发件量，否则使用数据库数据
      const totalCooperationVolume = totalRealtimeVolume > 0 
        ? totalRealtimeVolume 
        : Object.values(mapStatsData).reduce((sum, city) => sum + (city.cooperationVolumeRaw || 0), 0);
      
      return {
        title: '福建省',
        marketCapacity: totalMarketCapacity,
        touchedVolume: totalTouchedVolume,
        cooperationVolume: totalCooperationVolume,
        touchedRate: totalMarketCapacity > 0 
          ? (totalTouchedVolume / totalMarketCapacity * 100).toFixed(2)
          : '0.00',
      };
    }
  })();

  // 没有实时数据时，显示地图统计数据面板
  if (!data) {
    return (
      <PanelContainer $isLight={isLight}>
        {/* 市场数据概览（含触达占比） */}
        {currentStats ? (
          <DataCard $isLight={isLight}>
            <CardTitle $isLight={isLight}>
              📊 市场数据概览
            </CardTitle>
            <MainValue $isLight={isLight}>
              {currentStats.title}
            </MainValue>
            
            <StatRow>
              <StatLabel $isLight={isLight}>兔通达件量</StatLabel>
              <StatValue $isLight={isLight} $color="#6366f1">
                {currentStats.marketCapacity.toLocaleString()} 单/日
              </StatValue>
            </StatRow>
            
            <StatRow>
              <StatLabel $isLight={isLight}>触达件量</StatLabel>
              <StatValue $isLight={isLight} $color="#ea580c">
                {currentStats.touchedVolume.toLocaleString()} 单
              </StatValue>
            </StatRow>
            
            <StatRow>
              <StatLabel $isLight={isLight}>触达占比</StatLabel>
              <StatValue $isLight={isLight} $color="#10b981">
                {currentStats.touchedRate}%
              </StatValue>
            </StatRow>
            <ProgressBar $isLight={isLight}>
              <ProgressFill $percent={parseFloat(currentStats.touchedRate)} $color="#10b981" />
            </ProgressBar>
            
            <StatRow>
              <StatLabel $isLight={isLight}>发件量</StatLabel>
              <StatValue $isLight={isLight} $color="#f59e0b">
                {currentStats.cooperationVolume.toLocaleString()} 单
              </StatValue>
            </StatRow>
            
            <StatRow>
              <StatLabel $isLight={isLight}>发件量占比</StatLabel>
              <StatValue $isLight={isLight} $color="#8b5cf6">
                {currentStats.marketCapacity > 0 
                  ? (currentStats.cooperationVolume / currentStats.marketCapacity * 100).toFixed(2)
                  : '0.00'}%
              </StatValue>
            </StatRow>
            
            {mapStatsLastUpdate && (
              <UpdateTime $isLight={isLight}>
                更新时间: {new Date(mapStatsLastUpdate).toLocaleString()}
              </UpdateTime>
            )}
          </DataCard>
        ) : (
          <DataCard $isLight={isLight}>
            <CardTitle $isLight={isLight}>
              📦 实时发单数据
              <ConnectionStatus $connected={isConnected}>
                {isConnected ? '已连接' : error?.includes('连接失败') ? '未连接' : '连接中...'}
              </ConnectionStatus>
            </CardTitle>
            <MainValue $isLight={isLight} style={{ fontSize: '18px', opacity: 0.6 }}>
              {error?.includes('连接失败') ? '服务未连接' : '等待数据推送...'}
            </MainValue>
            <SubValue $isLight={isLight}>
              {error || '请确保爬虫服务正在运行'}
            </SubValue>
            {error?.includes('连接失败') && (
              <button
                onClick={handleReconnect}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: isLight ? '#ea580c' : '#fb923c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                🔄 重新连接
              </button>
            )}
          </DataCard>
        )}
        
        {/* 今日拜访排行 */}
        <TodayVisitsPanel isLight={isLight} city={viewLevel === "city" ? selectedCity : null} />
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

      {/* 市场数据概览（含触达占比和发件量占比） */}
      {currentStats && (
        <DataCard $isLight={isLight}>
          <CardTitle $isLight={isLight}>📊 市场数据概览</CardTitle>
          <StatRow>
            <StatLabel $isLight={isLight}>兔通达件量</StatLabel>
            <StatValue $isLight={isLight} $color="#6366f1">
              {currentStats.marketCapacity.toLocaleString()} 单/日
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel $isLight={isLight}>触达件量</StatLabel>
            <StatValue $isLight={isLight} $color="#ea580c">
              {currentStats.touchedVolume.toLocaleString()} 单
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel $isLight={isLight}>触达占比</StatLabel>
            <StatValue $isLight={isLight} $color="#10b981">
              {currentStats.touchedRate}%
            </StatValue>
          </StatRow>
          <ProgressBar $isLight={isLight}>
            <ProgressFill $percent={parseFloat(currentStats.touchedRate)} $color="#10b981" />
          </ProgressBar>
          <StatRow>
            <StatLabel $isLight={isLight}>发件量</StatLabel>
            <StatValue $isLight={isLight} $color="#f59e0b">
              {currentStats.cooperationVolume.toLocaleString()} 单
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel $isLight={isLight}>发件量占比</StatLabel>
            <StatValue $isLight={isLight} $color="#8b5cf6">
              {currentStats.marketCapacity > 0 
                ? (currentStats.cooperationVolume / currentStats.marketCapacity * 100).toFixed(2)
                : '0.00'}%
            </StatValue>
          </StatRow>
        </DataCard>
      )}
      
      {/* 今日拜访排行 */}
      <TodayVisitsPanel isLight={isLight} city={viewLevel === "city" ? selectedCity : null} />
    </PanelContainer>
  );
}


// ==================== 今日拜访数据面板组件 ====================

const VisitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`;

const VisitItem = styled.div<{ $isLight: boolean; $rank: number }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: ${props => props.$isLight 
    ? 'rgba(234, 88, 12, 0.05)' 
    : 'rgba(255, 255, 255, 0.03)'};
  border-radius: 6px;
`;

const VisitRank = styled.span<{ $rank: number }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: ${props => {
    if (props.$rank === 1) return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
    if (props.$rank === 2) return 'linear-gradient(135deg, #9ca3af, #6b7280)';
    if (props.$rank === 3) return 'linear-gradient(135deg, #cd7f32, #b87333)';
    return 'rgba(107, 114, 128, 0.3)';
  }};
  color: ${props => props.$rank <= 3 ? 'white' : '#9ca3af'};
`;

const VisitName = styled.span<{ $isLight: boolean }>`
  flex: 1;
  font-size: 12px;
  color: ${props => props.$isLight ? '#374151' : '#d1d5db'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const VisitCount = styled.span<{ $isLight: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$isLight ? '#ea580c' : '#fb923c'};
  min-width: 40px;
  text-align: right;
`;

const VisitDetail = styled.span<{ $isLight: boolean }>`
  font-size: 10px;
  color: ${props => props.$isLight ? '#9ca3af' : '#6b7280'};
  min-width: 60px;
  text-align: right;
`;

const Pagination = styled.div<{ $isLight: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${props => props.$isLight 
    ? 'rgba(0, 0, 0, 0.08)' 
    : 'rgba(255, 255, 255, 0.08)'};
`;

const PageButton = styled.button<{ $isLight: boolean; $disabled?: boolean }>`
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  background: ${props => props.$disabled 
    ? (props.$isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)')
    : (props.$isLight ? 'rgba(234, 88, 12, 0.1)' : 'rgba(251, 146, 60, 0.2)')};
  color: ${props => props.$disabled 
    ? (props.$isLight ? '#9ca3af' : '#6b7280')
    : (props.$isLight ? '#ea580c' : '#fb923c')};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$isLight 
      ? 'rgba(234, 88, 12, 0.2)' 
      : 'rgba(251, 146, 60, 0.3)'};
  }
`;

const PageInfo = styled.span<{ $isLight: boolean }>`
  font-size: 11px;
  color: ${props => props.$isLight ? '#6b7280' : '#9ca3af'};
`;

const EmptyState = styled.div<{ $isLight: boolean }>`
  text-align: center;
  padding: 20px;
  color: ${props => props.$isLight ? '#9ca3af' : '#6b7280'};
  font-size: 13px;
`;

interface TodayVisitsPanelProps {
  isLight: boolean;
  city: string | null;  // 当前城市，null表示全省
}

function TodayVisitsPanel({ isLight, city }: TodayVisitsPanelProps) {
  const [visitsData, setVisitsData] = useState<EmployeeVisitsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const loadData = async (page: number, cityFilter: string | null) => {
    setLoading(true);
    // TODO: 后端API需要支持按城市筛选，目前先获取全部数据
    const data = await fetchTodayEmployeeVisits(page, 10, cityFilter);
    setVisitsData(data);
    setLoading(false);
  };
  
  useEffect(() => {
    setCurrentPage(1);
    loadData(1, city);
  }, [city]);
  
  useEffect(() => {
    // 每30秒刷新一次
    const interval = setInterval(() => loadData(currentPage, city), 30000);
    return () => clearInterval(interval);
  }, [currentPage, city]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page, city);
  };
  
  return (
    <DataCard $isLight={isLight}>
      <CardTitle $isLight={isLight}>
        👥 今日拜访排行 {city ? `(${city})` : ''}
      </CardTitle>
      
      {loading && !visitsData ? (
        <EmptyState $isLight={isLight}>加载中...</EmptyState>
      ) : !visitsData || visitsData.items.length === 0 ? (
        <EmptyState $isLight={isLight}>今日暂无拜访数据</EmptyState>
      ) : (
        <>
          <VisitsList>
            {visitsData.items.map((item, index) => {
              const rank = (currentPage - 1) * 10 + index + 1;
              return (
                <VisitItem key={item.user_id} $isLight={isLight} $rank={rank}>
                  <VisitRank $rank={rank}>{rank}</VisitRank>
                  <VisitName $isLight={isLight} title={item.user_name}>
                    {item.user_name}
                  </VisitName>
                  <VisitDetail $isLight={isLight}>
                    新{item.new_customers}/访{item.follow_ups}
                  </VisitDetail>
                  <VisitCount $isLight={isLight}>
                    {item.total_visits}次
                  </VisitCount>
                </VisitItem>
              );
            })}
          </VisitsList>
          
          {visitsData.total_pages > 1 && (
            <Pagination $isLight={isLight}>
              <PageButton 
                $isLight={isLight}
                $disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                上一页
              </PageButton>
              <PageInfo $isLight={isLight}>
                {currentPage}/{visitsData.total_pages}
              </PageInfo>
              <PageButton 
                $isLight={isLight}
                $disabled={currentPage >= visitsData.total_pages}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= visitsData.total_pages}
              >
                下一页
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </DataCard>
  );
}
