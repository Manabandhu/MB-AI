import { FormScreen } from '../components/FormScreen';

export type TemplateFormProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  progress?: number;
  submitLabel?: string;
  onSubmit?: () => void;
  children: React.ReactNode;
};

export function TemplateForm({
  eyebrow,
  title,
  subtitle,
  progress,
  submitLabel,
  onSubmit,
  children,
}: TemplateFormProps) {
  return (
    <FormScreen
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      progress={progress}
      submitLabel={submitLabel}
      onSubmit={onSubmit}
    >
      {children}
    </FormScreen>
  );
}
