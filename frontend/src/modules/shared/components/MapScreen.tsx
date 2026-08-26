import { color as colors, radius, space } from '@manabandhu/design-system';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { SearchBar } from './SearchBar';

export type FilterOption = {
  label: string;
  value: string;
};

export type MapScreenProps = {
  title?: string;
  children?: React.ReactNode;
  pins?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
};

export function MapScreen({
  title: _title,
  children,
  pins,
  searchValue,
  onSearchChange,
  filters,
}: MapScreenProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      <View style={styles.topBar}>
        {onSearchChange ? (
          <SearchBar value={searchValue ?? ''} onChangeText={onSearchChange} />
        ) : null}
        {filters ? <View style={styles.filters}>{filters}</View> : null}
      </View>
      <View style={[styles.map, colorScheme === 'dark' && styles.mapDark]}>{children}</View>
      {pins ? <View style={styles.pins}>{pins}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.x3, padding: space.x4 },
  rootDark: {},
  topBar: { gap: space.x3 },
  filters: {},
  map: {
    backgroundColor: colors.border,
    borderRadius: radius.card,
    flex: 1,
  },
  mapDark: { backgroundColor: colors.border },
  pins: {},
});
