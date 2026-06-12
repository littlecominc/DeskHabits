import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { demoProfile } from '@/lib/demo-data';
import SignOutButton from './SignOutButton';
import UpgradeButton from './UpgradeButton';

export const dynamic = 'force-dynamic';

async function getProfileData() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { profile: demoProfile, subjects: [], isDemo: true };

    const [{ data: profile }, { data: subjects }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]);

    return {
      profile: profile ?? demoProfile,
      subjects: subjects ?? [],
      isDemo: false,
    };
  } catch {
    return { profile: demoProfile, subjects: [], isDemo: true };
  }
}

export default async function ProfilePage() {
  const { profile, subjects, isDemo } = await getProfileData();
  const p = profile as any;
  const isPro = p.subscription_status === 'active';

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">{p.full_name ?? 'Your Profile'}</h1>
      <p className="mb-6 text-sm text-muted">{p.email ?? (isDemo ? 'Demo mode — sign in to save your progress' : '')}</p>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 font-serif text-lg">Subscription</div>
        {isPro ? (
          <div className="flex items-center gap-2 text-sm text-green">
            <span>✓</span> DeskHabits Pro — active
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">
              Unlock unlimited courses, full analytics, and accountability groups.
            </p>
            <UpgradeButton disabled={isDemo} />
          </>
        )}
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-serif text-lg">Your Classes</div>
        </div>
        {subjects.length ? (
          <ul className="space-y-2">
            {subjects.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{s.name}</span>
                {s.next_test_date && <span className="text-xs text-muted">Test {s.next_test_date}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No classes added yet.</p>
        )}
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-3 font-serif text-lg">Daily commitment</div>
        <div className="text-2xl font-semibold text-accent">{((p.daily_minutes ?? 150) / 60).toFixed(1)} hrs / day</div>
      </section>

      {!isDemo && <SignOutButton />}
      {isDemo && (
        <a
          href="/auth/sign-in"
          className="block rounded-xl2 border border-border py-3 text-center text-sm font-medium text-muted"
        >
          Sign In
        </a>
      )}

      <BottomNav />
    </main>
  );
}
