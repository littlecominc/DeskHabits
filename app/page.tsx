import Link from 'next/link';
import OAuthButtons from './auth/OAuthButtons';

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mb-3 text-5xl">🏛</div>
        <h1 className="font-serif text-3xl">DeskHabits</h1>
        <p className="mt-2 text-sm uppercase tracking-widest text-muted">Discipline builds freedom.</p>
      </div>

      <div className="flex flex-col gap-3">
        <OAuthButtons />

        <div className="my-2 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/onboarding"
          className="rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink"
        >
          Get Started
        </Link>
        <Link
          href="/auth/sign-in"
          className="rounded-xl2 border border-border py-4 text-center text-sm font-medium text-muted"
        >
          Sign In with Email
        </Link>
      </div>
    </main>
  );
}
