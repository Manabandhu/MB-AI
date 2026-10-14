-- One pending seat request per rider per ride, so two concurrent requests cannot both pass the service check.
-- Older duplicates (none on the hosted database when this was written) are withdrawn first, keeping the newest.
UPDATE public.ride_requests r
SET status = 'withdrawn'
WHERE r.status = 'pending'
  AND EXISTS (
      SELECT 1 FROM public.ride_requests newer
      WHERE newer.ride_id = r.ride_id AND newer.rider_id = r.rider_id AND newer.status = 'pending'
        AND (newer.created_at > r.created_at OR (newer.created_at = r.created_at AND newer.id > r.id)));

CREATE UNIQUE INDEX IF NOT EXISTS ride_requests_one_pending_per_rider
    ON public.ride_requests (ride_id, rider_id) WHERE status = 'pending';
