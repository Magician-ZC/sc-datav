import { useEffect } from "react";
import styled from "styled-components";
import Content from "./content";
import Map from "./3Dmap";
import { useRealtimeStore, fetchCurrentData } from "./stores/realtimeStore";
import { useMapStatsStore, fetchMapStatsData } from "./stores/mapStatsStore";

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

export default function Index() {
  const connectRealtime = useRealtimeStore((s) => s.connect);
  const disconnectRealtime = useRealtimeStore((s) => s.disconnect);
  const connectMapStats = useMapStatsStore((s) => s.connect);
  const disconnectMapStats = useMapStatsStore((s) => s.disconnect);

  useEffect(() => {
    // 先获取当前数据
    fetchCurrentData();
    fetchMapStatsData();
    
    // 建立SSE连接
    connectRealtime();
    connectMapStats();
    
    return () => {
      disconnectRealtime();
      disconnectMapStats();
    };
  }, [connectRealtime, disconnectRealtime, connectMapStats, disconnectMapStats]);

  return (
    <Wrapper>
      <Map />
      <Content />
    </Wrapper>
  );
}
