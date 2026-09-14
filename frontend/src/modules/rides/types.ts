export type RideListing = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  pickupArea: string;
  destination: string;
  departureAt: string;
  seatsAvailable: number;
  seatsTotal: number;
  contribution?: number | string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  luggageAllowed: boolean;
  childSeatAvailable: boolean;
  verifiedDriver: boolean;
  tripSharingEnabled: boolean;
  savedByViewer: boolean;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  routePolyline?: string;
  distanceMiles?: number;
  estimatedDurationMins?: number;
  tollPreference?: 'AVOID_TOLLS' | 'TOLLS_INCLUDED' | 'TOLLS_SPLIT' | string;
  estimatedTollAmount?: number;
  isRecurring?: boolean;
  recurrencePattern?: 'ONE_TIME' | 'WEEKDAYS' | 'DAILY' | 'WEEKLY' | string;
  recurringDays?: string[];
  luggageCapacity?: 'NONE' | 'BACKPACK_ONLY' | 'MEDIUM' | 'LARGE_SUITCASE' | string;
  genderPreference?: 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY' | string;
  completedAt?: string;
  conversationId?: string;
  chatExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type OwnerRideListing = RideListing & {
  exactPickup?: string;
};

export type RideRequest = {
  id: string;
  rideId: string;
  requesterId: string;
  seatsRequested: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
};

export type RideParticipant = {
  id: string;
  rideId: string;
  userId: string;
  name: string;
  role: 'DRIVER' | 'RIDER';
  status: 'CONFIRMED' | 'PENDING';
  tripShared: boolean;
};

export type RideSeatRequest = {
  id: string;
  rideId: string;
  requesterId: string;
  requesterName: string;
  pickupArea: string;
  seatsRequested: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
};

export type RideRating = {
  id: string;
  rideId: string;
  raterId: string;
  ratedId: string;
  safetyRating: number;
  timelinessRating: number;
  comfortRating: number;
  comment?: string;
  createdAt: string;
};

export type CreateRideOfferInput = {
  title?: string;
  description?: string;
  pickupArea?: string;
  destination?: string;
  originArea?: string;
  destinationArea?: string;
  departureAt: string;
  seatsTotal: number;
  contribution?: number | string;
  luggageAllowed?: boolean;
  childSeatAvailable?: boolean;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  routePolyline?: string;
  distanceMiles?: number;
  estimatedDurationMins?: number;
  tollPreference?: 'AVOID_TOLLS' | 'TOLLS_INCLUDED' | 'TOLLS_SPLIT' | string;
  estimatedTollAmount?: number;
  isRecurring?: boolean;
  recurrencePattern?: 'ONE_TIME' | 'WEEKDAYS' | 'DAILY' | 'WEEKLY' | string;
  recurringDays?: string[];
  luggageCapacity?: 'NONE' | 'BACKPACK_ONLY' | 'MEDIUM' | 'LARGE_SUITCASE' | string;
  genderPreference?: 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY' | string;
};

export type CreateRideRequestInput = {
  rideId: string;
  pickupArea: string;
  destination: string;
  departureAt: string;
  seatsRequested: number;
  message?: string;
};

export type UpdateRideOfferInput = Partial<CreateRideOfferInput> & {
  status?: string;
  seatsAvailable?: number;
  completedAt?: string;
  conversationId?: string;
  chatExpiresAt?: string;
};

export type CreateRideRatingInput = {
  safetyRating: number;
  timelinessRating: number;
  comfortRating: number;
  comment?: string;
};

export type RideOffer = {
  id: string;
  driverId: string;
  originArea: string;
  destinationArea: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  contribution: string;
  status: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  routePolyline?: string;
  distanceMiles?: number;
  estimatedDurationMins?: number;
  tollPreference?: 'AVOID_TOLLS' | 'TOLLS_INCLUDED' | 'TOLLS_SPLIT' | string;
  estimatedTollAmount?: number;
  isRecurring?: boolean;
  recurrencePattern?: 'ONE_TIME' | 'WEEKDAYS' | 'DAILY' | 'WEEKLY' | string;
  recurringDays?: string[];
  luggageCapacity?: 'NONE' | 'BACKPACK_ONLY' | 'MEDIUM' | 'LARGE_SUITCASE' | string;
  genderPreference?: 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY' | string;
  completedAt?: string;
  conversationId?: string;
  chatExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  reported: boolean;
};

export type CreateRideBookingInput = {
  seatsBooked: number;
};

export type RideBooking = {
  id: string;
  rideId: string;
  userId: string;
  seatsBooked: number;
  status: string;
  createdAt: string;
};

export type RideChatResponse = {
  conversationId: string;
  rideId?: string;
  chatExpiresAt?: string;
  message?: string;
};
