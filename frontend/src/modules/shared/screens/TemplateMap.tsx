import { MapScreen } from '../components/MapScreen';

export type TemplateMapProps = {
  title?: string;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
};

export function TemplateMap({
  title,
  children,
  searchValue,
  onSearchChange,
  filters,
}: TemplateMapProps) {
  return (
    <MapScreen
      title={title}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      filters={filters}
    >
      {children}
    </MapScreen>
  );
}
