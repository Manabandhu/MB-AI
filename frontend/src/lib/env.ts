import { z } from 'zod';

declare const process: { env: Record<string, string | undefined> };

const publicEnvSchema = z.object({
  apiUrl: z.url(),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
});

export const env = publicEnvSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
