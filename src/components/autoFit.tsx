import { useLayoutEffect, useEffect, useRef, type ComponentProps } from "react";
import styled from "styled-components";
import autofit from "autofit.js";
import { useConfigStore } from "@/pages/Demo1/stores";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

export type AutoFitProps = Omit<ComponentProps<typeof Wrapper>, "id">;

export default function AutoFit(props: AutoFitProps) {
  const idRef = useRef(`autofit_${Date.now().toString(36)}`);
  const id = idRef.current;
  const setFullscreen = useConfigStore((s) => s.setFullscreen);

  useLayoutEffect(() => {
    autofit.init({ 
      el: `#${id}`,
      resize: true,
    });

    return () => {
      autofit.off();
    };
  }, [id]);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setFullscreen(isFullscreen);
      
      // 延迟执行，等待DOM更新
      setTimeout(() => {
        autofit.off();
        autofit.init({ 
          el: `#${id}`,
          resize: true,
        });
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    // 监听父窗口发送的resize消息（iframe场景）
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'resize' || event.data === 'fullscreen') {
        // 从父窗口消息判断全屏状态
        setFullscreen(event.data === 'fullscreen');
        handleFullscreenChange();
      } else if (event.data === 'exitFullscreen') {
        setFullscreen(false);
        handleFullscreenChange();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('message', handleMessage);
    };
  }, [id, setFullscreen]);

  return <Wrapper id={id} {...props} />;
}
