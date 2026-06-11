'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { demoSubjects } from '@/lib/demo-data';

type Stage =
  | 'setup'
  | 'environment'
  | 'braindump'
  | 'goal'
  | 'breathing'
  | 'runway'
  | 'active'
  | 'break-reason'
  | 'break'
  | 'review';

const ENV_ITEMS = ['Phone in another room (or face-down, on silent)', 'Close all unrelated tabs', 'Desk cleared of clutter', 'Water within reach'];
const AMBIENT = ['Silence', 'Rain', 'Cafe Noise', 'Lo-fi'];
const BREAK_REASONS = [
  { id: 'natural', label: "I hit my goal — natural break" },
  { id: 'focus_broke', label: 'My focus broke' },
  { id: 'need_to_think', label: 'I need to think something through' },
  { id: 'water_movement', label: 'I need water / to move' },
];

export default function SessionPage() {
  const supabase = createClient();
  const [stage, setStage] = useState<Stage>('setup');
  const [sessionType, setSessionType] = useState<'deep' | 'light'>('deep');
  const [subject, setSubject] = useState(demoSubjects[0]?.name ?? 'Study');

  const [checks, setChecks] = useState<boolean[]>(ENV_ITEMS.map(() => false));
  const [ambient, setAmbient] = useState('Silence');
  const [brainDump, setBrainDump] = useState('');
  const [goal, setGoal] = useState('');
  const [depth, setDepth] = useState(5);

  const planned = sessionType === 'deep' ? 50 * 60 : 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(planned);
  const [distractions, setDistractions] = useState(0);
  const [showStruggle, setShowStruggle] = useState(false);
  const startedAt = useRef<string | null>(null);

  const [breakReason, setBreakReason] = useState<string | null>(null);
  const [breakSeconds, setBreakSeconds] = useState(300);

  const [finishTag, setFinishTag] = useState<'finished' | 'partial' | 'failed' | null>(null);

  // Active session countdown
  useEffect(() => {
    if (stage !== 'active') return;
    if (secondsLeft <= 0) {
      setStage('break-reason');
      setBreakReason('natural');
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, secondsLeft]);

  // Break countdown
  useEffect(() => {
    if (stage !== 'break') return;
    if (breakSeconds <= 0) {
      setStage('review');
      return;
    }
    const t = setTimeout(() => setBreakSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, breakSeconds]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - secondsLeft / planned;

  function logDistraction() {
    const next = distractions + 1;
    setDistractions(next);
    if (next >= 3) setShowStruggle(true);
  }

  function startSession() {
    startedAt.current = new Date().toISOString();
    setSecondsLeft(planned);
    setStage('active');
  }

  async function finishSession(tag: 'finished' | 'partial' | 'failed') {
    setFinishTag(tag);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('sessions').insert({
          user_id: user.id,
          session_type: sessionType,
          goal,
          depth_rating: sessionType === 'deep' ? depth : null,
          planned_seconds: planned,
          actual_seconds: planned - secondsLeft,
          brain_dump: brainDump,
          finished_goal: tag === 'finished',
          started_at: startedAt.current,
          ended_at: new Date().toISOString(),
        });
      }
    } catch {
      // demo mode — nothing to persist
    }
    setStage('review');
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      {/* SETUP */}
      {stage === 'setup' && (
        <div className="flex flex-1 flex-col">
          <h1 className="mb-1 font-serif text-2xl">New Session</h1>
          <p className="mb-6 text-sm text-muted">Choose what you're working on.</p>

          <label className="mb-1 text-xs uppercase tracking-wide text-muted">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-5 rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
          >
            {demoSubjects.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          <label className="mb-2 text-xs uppercase tracking-wide text-muted">Session type</label>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => setSessionType('deep')}
              className={`rounded-xl2 border p-4 text-left ${sessionType === 'deep' ? 'border-accent bg-panel2' : 'border-border bg-panel'}`}
            >
              <div className="font-serif text-lg">Deep Work</div>
              <div className="text-xs text-muted">50 min · full ritual</div>
            </button>
            <button
              onClick={() => setSessionType('light')}
              className={`rounded-xl2 border p-4 text-left ${sessionType === 'light' ? 'border-accent bg-panel2' : 'border-border bg-panel'}`}
            >
              <div className="font-serif text-lg">Light Work</div>
              <div className="text-xs text-muted">25 min · quick focus</div>
            </button>
          </div>

          <div className="flex-1" />
          <button onClick={() => setStage('environment')} className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            Begin Ritual →
          </button>
          <Link href="/home" className="mt-3 text-center text-sm text-muted">Cancel</Link>
        </div>
      )}

      {/* ENVIRONMENT LOCK */}
      {stage === 'environment' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-5 font-serif text-xl">Lock In Your Environment</h2>
          <div className="mb-6 space-y-3">
            {ENV_ITEMS.map((item, i) => (
              <label key={item} className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={() => setChecks((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                  className="h-4 w-4 accent-[#e8d9b5]"
                />
                {item}
              </label>
            ))}
          </div>

          <label className="mb-2 text-xs uppercase tracking-wide text-muted">Ambient sound</label>
          <div className="mb-6 grid grid-cols-2 gap-2">
            {AMBIENT.map((a) => (
              <button
                key={a}
                onClick={() => setAmbient(a)}
                className={`rounded-lg border px-3 py-2 text-sm ${ambient === a ? 'border-accent bg-panel2' : 'border-border bg-panel text-muted'}`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="flex-1" />
          <button
            disabled={!checks.every(Boolean)}
            onClick={() => setStage('braindump')}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* BRAIN DUMP */}
      {stage === 'braindump' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">Loading Dock</h2>
          <p className="mb-4 text-sm text-muted">Dump every distracting thought here so your mind is free to focus.</p>
          <textarea
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            placeholder="What's on your mind..."
            className="mb-6 h-40 rounded-xl2 border border-border bg-panel p-4 text-sm outline-none focus:border-accent"
          />
          <div className="flex-1" />
          <button
            onClick={() => setStage(sessionType === 'deep' ? 'goal' : 'breathing')}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink"
          >
            Continue →
          </button>
        </div>
      )}

      {/* GOAL + DEPTH (deep work only) */}
      {stage === 'goal' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">Set Your Goal</h2>
          <p className="mb-4 text-sm text-muted">What does success look like for this session?</p>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Finish problems 1-10 and review derivatives"
            className="mb-6 h-28 rounded-xl2 border border-border bg-panel p-4 text-sm outline-none focus:border-accent"
          />

          <label className="mb-2 text-xs uppercase tracking-wide text-muted">How deep are you committing? (1-10)</label>
          <div className="mb-2 flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setDepth(n)}
                className={`h-8 flex-1 rounded ${n <= depth ? 'bg-accent' : 'bg-border'}`}
              />
            ))}
          </div>
          {depth >= 7 && (
            <div className="mb-4 rounded-lg border border-accent bg-panel2 p-3 text-xs text-accent">
              You're putting your reputation on the line for this one. No backing out.
            </div>
          )}

          <div className="flex-1" />
          <button
            disabled={!goal.trim()}
            onClick={() => setStage('breathing')}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* BREATHING */}
      {stage === 'breathing' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 h-32 w-32 animate-pulse rounded-full border-4 border-accent" />
          <h2 className="mb-2 font-serif text-xl">Breathe</h2>
          <p className="mb-8 text-sm text-muted">Take three slow breaths. In for 4, out for 6.</p>
          <button onClick={() => setStage('runway')} className="w-full rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            I'm Ready →
          </button>
        </div>
      )}

      {/* RUNWAY */}
      {stage === 'runway' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">Runway</h2>
          <p className="mb-6 text-sm text-muted">
            Goal: <span className="text-text">{goal || 'Stay focused for the full session'}</span>
          </p>
          <div className="mb-6 rounded-xl2 border border-border bg-panel p-4 text-sm text-muted">
            First physical action: open your materials and write the date at the top of your page. That's it — just start.
          </div>
          <div className="flex-1" />
          <button onClick={startSession} className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            Start Session ▶
          </button>
        </div>
      )}

      {/* ACTIVE SESSION */}
      {stage === 'active' && (
        <div className="flex flex-1 flex-col items-center">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted">{subject} · {sessionType === 'deep' ? 'Deep Work' : 'Light Work'}</div>
          <div className="relative my-6 flex h-48 w-48 items-center justify-center">
            <svg viewBox="0 0 200 200" className="h-48 w-48 -rotate-90">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#2a3354" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#e8d9b5"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-serif text-3xl">{fmt(secondsLeft)}</div>
          </div>

          <p className="mb-6 px-6 text-center text-sm text-muted">{goal || 'Stay focused.'}</p>

          <button onClick={logDistraction} className="mb-3 rounded-lg border border-border px-4 py-2 text-sm text-muted">
            Log a distraction ({distractions})
          </button>

          {showStruggle && (
            <div className="mb-4 w-full rounded-xl2 border border-red bg-panel2 p-4 text-center">
              <div className="mb-2 text-sm font-semibold text-red">Struggling?</div>
              <p className="mb-3 text-xs text-muted">3 distractions logged. Take a breath, re-read your goal, and give it 5 more minutes.</p>
              <button onClick={() => setShowStruggle(false)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink">
                Keep Going
              </button>
            </div>
          )}

          <div className="flex-1" />
          <button onClick={() => setStage('break-reason')} className="w-full rounded-xl2 border border-border py-3 text-center text-sm text-muted">
            End session early
          </button>
        </div>
      )}

      {/* BREAK REASON */}
      {stage === 'break-reason' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">Taking a break?</h2>
          <p className="mb-4 text-sm text-muted">What's prompting it?</p>
          <div className="mb-6 space-y-2">
            {BREAK_REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setBreakReason(r.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${breakReason === r.id ? 'border-accent bg-panel2' : 'border-border bg-panel'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {breakReason === 'focus_broke' && (
            <div className="mb-4 rounded-lg border border-accent bg-panel2 p-3 text-xs text-accent">
              Before you go — could you push through 5 more minutes? Most distractions pass if you wait them out.
            </div>
          )}

          <div className="flex-1" />
          <button
            disabled={!breakReason}
            onClick={() => {
              setBreakSeconds(sessionType === 'deep' ? 300 : 120);
              setStage('break');
            }}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            Take Break →
          </button>
        </div>
      )}

      {/* BREAK */}
      {stage === 'break' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted">Break</div>
          <div className="mb-6 font-serif text-5xl">{fmt(breakSeconds)}</div>

          <div className="mb-6 grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-green p-3 text-green">✓ Stretch</div>
            <div className="rounded-lg border border-green p-3 text-green">✓ Water</div>
            <div className="rounded-lg border border-green p-3 text-green">✓ Walk</div>
            <div className="rounded-lg border border-red p-3 text-red">✗ Phone / social media</div>
          </div>

          <button onClick={() => setStage('review')} className="w-full rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            Skip Break →
          </button>
        </div>
      )}

      {/* REVIEW */}
      {stage === 'review' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">Session Review</h2>
          <p className="mb-6 text-sm text-muted">How did it go?</p>

          {!finishTag ? (
            <div className="mb-6 space-y-2">
              <button onClick={() => finishSession('finished')} className="w-full rounded-lg border border-green bg-panel px-4 py-3 text-left text-sm text-green">
                ✓ Hit my goal
              </button>
              <button onClick={() => finishSession('partial')} className="w-full rounded-lg border border-yellow bg-panel px-4 py-3 text-left text-sm text-yellow">
                ~ Made progress, didn't finish
              </button>
              <button onClick={() => finishSession('failed')} className="w-full rounded-lg border border-red bg-panel px-4 py-3 text-left text-sm text-red">
                ✗ Got derailed
              </button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl2 border border-border bg-panel p-5">
              <div className="mb-3 text-sm">
                <span className="text-muted">Time focused:</span> {fmt(planned - secondsLeft)}
              </div>
              <div className="mb-3 text-sm">
                <span className="text-muted">Distractions logged:</span> {distractions}
              </div>
              <div className="text-sm">
                <span className="text-muted">Result:</span>{' '}
                {finishTag === 'finished' ? 'Goal hit ✓' : finishTag === 'partial' ? 'Partial progress' : 'Derailed'}
              </div>
            </div>
          )}

          <div className="flex-1" />
          <Link href="/home" className="rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink">
            Back to Home
          </Link>
        </div>
      )}
    </main>
  );
}
