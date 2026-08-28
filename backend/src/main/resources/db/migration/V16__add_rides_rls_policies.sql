-- Rides RLS policies and grants
-- Policies target authenticated users only.
-- Grants are added for the Data API path; backend API authorization
-- is still enforced in application code.

-- ride_offers
create policy ride_offers_select on public.ride_offers
  for select to authenticated
  using (driver_id = (select auth.uid()) or status = 'active');

create policy ride_offers_insert on public.ride_offers
  for insert to authenticated
  with check (driver_id = (select auth.uid()));

create policy ride_offers_update on public.ride_offers
  for update to authenticated
  using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid()));

create policy ride_offers_delete on public.ride_offers
  for delete to authenticated
  using (driver_id = (select auth.uid()));

-- ride_requests
create policy ride_requests_select on public.ride_requests
  for select to authenticated
  using (
    rider_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_requests.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_requests_insert on public.ride_requests
  for insert to authenticated
  with check (rider_id = (select auth.uid()));

create policy ride_requests_update on public.ride_requests
  for update to authenticated
  using (
    rider_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_requests.ride_id
        and offer.driver_id = (select auth.uid())
    )
  )
  with check (
    rider_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_requests.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_requests_delete on public.ride_requests
  for delete to authenticated
  using (rider_id = (select auth.uid()));

-- ride_participants
create policy ride_participants_select on public.ride_participants
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_participants.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_participants_insert on public.ride_participants
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_participants.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_participants_delete on public.ride_participants
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_participants.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

-- ride_bookings
create policy ride_bookings_select on public.ride_bookings
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_bookings.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_bookings_insert on public.ride_bookings
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy ride_bookings_update on public.ride_bookings
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_bookings.ride_id
        and offer.driver_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_bookings.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_bookings_delete on public.ride_bookings
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_bookings.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

-- ride_ratings
create policy ride_ratings_select on public.ride_ratings
  for select to authenticated
  using (
    rater_id = (select auth.uid())
    or ratee_id = (select auth.uid())
    or exists (
      select 1 from public.ride_offers offer
      where offer.id = ride_ratings.ride_id
        and offer.driver_id = (select auth.uid())
    )
  );

create policy ride_ratings_insert on public.ride_ratings
  for insert to authenticated
  with check (
    rater_id = (select auth.uid())
    and rater_id <> ratee_id
  );

create policy ride_ratings_delete on public.ride_ratings
  for delete to authenticated
  using (rater_id = (select auth.uid()));

-- Minimum grants for the Data API path.
grant select, insert, update, delete on public.ride_offers to authenticated;
grant select, insert, update, delete on public.ride_requests to authenticated;
grant select, insert, delete on public.ride_participants to authenticated;
grant select, insert, update, delete on public.ride_bookings to authenticated;
grant select, insert, delete on public.ride_ratings to authenticated;
