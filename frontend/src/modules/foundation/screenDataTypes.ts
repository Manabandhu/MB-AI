export type CatalogMetric = {
  label: string;
  value: string;
};

export type CatalogItem = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
  status?: string;
};

export type CatalogScreenContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  metrics: CatalogMetric[];
  items: CatalogItem[];
};
