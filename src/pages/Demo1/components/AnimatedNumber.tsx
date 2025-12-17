import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number; // 动画持续时间（毫秒）
  formatOptions?: Intl.NumberFormatOptions;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 数字滚动动画组件
 * 当数值变化时，会从旧值平滑过渡到新值
 */
export default function AnimatedNumber({
  value,
  duration = 60000,
  formatOptions,
  className,
  style,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef<number>(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;

    // 如果差值为0，不需要动画
    if (diff === 0) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 匀速动画
      const currentValue = Math.round(startValue + diff * progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // 格式化数字
  const formattedValue = displayValue.toLocaleString("zh-CN", formatOptions);

  return (
    <span className={className} style={style}>
      {formattedValue}
    </span>
  );
}
