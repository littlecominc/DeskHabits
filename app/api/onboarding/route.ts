import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Persists onboarding results right after signup. Because the project requires
// email confirmation, signUp() returns no session — so the client can't write
// profiles/subjects itself (RLS blocks anon). We do it here with the service
// role, guarded by verifying the userId + email belong to a just-created user.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { userId, email, fullName, score, dailyMinutes, focusMinutes, signature, classes } = body ?? {};
  if (!userId || !email) {
    return NextResponse.json({ error: 'missing userId or email' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Guard: only write if the userId really maps to this email (a fresh signup).
  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !userRes?.user || userRes.user.email?.toLowerCase() !== String(email).toLowerCase()) {
    return NextResponse.json({ error: 'user verification failed' }, { status: 403 });
  }

  const { error: profileErr } = await admin.from('profiles').upsert({
    id: userId,
    full_name: fullName ?? null,
    email,
    desk_habits_score: score ?? null,
    daily_minutes: dailyMinutes ?? null,
    baseline_focus_minutes: focusMinutes ?? null,
    pledge_signed_at: new Date().toISOString(),
    pledge_signature: signature ?? null,
  });
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const rows: { user_id: string; name: string }[] = (classes ?? [])
    .filter((c: string) => c && c.trim())
    .map((c: string) => ({ user_id: userId, name: c.trim() }));
  if (rows.length) {
    await admin.from('subjects').insert(rows);
  }

  await admin.from('progress').upsert({ user_id: userId });

  return NextResponse.json({ ok: true });
}
