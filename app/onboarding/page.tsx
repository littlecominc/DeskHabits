'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [classes, setClasses] = useState(['', '', '']);
  const [dailyMinutes, setDailyMinutes] = useState(150);
  const [focusMinutes, setFocusMinutes] = useState(20);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const score = Math.max(5, Math.min(95, Math.round(40 - (focusMinutes - 20) * 0.8 + (dailyMinutes < 60 ? 10 : 0))));

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account');
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    await supabase.from('profiles').upsert({
      id: userId,
      full_name: name,
      email,
      desk_habits_score: score,
      daily_minutes: dailyMinutes,
      baseline_focus_minutes: focusMinutes,
      pledge_signed_at: new Date().toISOString(),
      pledge_signature: name,
    });

    const subjectRows = classes.filter((c) => c.trim()).map((c) => ({ user_id: userId, name: c.trim() }));
    if (subjectRows.length) {
      await supabase.from('subjects').insert(subjectRows);
    }

    await supabase.from('progress').upsert({ user_id: userId });

    setLoading(false);
    router.push('/home');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-10">
      {/* Step 0: classes */}
      {step === 0 && (
        <Step title="What classes are you taking?" onNext={() => setStep(1)}>
          {classes.map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={(e) => {
                const next = [...classes];
                next[i] = e.target.value;
                setClasses(next);
              }}
              placeholder={`Class ${i + 1}`}
              className="mb-2 w-full rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
          ))}
          <button
            type="button"
            onClick={() => setClasses([...classes, ''])}
            className="mb-4 rounded-lg border border-border px-4 py-2 text-sm text-muted"
          >
            + Add Class
          </button>
        </Step>
      )}

      {/* Step 1: daily minutes */}
      {step === 1 && (
        <Step title="Realistically, how much time can you dedicate each day?" onNext={() => setStep(2)}>
          <div className="mb-2 text-center text-3xl font-semibold text-accent">{(dailyMinutes / 60).toFixed(1)} hrs</div>
          <input
            type="range"
            min={15}
            max={360}
            step={15}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="w-full accent-[#e8d9b5]"
          />
        </Step>
      )}

      {/* Step 2: focus span */}
      {step === 2 && (
        <Step title="How long can you focus before drifting or reaching for your phone?" onNext={() => setStep(3)}>
          <div className="mb-2 text-center text-3xl font-semibold text-accent">{focusMinutes} min</div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={focusMinutes}
            onChange={(e) => setFocusMinutes(Number(e.target.value))}
            className="w-full accent-[#e8d9b5]"
          />
        </Step>
      )}

      {/* Step 3: score reveal */}
      {step === 3 && (
        <Step title="Your Desk Habits Score" onNext={() => setStep(4)} nextLabel="See how we fix this →">
          <div className="py-6 text-center">
            <div className="text-5xl font-bold text-red">{score}<span className="text-2xl text-muted">/100</span></div>
            <p className="mt-3 text-sm text-muted">
              This isn't your fault — no one ever taught you how to actually study. That's what DeskHabits is for.
            </p>
          </div>
        </Step>
      )}

      {/* Step 4: account creation */}
      {step === 4 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 font-serif text-xl font-semibold">Save your plan</h2>
          <p className="mb-6 text-sm text-muted">Create your account to lock in your schedule.</p>
          <form onSubmit={handleSignUp} className="flex flex-1 flex-col gap-3">
            <input
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-red">{error}</p>}
            <div className="flex-1" />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-50"
            >
              {loading ? 'Building your plan…' : 'Build My Plan →'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function Step({
  title,
  children,
  onNext,
  nextLabel = 'Continue →',
}: {
  title: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-5 font-serif text-xl font-semibold leading-snug">{title}</h2>
      <div className="mb-6">{children}</div>
      <div className="flex-1" />
      <button onClick={onNext} className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
        {nextLabel}
      </button>
    </div>
  );
}
