import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number; // milliseconds
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  duration = 1500,
  prefix = "",
  suffix = "",
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span className="font-bold text-2xl text-blue-600">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

