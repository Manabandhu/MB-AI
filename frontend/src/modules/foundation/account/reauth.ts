import { supabase } from '@/lib/supabase';

/**
 * Re-authentication before sensitive actions (deleting the account, changing email or phone). It signs in again
 * as the same person, which refreshes the sign-in time the server checks; it never switches accounts.
 */
export async function reauthWithPassword(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('Could not confirm your identity.');
}

export async function sendReauthCode(target: {
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  const { error } = target.email
    ? await supabase.auth.signInWithOtp({
        email: target.email,
        options: { shouldCreateUser: false },
      })
    : await supabase.auth.signInWithOtp({
        phone: target.phone ?? '',
        options: { shouldCreateUser: false },
      });
  if (error) throw error;
}

export async function verifyReauthCode(
  target: { email?: string | null; phone?: string | null },
  code: string,
): Promise<void> {
  const { error } = target.email
    ? await supabase.auth.verifyOtp({ email: target.email, token: code, type: 'email' })
    : await supabase.auth.verifyOtp({ phone: target.phone ?? '', token: code, type: 'sms' });
  if (error) throw error;
}

/** Starts an email or phone change; Supabase sends a confirmation to the new address before it takes effect. */
export async function requestContactChange(change: {
  email?: string;
  phone?: string;
}): Promise<void> {
  const { error } = await supabase.auth.updateUser(change);
  if (error) throw error;
}

/** Confirms a phone change with the code Supabase texted to the new number; the change only applies after this. */
export async function confirmPhoneChange(phone: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'phone_change' });
  if (error) throw error;
}
