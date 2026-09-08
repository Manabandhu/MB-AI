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
  contribution?: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  luggageAllowed: boolean;
  childSeatAvailable: boolean;
  verifiedDriver: boolean;
  tripSharingEnabled: boolean;
  savedByViewer: boolean;
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
  title: string;
  description?: string;
  pickupArea: string;
  destination: string;
  departureAt: string;
  seatsTotal: number;
  contribution?: number;
  luggageAllowed?: boolean;
  childSeatAvailable?: boolean;
};

export type CreateRideRequestInput = {
  rideId: string;
  pickupArea: string;
  seatsRequested: number;
  message?: string;
};

export type UpdateRideOfferInput = Partial<CreateRideOfferInput> & {
  status?: string;
  seatsAvailable?: number;
};

export type CreateRideRatingInput = {
  safetyRating: number;
  timelinessRating: number;
  comfortRating: number;
  comment?: string;
};
