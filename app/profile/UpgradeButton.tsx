'use client';

import { useState } from 'react';

export default function UpgradeButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={disabled || loading}
      className="w-full rounded-xl2 bg-accent py-3 text-center text-sm font-semibold text-ink disabled:opacity-50"
    >
      {loading ? 'Redirecting…' : disabled ? 'Sign in to upgrade' : 'Upgrade to Pro →'}
    </button>
  );
}
