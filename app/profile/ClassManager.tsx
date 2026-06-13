'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Subject = { id: string; name: string; next_test_date: string | null };

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function relativeLabel(dateStr: string): string {
  const n = daysUntil(dateStr);
  if (n < 0) return 'past';
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  return `in ${n} days`;
}

export default function ClassManager({ initial }: { initial: Subject[] }) {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>(initial);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addClass() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
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
      .insert({ user_id: user.id, name: trimmed })
      .select('id, name, next_test_date')
      .single();
    setBusy(false);
    if (insertError || !data) {
      setError(insertError?.message ?? 'Could not add class.');
      return;
    }
    setSubjects((prev) => [...prev, data]);
    setName('');
  }

  async function removeClass(id: string) {
    const prev = subjects;
    setSubjects((s) => s.filter((x) => x.id !== id));
    const { error: delError } = await supabase.from('subjects').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      setSubjects(prev);
    }
  }

  async function setTestDate(id: string, date: string) {
    const prev = subjects;
    const value = date || null;
    setSubjects((s) => s.map((x) => (x.id === id ? { ...x, next_test_date: value } : x)));
    const { error: updErr } = await supabase.from('subjects').update({ next_test_date: value }).eq('id', id);
    if (updErr) {
      setError(updErr.message);
      setSubjects(prev);
    }
  }

  return (
    <>
      {/* CLASSES */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Your Classes</h3>

        {subjects.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            {subjects.map((s) => (
              <div key={s.id} className="schedule-item">
                <div className="task-col"><div className="task-name">{s.name}</div></div>
                <button onClick={() => removeClass(s.id)} className="tag" style={{ color: 'var(--red)' }} aria-label={`Remove ${s.name}`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginBottom: 12 }}>No classes yet. Add as many as you like.</p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AP Biology"
            onKeyDown={(e) => { if (e.key === 'Enter') addClass(); }}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary btn-sm" disabled={busy || !name.trim()} onClick={addClass}>
            {busy ? '…' : 'Add'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</p>}
        <p style={{ fontSize: 12, marginTop: 8 }}>Add one at a time — they save instantly. There&apos;s no limit.</p>
      </div>

      {/* UPCOMING TESTS — separate feature */}
      <div className="card">
        <h3 style={{ marginBottom: 6 }}>Upcoming Tests</h3>
        <p style={{ marginBottom: 12 }}>Set a test date for any class. The soonest one is highlighted on your home screen.</p>
        {subjects.length === 0 ? (
          <p>Add a class first.</p>
        ) : (
          subjects.map((s) => (
            <div key={s.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                {s.next_test_date && (
                  <span className={`pill ${daysUntil(s.next_test_date) <= 7 ? 'pill-urgent' : 'pill-deep'}`}>
                    {relativeLabel(s.next_test_date)}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={s.next_test_date ?? ''}
                onChange={(e) => setTestDate(s.id, e.target.value)}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
