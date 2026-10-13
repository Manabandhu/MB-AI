import { space } from '@manabandhu/design-system';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '@/theme/ThemeProvider';

export type ScreenShellProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  topBar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  contentContainerStyle?: Record<string, unknown>;
};

export function ScreenShell({
  children,
  scroll = true,
  padding = true,
  topBar,
  bottomBar,
  contentContainerStyle,
}: ScreenShellProps) {
  const { palette: theme } = useAppearance();
  const insets = useSafeAreaInsets();

  const backgroundColor = theme.background;
  const content = (
    <View style={[styles.content, padding && styles.padding, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {topBar}
      {scroll ? <View style={styles.scroll}>{content}</View> : content}
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
