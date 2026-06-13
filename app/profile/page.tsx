import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';
import UpgradeButton from './UpgradeButton';
import ClassManager from './ClassManager';

export const dynamic = 'force-dynamic';

async function getProfileData() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { profile: null, subjects: [], isDemo: true };

    let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

    // A profiles row is required before subjects can be added (FK), and may be
    // missing for accounts created before onboarding persisted reliably.
    if (!profile) {
      const { data: created } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, full_name: user.email })
        .select('*')
        .maybeSingle();
      profile = created ?? { id: user.id, email: user.email, full_name: user.email };
    }

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, next_test_date')
      .eq('user_id', user.id)
      .order('created_at');

    return { profile, subjects: subjects ?? [], isDemo: false };
  } catch {
    return { profile: null, subjects: [], isDemo: true };
  }
}

export default async function ProfilePage() {
  const { profile, subjects, isDemo } = await getProfileData();
  const p = (profile ?? {}) as any;
  const isPro = p.subscription_status === 'active';

  return (
    <div className="screen">
      <div className="content fade-in">
        <h1 style={{ marginBottom: 2 }}>{p.full_name ?? 'Your Profile'}</h1>
        <p style={{ marginBottom: 20 }}>{p.email ?? (isDemo ? 'Sign in to save your progress' : '')}</p>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Subscription</h3>
          {isPro ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--green)', fontSize: 14 }}>
              <span>✓</span> DeskHabits Pro — active
            </div>
          ) : (
            <>
              <p style={{ marginBottom: 12 }}>Unlock unlimited courses, full analytics, and accountability groups.</p>
              <UpgradeButton disabled={isDemo} />
            </>
          )}
        </div>

        {isDemo ? (
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Your Classes</h3>
            <p>Sign in to manage your classes.</p>
          </div>
        ) : (
          <ClassManager initial={subjects as any} />
        )}

        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Daily commitment</h3>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
            {((p.daily_minutes ?? 150) / 60).toFixed(1)} hrs / day
          </div>
        </div>

        {!isDemo ? (
          <SignOutButton />
        ) : (
          <a href="/auth/sign-in" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center' }}>
            Sign In
          </a>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
