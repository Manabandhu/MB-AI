-- The app saves progress for a profile-photo step and marks completion with current_step = 'complete', but neither
-- key existed in onboarding_steps, so the current_step foreign key rejected those saves and nobody could finish
-- onboarding. Add both steps and renumber step_order to match the app's flow.
INSERT INTO public.onboarding_steps (step_key, step_order, title, subtitle, is_multi_select, is_required)
VALUES
    ('profile-photo', 5, 'Add a photo and short bio', 'Help roommates and carpool partners recognise you.', false, false),
    ('complete', 8, 'You''re all set', 'Your preferences are saved.', false, false)
ON CONFLICT (step_key) DO NOTHING;

UPDATE public.onboarding_steps SET step_order = 6 WHERE step_key = 'notifications';
UPDATE public.onboarding_steps SET step_order = 7 WHERE step_key = 'trust_safety';

-- Onboarding copy must not promise verification the product does not perform.
UPDATE public.onboarding_options SET description = 'Browse rooms, apartments, and shared living listed by members'
WHERE step_key = 'goals' AND option_key = 'housing';
UPDATE public.onboarding_options SET description = 'Get referred directly by people in your community'
WHERE step_key = 'goals' AND option_key = 'career';
UPDATE public.onboarding_options SET description = 'Alerts when new rooms open up in your metro'
WHERE step_key = 'notifications' AND option_key = 'room_openings';
UPDATE public.onboarding_steps SET subtitle = 'ManaBandhu works when everyone is honest, respectful, and safe.'
WHERE step_key = 'trust_safety';
