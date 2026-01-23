import styled from "styled-components";
import { useState, useEffect, useCallback } from "react";
import { useConfigStore } from "./stores";

// 面板容器 - 右侧（支持移动端响应式）
const PanelContainer = styled.div<{ $isLight: boolean }>`
  position: fixed;
  right: 30px;
  top: 120px;
  width: auto;
  min-width: 420px;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  z-index: 100;
  pointer-events: auto;
  
  /* 移动端适配 - 保持在右侧显示 */
  @media (max-width: 768px) {
    right: 8px;
    top: 100px;
    min-width: 280px;
    max-width: 320px;
    max-height: calc(100vh - 180px);
  }
  
  @media (max-width: 480px) {
    right: 5px;
    top: 80px;
    min-width: 240px;
    max-width: 280px;
    max-height: calc(100vh - 160px);
  }
`;

// 数据卡片
const DataCard = styled.div<{ $isLight: boolean }>`
  background: ${props => props.$isLight 
    ? 'rgba(255, 245, 232, 0.95)' 
    : 'rgba(30, 30, 40, 0.9)'};
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid ${props => props.$isLight 
    ? 'rgba(234, 88, 12, 0.2)' 
    : 'rgba(255, 255, 255, 0.1)'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const CardHeader = styled.div<{ $isLight: boolean }>`
  padding: 14px 16px;
  border-bottom: 1px solid ${props => props.$isLight 
    ? 'rgba(0, 0, 0, 0.08)' 
    : 'rgba(255, 255, 255, 0.08)'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardTitle = styled.div<{ $isLight: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$isLight ? '#374151' : '#e5e7eb'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackButton = styled.button<{ $isLight: boolean }>`
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: ${props => props.$isLight 
    ? 'rgba(234, 88, 12, 0.1)' 
    : 'rgba(251, 146, 60, 0.2)'};
  color: ${props => props.$isLight ? '#ea580c' : '#fb923c'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isLight 
      ? 'rgba(234, 88, 12, 0.2)' 
      : 'rgba(251, 146, 60, 0.3)'};
  }
`;

const CardBody = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.3);
    border-radius: 2px;
  }
`;

// 数据行
const DataRow = styled.div<{ $isLight: boolean; $isActive?: boolean }>`
  display: grid;
  grid-template-columns: minmax(50px, auto) 55px 55px 60px 60px;
  gap: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$isActive 
    ? (props.$isLight ? 'rgba(234, 88, 12, 0.1)' : 'rgba(251, 146, 60, 0.15)')
    : 'transparent'};
  
  &:hover {
    background: ${props => props.$isLight 
      ? 'rgba(234, 88, 12, 0.08)' 
      : 'rgba(255, 255, 255, 0.05)'};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.$isLight 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'rgba(255, 255, 255, 0.05)'};
  }
  
  /* 移动端适配 - 更紧凑的布局 */
  @media (max-width: 480px) {
    grid-template-columns: minmax(40px, auto) 42px 42px 50px 50px;
    gap: 2px;
    padding: 6px 8px;
  }
`;

const RowName = styled.div<{ $isLight: boolean }>`
  font-size: 12px;
  color: ${props => props.$isLight ? '#374151' : '#d1d5db'};
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const RowValue = styled.div<{ $isLight: boolean; $color?: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$color || (props.$isLight ? '#374151' : '#e5e7eb')};
  text-align: right;
  
  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

// 表头
const TableHeader = styled.div<{ $isLight: boolean }>`
  display: grid;
  grid-template-columns: minmax(50px, auto) 55px 55px 60px 60px;
  gap: 4px;
  padding: 6px 12px;
  background: ${props => props.$isLight 
    ? 'rgba(0, 0, 0, 0.03)' 
    : 'rgba(255, 255, 255, 0.03)'};
  border-bottom: 1px solid ${props => props.$isLight 
    ? 'rgba(0, 0, 0, 0.08)' 
    : 'rgba(255, 255, 255, 0.08)'};
  
  /* 移动端适配 - 更紧凑 */
  @media (max-width: 480px) {
    grid-template-columns: minmax(40px, auto) 42px 42px 50px 50px;
    gap: 2px;
    padding: 4px 8px;
  }
`;

const HeaderCell = styled.div<{ $isLight: boolean }>`
  font-size: 10px;
  color: ${props => props.$isLight ? '#6b7280' : '#9ca3af'};
  text-align: right;
  
  &:first-child {
    text-align: left;
  }
  
  /* 移动端适配 */
  @media (max-width: 480px) {
    font-size: 9px;
  }
`;

// 空状态
const EmptyState = styled.div<{ $isLight: boolean }>`
  text-align: center;
  padding: 30px 20px;
  color: ${props => props.$isLight ? '#9ca3af' : '#6b7280'};
  font-size: 13px;
`;

// 加载状态
const LoadingState = styled.div<{ $isLight: boolean }>`
  text-align: center;
  padding: 30px 20px;
  color: ${props => props.$isLight ? '#6b7280' : '#9ca3af'};
  font-size: 13px;
`;

// 业务员数据行（五列布局）
const EmployeeRow = styled.div<{ $isLight: boolean }>`
  display: grid;
  grid-template-columns: minmax(55px, auto) 45px 50px 55px 55px;
  gap: 4px;
  padding: 8px 12px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isLight 
      ? 'rgba(234, 88, 12, 0.05)' 
      : 'rgba(255, 255, 255, 0.03)'};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.$isLight 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'rgba(255, 255, 255, 0.05)'};
  }
  
  /* 移动端适配 - 更紧凑 */
  @media (max-width: 480px) {
    grid-template-columns: minmax(45px, auto) 38px 42px 48px 48px;
    gap: 2px;
    padding: 6px 8px;
  }
`;

const EmployeeHeader = styled.div<{ $isLight: boolean }>`
  display: grid;
  grid-template-columns: minmax(55px, auto) 45px 50px 55px 55px;
  gap: 4px;
  padding: 6px 12px;
  background: ${props => props.$isLight 
    ? 'rgba(0, 0, 0, 0.03)' 
    : 'rgba(255, 255, 255, 0.03)'};
  border-bottom: 1px solid ${props => props.$isLight 
    ? 'rgba(0, 0, 0, 0.08)' 
    : 'rgba(255, 255, 255, 0.08)'};
  
  /* 移动端适配 - 更紧凑 */
  @media (max-width: 480px) {
    grid-template-columns: minmax(45px, auto) 38px 42px 48px 48px;
    gap: 2px;
    padding: 4px 8px;
  }
`;

// 数据接口
interface AreaStats {
  name: string;
  type: "city" | "district";
  customer_count: number;
  touched_volume: number;
  today_visits: number;
  month_visits: number;
  today_touched_volume: number;
  month_touched_volume: number;
}

interface EmployeeStats {
  user_id: number;
  user_name: string;
  department: string;
  today_visits: number;
  month_visits: number;
  today_touched_volume: number;
  month_touched_volume: number;
}

type ViewMode = "area" | "employee";

export default function RightDataPanel() {
  const bgMode = useConfigStore((s) => s.bgMode);
  const mode = useConfigStore((s) => s.mode);
  const viewLevel = useConfigStore((s) => s.viewLevel);
  const selectedCity = useConfigStore((s) => s.selectedCity);
  const isLight = bgMode === "light";
  
  const [viewMode, setViewMode] = useState<ViewMode>("area");
  const [areaData, setAreaData] = useState<AreaStats[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeStats[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取基础URL
  const getBaseUrl = useCallback(() => {
    return window.parent !== window 
      ? window.parent.location.origin 
      : window.location.origin;
  }, []);

  // 加载区域统计数据
  const loadAreaData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const city = viewLevel === "city" && selectedCity ? selectedCity : null;
      const url = city 
        ? `${baseUrl}/crm/api/map-stats/visit-stats-panel?city=${encodeURIComponent(city)}`
        : `${baseUrl}/crm/api/map-stats/visit-stats-panel`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAreaData(result.data);
      }
    } catch (error) {
      console.error('[RightPanel] 加载区域数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [getBaseUrl, viewLevel, selectedCity]);

  // 加载业务员数据
  const loadEmployeeData = useCallback(async (areaName: string) => {
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      let url = `${baseUrl}/crm/api/map-stats/employee-visits-by-area?page_size=50`;
      
      if (viewLevel === "city" && selectedCity) {
        // 区县级：传city和district
        url += `&city=${encodeURIComponent(selectedCity)}&district=${encodeURIComponent(areaName)}`;
      } else {
        // 市级：只传city
        url += `&city=${encodeURIComponent(areaName)}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        setEmployeeData(result.data.items || []);
      }
    } catch (error) {
      console.error('[RightPanel] 加载业务员数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [getBaseUrl, viewLevel, selectedCity]);

  // 视图级别变化时重新加载数据
  useEffect(() => {
    setViewMode("area");
    setSelectedArea(null);
    loadAreaData();
  }, [viewLevel, selectedCity, loadAreaData]);

  // 定时刷新（每60秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (viewMode === "area") {
        loadAreaData();
      } else if (selectedArea) {
        loadEmployeeData(selectedArea);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [viewMode, selectedArea, loadAreaData, loadEmployeeData]);

  // 点击区域行
  const handleAreaClick = (area: AreaStats) => {
    setSelectedArea(area.name);
    setViewMode("employee");
    loadEmployeeData(area.name);
  };

  // 返回区域列表
  const handleBackToArea = () => {
    setViewMode("area");
    setSelectedArea(null);
  };

  if (!mode) return null;

  // 获取标题
  const getTitle = () => {
    if (viewMode === "employee" && selectedArea) {
      return `${selectedArea} · 业务员拜访`;
    }
    if (viewLevel === "city" && selectedCity) {
      return `${selectedCity} · 区县拜访数据`;
    }
    return "福建省 · 各市拜访数据";
  };

  return (
    <PanelContainer $isLight={isLight}>
      <DataCard $isLight={isLight}>
        <CardHeader $isLight={isLight}>
          <CardTitle $isLight={isLight}>
            📊 {getTitle()}
          </CardTitle>
          {viewMode === "employee" && (
            <BackButton $isLight={isLight} onClick={handleBackToArea}>
              ← 返回
            </BackButton>
          )}
        </CardHeader>
        
        {loading ? (
          <LoadingState $isLight={isLight}>加载中...</LoadingState>
        ) : viewMode === "area" ? (
          // 区域数据视图
          <>
            <TableHeader $isLight={isLight}>
              <HeaderCell $isLight={isLight}>
                {viewLevel === "city" ? "区县" : "城市"}
              </HeaderCell>
              <HeaderCell $isLight={isLight}>今日拜访</HeaderCell>
              <HeaderCell $isLight={isLight}>月拜访</HeaderCell>
              <HeaderCell $isLight={isLight}>今日触达</HeaderCell>
              <HeaderCell $isLight={isLight}>月触达</HeaderCell>
            </TableHeader>
            {/* 合计行 */}
            {areaData.length > 0 && (
              <DataRow $isLight={isLight} style={{ background: isLight ? 'rgba(234, 88, 12, 0.08)' : 'rgba(251, 146, 60, 0.1)', fontWeight: 600 }}>
                <RowName $isLight={isLight} style={{ fontWeight: 600 }}>
                  合计
                </RowName>
                <RowValue $isLight={isLight} $color="#10b981" style={{ fontWeight: 700 }}>
                  {areaData.reduce((sum, item) => sum + item.today_visits, 0).toLocaleString()}
                </RowValue>
                <RowValue $isLight={isLight} $color="#6366f1" style={{ fontWeight: 700 }}>
                  {areaData.reduce((sum, item) => sum + item.month_visits, 0).toLocaleString()}
                </RowValue>
                <RowValue $isLight={isLight} $color="#f59e0b" style={{ fontWeight: 700 }}>
                  {areaData.reduce((sum, item) => sum + item.today_touched_volume, 0).toLocaleString()}
                </RowValue>
                <RowValue $isLight={isLight} $color="#ea580c" style={{ fontWeight: 700 }}>
                  {areaData.reduce((sum, item) => sum + item.month_touched_volume, 0).toLocaleString()}
                </RowValue>
              </DataRow>
            )}
            <CardBody>
              {areaData.length === 0 ? (
                <EmptyState $isLight={isLight}>暂无数据</EmptyState>
              ) : (
                areaData.map((item) => (
                  <DataRow 
                    key={item.name} 
                    $isLight={isLight}
                    onClick={() => handleAreaClick(item)}
                  >
                    <RowName $isLight={isLight}>
                      {item.name}
                    </RowName>
                    <RowValue $isLight={isLight} $color="#10b981">
                      {item.today_visits.toLocaleString()}
                    </RowValue>
                    <RowValue $isLight={isLight} $color="#6366f1">
                      {item.month_visits.toLocaleString()}
                    </RowValue>
                    <RowValue $isLight={isLight} $color="#f59e0b">
                      {item.today_touched_volume.toLocaleString()}
                    </RowValue>
                    <RowValue $isLight={isLight} $color="#ea580c">
                      {item.month_touched_volume.toLocaleString()}
                    </RowValue>
                  </DataRow>
                ))
              )}
            </CardBody>
          </>
        ) : (
          // 业务员数据视图
          <>
            <EmployeeHeader $isLight={isLight}>
              <HeaderCell $isLight={isLight}>业务员</HeaderCell>
              <HeaderCell $isLight={isLight}>今日</HeaderCell>
              <HeaderCell $isLight={isLight}>月累计</HeaderCell>
              <HeaderCell $isLight={isLight}>今日触达</HeaderCell>
              <HeaderCell $isLight={isLight}>月触达</HeaderCell>
            </EmployeeHeader>
            <CardBody>
              {employeeData.length === 0 ? (
                <EmptyState $isLight={isLight}>暂无业务员数据</EmptyState>
              ) : (
                employeeData.map((item) => (
                  <EmployeeRow key={item.user_id} $isLight={isLight}>
                    <RowName $isLight={isLight} title={item.department}>
                      👤 {item.user_name}
                    </RowName>
                    <RowValue $isLight={isLight} $color="#10b981">
                      {item.today_visits}
                    </RowValue>
                    <RowValue $isLight={isLight} $color="#6366f1">
                      {item.month_visits}
                    </RowValue>
                    <RowValue $isLight={isLight} $color="#f59e0b">
                      {item.today_touched_volume.toLocaleString()}
                    </RowValue>
                    <RowValue $isLight={isLight} $color="#ea580c">
                      {item.month_touched_volume.toLocaleString()}
                    </RowValue>
                  </EmployeeRow>
                ))
              )}
            </CardBody>
          </>
        )}
      </DataCard>
    </PanelContainer>
  );
}
