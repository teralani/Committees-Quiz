'use server';

import { createActionClient } from '@/utils/supabase/actions';
import { redirect } from 'next/navigation';

// Use Set for O(1) domain lookup instead of array includes
const ALLOWED_DOMAINS = new Set([
  'kingmun.org',
  'seattlemun.org',
  'pacificmun.com',
  'edumun.com',
  'munnorthwest.org',
]);

export async function login(formData) {
  const supabase = await createActionClient();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/dashboard');
}

export async function signup(formData) {
  const supabase = await createActionClient();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!ALLOWED_DOMAINS.has(emailDomain)) {
    redirect(`/signup?error=${encodeURIComponent("This email isn't approved for sign-up. Use an organization email from an approved conference domain.")}`);
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}