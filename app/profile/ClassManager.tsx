'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Subject = { id: string; name: string; next_test_date: string | null };

export default function ClassManager({ initial }: { initial: Subject[] }) {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>(initial);
  const [name, setName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addClass() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('You need to be signed in.');
      setBusy(false);
      return;
    }
    const { data, error: insertError } = await supabase
      .from('subjects')
      .insert({ user_id: user.id, name: trimmed, next_test_date: testDate || null })
      .select('id, name, next_test_date')
      .single();
    setBusy(false);
    if (insertError || !data) {
      setError(insertError?.message ?? 'Could not add class.');
      return;
    }
    setSubjects((prev) => [...prev, data]);
    setName('');
    setTestDate('');
  }

  async function removeClass(id: string) {
    const prev = subjects;
    setSubjects((s) => s.filter((x) => x.id !== id));
    const { error: delError } = await supabase.from('subjects').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      setSubjects(prev); // roll back
    }
  }

  return (
    <div>
      {subjects.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {subjects.map((s) => (
            <div key={s.id} className="schedule-item">
              <div className="task-col">
                <div className="task-name">{s.name}</div>
                {s.next_test_date && (
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Test {s.next_test_date}</span>
                )}
              </div>
              <button
                onClick={() => removeClass(s.id)}
                className="tag"
                style={{ color: 'var(--red)', borderColor: 'var(--border)' }}
                aria-label={`Remove ${s.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. AP Biology"
        style={{ marginBottom: 8 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') addClass();
        }}
      />
      <input
        type="text"
        value={testDate}
        onChange={(e) => setTestDate(e.target.value)}
        placeholder="Next test date (optional) — YYYY-MM-DD"
        style={{ marginBottom: 10 }}
      />
      {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <button className="btn btn-ghost btn-sm" style={{ display: 'inline-block' }} disabled={busy || !name.trim()} onClick={addClass}>
        {busy ? 'Adding…' : '+ Add Class'}
      </button>
    </div>
  );
}
