/** Ride lifecycle values as the backend stores them (always lowercase). Compare with `statusIs`. */
export type RideStatus = 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';

export type TollPreference = 'AVOID_TOLLS' | 'TOLLS_INCLUDED' | 'TOLLS_SPLIT';
export type RecurrencePattern = 'ONE_TIME' | 'WEEKDAYS' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
export type LuggageCapacity = 'BACKPACK_ONLY' | 'MEDIUM' | 'LARGE_SUITCASE';
export type GenderPreference = 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY';
export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/**
 * A ride as every screen sees it. `api.ts` builds it from the backend `RideOfferView` in one place (`toRide`).
 * `driverId`, `conversationId` and `routePolyline` are only present for members (driver, passengers, admins);
 * non-members get coordinates rounded to two decimals.
 */
export type Ride = {
  id: string;
  driverId: string | null;
  /** The viewer drives this ride. */
  isDriver: boolean;
  /** The viewer is the driver, a passenger with a live booking or accepted request, or an admin. */
  isMember: boolean;
  originArea: string;
  destinationArea: string;
  /** `originArea → destinationArea`, for lists and headings. */
  routeLabel: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  routePolyline: string | null;
  distanceMiles: number | null;
  estimatedDurationMins: number | null;
  tollPreference: string | null;
  estimatedTollAmount: number | null;
  isRecurring: boolean;
  recurrencePattern: string | null;
  recurringDays: string[];
  luggageCapacity: string | null;
  genderPreference: string | null;
  completedAt: string | null;
  conversationId: string | null;
  chatExpiresAt: string | null;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  /** Raw stored contribution text (e.g. `$12 / seat`). */
  contribution: string | null;
  /** Numeric amount per seat parsed from `contribution`, or null when it has none. */
  contributionAmount: number | null;
  /** Display label such as `$12 / seat` or `Free`, or null when the driver did not set one. */
  contributionLabel: string | null;
  /** Lowercased status. */
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RideBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type RideBooking = {
  id: string;
  rideId: string;
  userId: string;
  seatsBooked: number;
  /** Lowercased. */
  status: string;
  createdAt: string | null;
};

export type RideSeatRequest = {
  id: string;
  rideId: string;
  riderId: string;
  seatsRequested: number;
  message: string | null;
  /** Lowercased: `pending|accepted|rejected|withdrawn`. */
  status: string;
  createdAt: string | null;
};

export type RideParticipant = {
  id: string;
  rideId: string;
  userId: string;
  /** Lowercased: `driver|rider`. */
  role: string;
  joinedAt: string | null;
};

export type RideRating = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | null;
};

export type CreateRideOfferInput = {
  originArea: string;
  destinationArea: string;
  departureAt: string;
  seatsTotal: number;
  /** Amount per seat in dollars; 0 means free. */
  contributionAmount: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  routePolyline?: string;
  distanceMiles?: number;
  estimatedDurationMins?: number;
  tollPreference: TollPreference;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurringDays: WeekDay[];
  luggageCapacity: LuggageCapacity;
  genderPreference: GenderPreference;
};

/** Driver edits. Status, completion and the chat are server-managed (`PATCH /status`, `POST /chat`). */
export type UpdateRideOfferInput = {
  seatsTotal?: number;
  seatsAvailable?: number;
  /** Amount per seat in dollars; sent as the stored `$N / seat` text. */
  contributionAmount?: number;
};

export type CreateRideRatingInput = {
  /** Omit to rate the driver (passengers); the driver must name a rider. */
  rateeId?: string;
  rating: number;
  comment?: string;
};

export type RideChatResponse = {
  conversationId: string;
  rideId?: string;
  chatExpiresAt?: string | null;
  notice?: string | null;
};
