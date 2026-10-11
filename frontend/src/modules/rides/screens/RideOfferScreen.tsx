import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { createRideOffer, getMyRides } from '@/modules/rides/api';
import { ChoiceChip } from '@/modules/rides/components/ChoiceChip';
import { DeparturePicker, type DepartureValue } from '@/modules/rides/components/DeparturePicker';
import { RideLocationPicker } from '@/modules/rides/components/RideLocationPicker';
import {
  fetchGoogleRoute,
  geocodeAddress,
  type RouteInfo,
} from '@/modules/rides/services/googleMapsService';
import type {
  GenderPreference,
  LuggageCapacity,
  RecurrencePattern,
  Ride,
  TollPreference,
  WeekDay,
} from '@/modules/rides/types';
import { showError } from '@/modules/rides/utils/notify';
import {
  amountError,
  contributionText,
  departureError,
  departureFrom,
  durationLabel,
  seatsError,
} from '@/modules/rides/utils/rideFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';

const ALL_DAYS: { id: WeekDay; label: string; name: string }[] = [
  { id: 'MON', label: 'Mon', name: 'Monday' },
  { id: 'TUE', label: 'Tue', name: 'Tuesday' },
  { id: 'WED', label: 'Wed', name: 'Wednesday' },
  { id: 'THU', label: 'Thu', name: 'Thursday' },
  { id: 'FRI', label: 'Fri', name: 'Friday' },
  { id: 'SAT', label: 'Sat', name: 'Saturday' },
  { id: 'SUN', label: 'Sun', name: 'Sunday' },
];
const WEEKDAYS: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const TOLL_OPTIONS: { id: TollPreference; label: string }[] = [
  { id: 'AVOID_TOLLS', label: 'Avoid tolls' },
  { id: 'TOLLS_INCLUDED', label: 'Tolls included in price' },
  { id: 'TOLLS_SPLIT', label: 'Split tolls with riders' },
];
const LUGGAGE_OPTIONS: { id: LuggageCapacity; label: string }[] = [
  { id: 'BACKPACK_ONLY', label: 'Backpack only' },
  { id: 'MEDIUM', label: 'Medium bags' },
  { id: 'LARGE_SUITCASE', label: 'Large suitcases' },
];
const GENDER_OPTIONS: { id: GenderPreference; label: string }[] = [
  { id: 'ANY', label: 'Open to all riders' },
  { id: 'FEMALE_ONLY', label: 'Women only' },
];

type Template = {
  id: string;
  origin: string;
  destination: string;
  seats: number;
  amount: number | null;
  ride: Ride;
};

/** Re-post shortcuts built from the driver's own previous rides (never fixtures). */
function toTemplates(rides: Ride[]): Template[] {
  const seen = new Set<string>();
  const out: Template[] = [];
  for (const ride of rides) {
    const key = `${ride.originArea}|${ride.destinationArea}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: ride.id,
      origin: ride.originArea,
      destination: ride.destinationArea,
      seats: ride.seatsTotal,
      amount: ride.contributionAmount,
      ride,
    });
    if (out.length >= 5) break;
  }
  return out;
}

function patternFor(days: WeekDay[]): RecurrencePattern {
  if (days.length === 7) return 'DAILY';
  if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) return 'WEEKDAYS';
  return 'CUSTOM';
}

type Coords = { lat: number; lng: number } | null;

export function RideOfferScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  const [origin, setOrigin] = useState('');
  const [originCoords, setOriginCoords] = useState<Coords>(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<Coords>(null);
  const [tollPref, setTollPref] = useState<TollPreference>('AVOID_TOLLS');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [days, setDays] = useState<WeekDay[]>(WEEKDAYS);
  const [departure, setDeparture] = useState<DepartureValue>({ dayOffset: 1, hour: 8, minute: 0 });

  const [seats, setSeats] = useState('3');
  const [amount, setAmount] = useState('');
  const [luggage, setLuggage] = useState<LuggageCapacity>('MEDIUM');
  const [gender, setGender] = useState<GenderPreference>('ANY');

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [published, setPublished] = useState<Ride | null>(null);

  const myRides = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: getMyRides,
    enabled: isAuthenticated,
  });
  const templates = useMemo(() => toTemplates(myRides.data ?? []), [myRides.data]);

  // Route facts come only from the Directions proxy; when it fails they stay empty.
  useEffect(() => {
    if (!originCoords || !destinationCoords) {
      setRoute(null);
      setRouteMessage(null);
      return;
    }
    let live = true;
    setRouteLoading(true);
    fetchGoogleRoute(originCoords, destinationCoords, tollPref === 'AVOID_TOLLS').then((result) => {
      if (!live) return;
      setRoute(result.route);
      setRouteMessage(result.message ?? null);
      setRouteLoading(false);
    });
    return () => {
      live = false;
    };
  }, [originCoords, destinationCoords, tollPref]);

  const applyTemplate = async (t: Template) => {
    setOrigin(t.origin);
    setDestination(t.destination);
    setSeats(String(t.seats));
    setAmount(t.amount != null ? String(t.amount) : '');
    setIsRecurring(t.ride.isRecurring);
    if (t.ride.recurringDays.length) setDays(t.ride.recurringDays as WeekDay[]);
    if (t.ride.tollPreference) setTollPref(t.ride.tollPreference as TollPreference);
    if (t.ride.luggageCapacity) setLuggage(t.ride.luggageCapacity as LuggageCapacity);
    if (t.ride.genderPreference) setGender(t.ride.genderPreference as GenderPreference);
    try {
      const [a, b] = await Promise.all([geocodeAddress(t.origin), geocodeAddress(t.destination)]);
      setOriginCoords(a);
      setDestinationCoords(b);
    } catch (e) {
      setOriginCoords(null);
      setDestinationCoords(null);
      setRouteMessage(e instanceof Error ? e.message : 'Could not look up these places.');
    }
  };

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
    setOriginCoords(destinationCoords);
    setDestinationCoords(originCoords);
  };

  const toggleDay = (d: WeekDay) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const mutation = useMutation({
    mutationFn: createRideOffer,
    onSuccess: (ride) => {
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'home-widget'] }),
      ]);
      setPublished(ride);
    },
    onError: (e) => showError('Ride not published', e),
  });

  const publish = () => {
    const at = departureFrom(departure.dayOffset, departure.hour, departure.minute);
    const next: Record<string, string | null> = {
      origin: origin.trim() ? null : 'Enter where you start.',
      destination: destination.trim() ? null : 'Enter where you are going.',
      seats: seatsError(seats),
      amount: amountError(amount),
      departure: departureError(at),
      days: isRecurring && days.length === 0 ? 'Choose at least one day.' : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    const orderedDays = ALL_DAYS.map((d) => d.id).filter((d) => days.includes(d));
    mutation.mutate({
      originArea: origin,
      destinationArea: destination,
      departureAt: at.toISOString(),
      seatsTotal: Number(seats),
      contributionAmount: Number(amount),
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destinationLat: destinationCoords?.lat,
      destinationLng: destinationCoords?.lng,
      routePolyline: route?.polyline || undefined,
      distanceMiles: route ? Math.round(route.distanceMiles * 100) / 100 : undefined,
      estimatedDurationMins: route ? Math.round(route.durationMinutes) : undefined,
      tollPreference: tollPref,
      isRecurring,
      recurrencePattern: isRecurring ? patternFor(orderedDays) : 'ONE_TIME',
      recurringDays: isRecurring ? orderedDays : [],
      luggageCapacity: luggage,
      genderPreference: gender,
    });
  };

  if (published) {
    return (
      <Screen>
        <YStack gap="$x4">
          <Card aria-live="polite" gap="$x3" variant="tinted">
            <AppText role="heading" variant="h2">
              Ride published
            </AppText>
            <AppText>{published.routeLabel}</AppText>
            <AppText tone="muted">
              Departs {new Date(published.departureAt).toLocaleString()} · {published.seatsTotal}{' '}
              {published.seatsTotal === 1 ? 'seat' : 'seats'} ·{' '}
              {published.contributionLabel ?? contributionText(Number(amount))}
            </AppText>
            <AppText tone="muted" variant="caption">
              Riders can find and book it now. You will see bookings and requests under My rides.
            </AppText>
            <XStack flexWrap="wrap" gap="$x2">
              <AppButton
                label="View ride"
                onPress={() => router.replace(`/rides/${published.id}` as Href)}
              />
              <AppButton
                label="My rides"
                onPress={() => router.replace('/rides/mine' as Href)}
                variant="secondary"
              />
            </XStack>
          </Card>
        </YStack>
      </Screen>
    );
  }

  const seatsNumber = Number(seats);
  const stepSeats = (delta: number) => {
    const base = Number.isFinite(seatsNumber) ? seatsNumber : 1;
    setSeats(String(Math.min(8, Math.max(1, base + delta))));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Screen>
        <YStack gap="$x5">
          <BackButton fallback="/rides" />
          <YStack gap="$x1">
            <AppText role="heading" variant="h2">
              Offer a ride
            </AppText>
            <AppText tone="muted" variant="caption">
              Share your trip and split costs with people going your way
            </AppText>
          </YStack>

          {templates.length > 0 ? (
            <YStack gap="$x2">
              <AppText variant="label">Post one of your earlier routes again</AppText>
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
              >
                <XStack gap="$x2" paddingVertical="$x1">
                  {templates.map((t) => (
                    <ChoiceChip
                      accessibilityLabel={`Fill in ${t.origin} to ${t.destination}`}
                      key={t.id}
                      label={`${t.origin.split(',')[0]} → ${t.destination.split(',')[0]}`}
                      onPress={() => applyTemplate(t)}
                      selected={false}
                    />
                  ))}
                </XStack>
              </ScrollView>
            </YStack>
          ) : null}

          <Card gap="$x3" variant="outlined">
            <XStack alignItems="center" justifyContent="space-between">
              <AppText variant="h4">Route</AppText>
              <AppButton icon="refresh" label="Swap" onPress={swap} variant="ghost" />
            </XStack>
            <RideLocationPicker
              error={errors.origin}
              label="Pickup area"
              onCoordsChange={setOriginCoords}
              onValueChange={setOrigin}
              value={origin}
            />
            <RideLocationPicker
              error={errors.destination}
              label="Destination"
              onCoordsChange={setDestinationCoords}
              onValueChange={setDestination}
              placeholder="Work hub, campus, or city"
              value={destination}
            />
            <AppText aria-live="polite" tone={routeMessage ? 'warm' : 'muted'} variant="caption">
              {routeLoading
                ? 'Looking up the route…'
                : route
                  ? `${route.distanceMiles.toFixed(1)} mi · ${durationLabel(route.durationMinutes) ?? ''}${route.hasTolls ? ' · route has toll roads' : ''}`
                  : (routeMessage ??
                    'Choose both places from the suggestions to add distance and travel time.')}
            </AppText>
          </Card>

          <Card gap="$x3" variant="outlined">
            <AppText variant="h4">Tolls</AppText>
            <XStack aria-label="Tolls" flexWrap="wrap" gap="$x2" role="radiogroup">
              {TOLL_OPTIONS.map((o) => (
                <ChoiceChip
                  key={o.id}
                  label={o.label}
                  onPress={() => setTollPref(o.id)}
                  radio
                  selected={tollPref === o.id}
                />
              ))}
            </XStack>
          </Card>

          <Card gap="$x3" variant="outlined">
            <AppText variant="h4">When</AppText>
            <XStack aria-label="Schedule" flexWrap="wrap" gap="$x2" role="radiogroup">
              <ChoiceChip
                label="One-time trip"
                onPress={() => setIsRecurring(false)}
                radio
                selected={!isRecurring}
              />
              <ChoiceChip
                label="Repeats weekly"
                onPress={() => setIsRecurring(true)}
                radio
                selected={isRecurring}
              />
            </XStack>
            {isRecurring ? (
              <YStack gap="$x2">
                <AppText variant="label">Days</AppText>
                <XStack flexWrap="wrap" gap="$x2">
                  {ALL_DAYS.map((d) => (
                    <ChoiceChip
                      accessibilityLabel={d.name}
                      key={d.id}
                      label={d.label}
                      onPress={() => toggleDay(d.id)}
                      selected={days.includes(d.id)}
                    />
                  ))}
                </XStack>
                {errors.days ? (
                  <AppText aria-live="polite" tone="danger" variant="caption">
                    {errors.days}
                  </AppText>
                ) : null}
              </YStack>
            ) : null}
            <DeparturePicker
              dateLabel={isRecurring ? 'First departure date' : 'Departure date'}
              error={errors.departure}
              onChange={(v) => {
                setDeparture(v);
                setErrors((e) => ({ ...e, departure: null }));
              }}
              value={departure}
            />
          </Card>

          <Card gap="$x3" variant="outlined">
            <AppText variant="h4">Seats and price</AppText>
            <XStack alignItems="flex-start" gap="$x2">
              <YStack flex={1}>
                <TextField
                  error={errors.seats}
                  helper="1 to 8 seats"
                  keyboardType="number-pad"
                  label="Seats offered"
                  maxLength={1}
                  onChangeText={(t) => {
                    setSeats(t);
                    setErrors((e) => ({ ...e, seats: seatsError(t) }));
                  }}
                  value={seats}
                />
              </YStack>
              <XStack gap="$x2" paddingTop="$x6">
                <AppButton label="−" onPress={() => stepSeats(-1)} variant="secondary" />
                <AppButton label="+" onPress={() => stepSeats(1)} variant="secondary" />
              </XStack>
            </XStack>
            <TextField
              error={errors.amount}
              helper="What each rider pays you toward fuel; 0 for free."
              keyboardType="decimal-pad"
              label="Contribution per seat ($)"
              onChangeText={(t) => {
                setAmount(t);
                setErrors((e) => ({ ...e, amount: null }));
              }}
              placeholder="e.g. 12"
              value={amount}
            />
          </Card>

          <Card gap="$x3" variant="outlined">
            <AppText variant="h4">Preferences</AppText>
            <AppText variant="label">Luggage space</AppText>
            <XStack aria-label="Luggage space" flexWrap="wrap" gap="$x2" role="radiogroup">
              {LUGGAGE_OPTIONS.map((o) => (
                <ChoiceChip
                  key={o.id}
                  label={o.label}
                  onPress={() => setLuggage(o.id)}
                  radio
                  selected={luggage === o.id}
                />
              ))}
            </XStack>
            <AppText variant="label">Who can book</AppText>
            <XStack aria-label="Who can book" flexWrap="wrap" gap="$x2" role="radiogroup">
              {GENDER_OPTIONS.map((o) => (
                <ChoiceChip
                  key={o.id}
                  label={o.label}
                  onPress={() => setGender(o.id)}
                  radio
                  selected={gender === o.id}
                />
              ))}
            </XStack>
            {gender === 'FEMALE_ONLY' ? (
              <AppText tone="muted" variant="caption">
                Only riders whose gender ManaBandhu has verified can book a women-only ride. Riders
                who are not verified yet will be refused, so you may get fewer bookings.
              </AppText>
            ) : null}
          </Card>

          <YStack gap="$x2">
            <AppButton
              fullWidth
              label="Publish ride"
              loading={mutation.isPending}
              onPress={publish}
              size="lg"
            />
          </YStack>
        </YStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
