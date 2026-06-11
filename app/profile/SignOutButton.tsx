'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="block w-full rounded-xl2 border border-border py-3 text-center text-sm font-medium text-red"
    >
      Sign Out
    </button>
  );
}
