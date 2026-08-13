export type SplashContent = {
  brand: string;
  tagline: string;
  logoUrl: string;
};

export type WelcomeStep = {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  actionLabel: string;
  secondaryActionLabel?: string | null;
};

export type WelcomeFlow = {
  splash: SplashContent;
  steps: WelcomeStep[];
};
