import { z } from 'zod';

// Validation for the room listing form. Field values stay strings so inputs can be empty; `save` converts them.

export const MAX_PHOTOS = 10;
export const MAX_AMENITIES = 30;

const money = (label: string) =>
  z.string().refine((v) => v.trim() === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), {
    message: `${label} must be 0 or more`,
  });

export const roomFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(4000),
  price: z
    .string()
    .min(1, 'Rent is required')
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'Rent must be greater than 0'),
  securityDeposit: money('Deposit'),
  utilitiesIncluded: z.boolean(),
  estUtilityMonthly: money('Estimated utilities'),
  roomType: z.string().min(1, 'Room type is required').max(50),
  broadLocation: z.string().trim().min(1, 'City and area are required').max(200),
  exactAddress: z.string().max(4000),
  zipCode: z.string().max(10),
  stateCode: z.string().max(50, 'State must be 50 characters or fewer'),
  county: z.string().max(100),
  latitude: z.string(),
  longitude: z.string(),
  dietaryPreference: z.string(),
  genderPreference: z.string(),
  bathroomType: z.string(),
  leaseTerm: z.string(),
  universityShuttleAccessible: z.boolean(),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

/** `''` → undefined, otherwise a number. */
export const optionalNumber = (v: string) => (v.trim() === '' ? undefined : Number(v));
