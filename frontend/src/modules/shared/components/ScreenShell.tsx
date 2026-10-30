import { space } from '@manabandhu/design-system';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '@/theme/ThemeProvider';

export type ScreenShellProps = {
  children: React.ReactNode;
  /**
   * Scroll the content (default). Pass `false` when the children bring their own virtualized list (FlatList,
   * SectionList): nesting one inside a vertical ScrollView breaks virtualization and React Native warns.
   */
  scroll?: boolean;
  padding?: boolean;
  topBar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  contentContainerStyle?: Record<string, unknown>;
};

/**
 * Legacy page frame kept for screens not yet on `Screen`: theme background, top safe area, optional top/bottom
 * bars, and scrolling content. New screens should use `Screen` from `@/modules/shared/ui`.
 */
export function ScreenShell({
  children,
  scroll = true,
  padding = true,
  topBar,
  bottomBar,
  contentContainerStyle,
}: ScreenShellProps) {
  const { palette } = useAppearance();
  const insets = useSafeAreaInsets();
  const contentStyle = [styles.content, padding && styles.padding, contentContainerStyle];

  return (
    <View
      style={[styles.container, { backgroundColor: palette.background, paddingTop: insets.top }]}
    >
      {topBar}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            contentStyle,
            { paddingBottom: (bottomBar ? 0 : insets.bottom) + space.x6 },
          ]}
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, contentStyle]}>{children}</View>
      )}
      {bottomBar}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  padding: { paddingHorizontal: space.x4 },
});
