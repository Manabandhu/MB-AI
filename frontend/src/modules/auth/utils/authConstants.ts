export interface CountryItem {
  code: string;
  flag: string;
  name: string;
}

export const supportedCountries: CountryItem[] = [
  { code: '+1', flag: '🇺🇸', name: 'United States & Canada' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
];
