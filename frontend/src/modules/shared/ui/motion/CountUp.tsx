import { formatNumber } from '@manabandhu/core';
import { useEffect, useState } from 'react';
import { AppText, type AppTextProps } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

/** Animates a real number from 0 to its value once it arrives (600 ms ease-out). Non-numeric values render as-is. */
export function CountUp({ value, ...props }: { value: string } & AppTextProps) {
  const { reduceMotion } = useAppearance();
  const target = Number(value);
  const numeric = value.trim() !== '' && Number.isFinite(target);
  const [shown, setShown] = useState(numeric && !reduceMotion ? 0 : target);

  useEffect(() => {
    if (!numeric || reduceMotion) {
      setShown(target);
      return;
    }
    let frame = 0;
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / 600);
      setShown(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numeric, reduceMotion, target]);

  return <AppText {...props}>{numeric ? formatNumber(shown) : value}</AppText>;
}
