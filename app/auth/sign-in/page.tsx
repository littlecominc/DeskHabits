'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/home');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-6">
      <h1 className="mb-1 font-serif text-2xl">Welcome back.</h1>
      <p className="mb-6 text-sm text-muted">Sign in to continue your streak.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-accent py-3 font-semibold text-ink disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        New here?{' '}
        <Link href="/onboarding" className="text-accent">
          Start the onboarding quiz
        </Link>
      </p>
    </main>
  );
}
