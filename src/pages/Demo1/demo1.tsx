import { useEffect } from "react";
import styled from "styled-components";
import Content from "./content";
import Map from "./3Dmap";
import { useRealtimeStore, fetchCurrentData } from "./stores/realtimeStore";

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

export default function Index() {
  const connect = useRealtimeStore((s) => s.connect);
  const disconnect = useRealtimeStore((s) => s.disconnect);

  useEffect(() => {
    // 先获取当前数据
    fetchCurrentData();
    // 建立SSE连接
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <Wrapper>
      <Map />
      <Content />
    </Wrapper>
  );
}
