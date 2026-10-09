-- V23 and V27 (and an untracked load-test seed on the hosted database) each inserted the onboarding options, so
-- every choice appeared two or three times and React keys collided. Keep the first row per (step_key, option_key);
-- saved progress stores option keys, not row ids, so nothing references the removed rows.
DELETE FROM public.onboarding_options duplicate
USING public.onboarding_options kept
WHERE duplicate.step_key = kept.step_key
  AND duplicate.option_key = kept.option_key
  AND duplicate.ctid > kept.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_options_step_option_key
    ON public.onboarding_options (step_key, option_key);
