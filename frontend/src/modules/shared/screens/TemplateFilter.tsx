import { FilterScreen } from '../components/FilterScreen';

export type TemplateFilterProps = {
  eyebrow?: string;
  title: string;
  applyLabel?: string;
  onApply?: () => void;
  resetLabel?: string;
  onReset?: () => void;
  children: React.ReactNode;
};

export function TemplateFilter({
  eyebrow,
  title,
  applyLabel,
  onApply,
  resetLabel,
  onReset,
  children,
}: TemplateFilterProps) {
  return (
    <FilterScreen
      eyebrow={eyebrow}
      title={title}
      applyLabel={applyLabel}
      onApply={onApply}
      resetLabel={resetLabel}
      onReset={onReset}
    >
      {children}
    </FilterScreen>
  );
}
