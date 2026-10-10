import { Children, isValidElement, type ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAdaptiveLayout } from '@/platform/adaptive';

type ResponsiveGridProps = {
  children: ReactNode;
  /** Columns per window class; defaults to 1 / 2 / 3 / 3. */
  columns?: Partial<Record<'compact' | 'medium' | 'expanded' | 'wide', number>>;
  gap?: number;
};

/** Lays children out in columns that follow the window class, so phone, tablet, and desktop share one screen. */
export function ResponsiveGrid({ children, columns, gap = 16 }: ResponsiveGridProps) {
  const { windowClass, columns: defaultColumns } = useAdaptiveLayout();
  const count = Math.max(1, columns?.[windowClass] ?? defaultColumns);
  const items = Children.toArray(children).filter(isValidElement);
  if (count === 1) return <YStack gap={gap}>{items}</YStack>;
  return (
    <XStack flexWrap="wrap" marginHorizontal={-gap / 2}>
      {items.map((child, index) => (
        <YStack
          key={child.key ?? index}
          paddingHorizontal={gap / 2}
          paddingBottom={gap}
          width={`${100 / count}%`}
        >
          {child}
        </YStack>
      ))}
    </XStack>
  );
}
