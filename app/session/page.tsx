'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loadSchedule, saveSchedule, type ScheduleItem } from '@/lib/schedule';
import { hasCompletedIntro } from '@/lib/course';

type Stage =
  | 'loading'
  | 'needs-intro'
  | 'no-schedule'
  | 'category-pick'
  | 'braindump'
  | 'goal'
  | 'breathing'
  | 'incantation'
  | 'environment'
  | 'active'
  | 'need-more-time'
  | 'break-reason'
  | 'break'
  | 'subject-review'
  | 'session-complete';

const ENV_ITEMS = ['Desk cleared of clutter', 'Phone in another room or face-down', 'Close all unrelated tabs', 'Water within reach'];
const BREAK_REASONS = [
  { id: 'natural', label: "I'm done with this subject for now" },
  { id: 'focus_broke', label: 'My focus broke' },
  { id: 'need_to_think', label: 'I need to step away to think something through' },
  { id: 'water_movement', label: 'I need water / to move' },
];
const BLOCKER_TAGS = ['Got distracted by phone', 'Got distracted by something else', 'Lost motivation', 'Ran out of time'];

export default function SessionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>('loading');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [category, setCategory] = useState<'deep' | 'light' | null>(null);
  const [queue, setQueue] = useState<ScheduleItem[]>([]);
  const [subjectIdx, setSubjectIdx] = useState(0);

  const [brainDump, setBrainDump] = useState('');
  const [microSteps, setMicroSteps] = useState('');
  const [goal, setGoal] = useState('');
  const [depth, setDepth] = useState(5);
  const [checks, setChecks] = useState<boolean[]>(ENV_ITEMS.map(() => false));

  const [totalSecondsLeft, setTotalSecondsLeft] = useState(0);
  const [subjectSecondsLeft, setSubjectSecondsLeft] = useState(0);

  const [breakReason, setBreakReason] = useState<string | null>(null);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breakTimestamps, setBreakTimestamps] = useState<number[]>([]);
  const [showBreakWarning, setShowBreakWarning] = useState(false);
  const [showFocusPushback, setShowFocusPushback] = useState(false);

  const [breaksThisSubject, setBreaksThisSubject] = useState(0);
  const [subjectBreaks, setSubjectBreaks] = useState<{ reason: string; pushed_back: boolean; taken_at_seconds: number; planned_seconds: number }[]>([]);
  const [reviewFinished, setReviewFinished] = useState<boolean | null>(null);
  const [reviewBlocker, setReviewBlocker] = useState<string | null>(null);

  // ---- load schedule on mount ----
  useEffect(() => {
    if (!hasCompletedIntro()) {
      setStage('needs-intro');
      return;
    }
    const s = loadSchedule();
    if (!s || !s.items.length) {
      setStage('no-schedule');
      return;
    }
    setSchedule(s.items);
    const deepLeft = s.items.some((i) => i.category === 'deep' && !i.done);
    const lightLeft = s.items.some((i) => i.category === 'light' && !i.done);
    if (deepLeft && lightLeft) {
      setStage('category-pick');
    } else if (deepLeft) {
      beginCategory('deep', s.items);
    } else if (lightLeft) {
      beginCategory('light', s.items);
    } else {
      setStage('session-complete');
    }
  }, []);

  function beginCategory(cat: 'deep' | 'light', items: ScheduleItem[]) {
    const q = items.filter((i) => i.category === cat && !i.done);
    setCategory(cat);
    setQueue(q);
    setSubjectIdx(0);
    setTotalSecondsLeft(q.reduce((s, i) => s + i.minutes * 60, 0));
    setSubjectSecondsLeft(q[0].minutes * 60);
    setStage('braindump');
  }

  // ---- active timers ----
  useEffect(() => {
    if (stage !== 'active') return;
    if (subjectSecondsLeft <= 0) {
      setStage('need-more-time');
      return;
    }
    const t = setTimeout(() => {
      setSubjectSecondsLeft((s) => s - 1);
      setTotalSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [stage, subjectSecondsLeft]);

  // ---- break countdown ----
  useEffect(() => {
    if (stage !== 'break') return;
    if (breakSeconds <= 0) {
      setStage('active');
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

  const currentSubject = queue[subjectIdx];
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const subjectTotal = currentSubject ? currentSubject.minutes * 60 : 1;
  const progress = currentSubject ? 1 - subjectSecondsLeft / subjectTotal : 0;

  function startActive() {
    setStage('active');
  }

  function requestBreak() {
    setStage('break-reason');
    setBreakReason(null);
  }

  function confirmBreakReason(reasonId: string) {
    if (reasonId === 'focus_broke') {
      setShowFocusPushback(true);
      setBreakReason(reasonId);
      return;
    }
    actuallyTakeBreak(reasonId);
  }

  function actuallyTakeBreak(reasonId: string) {
    setShowFocusPushback(false);
    const now = Date.now();
    const recent = breakTimestamps.filter((t) => now - t < 60 * 60 * 1000);
    const updated = [...recent, now];
    setBreakTimestamps(updated);

    if (category === 'deep' && recent.length >= 1) {
      setShowBreakWarning(true);
    }

    setBreaksThisSubject((b) => b + 1);
    const seconds = reasonId === 'need_to_think' ? 600 : category === 'deep' ? 300 : 120;
    setBreakSeconds(seconds);
    setSubjectBreaks((prev) => [
      ...prev,
      {
        reason: reasonId,
        pushed_back: reasonId === 'focus_broke' && breakReason === 'focus_broke',
        taken_at_seconds: subjectTotal - subjectSecondsLeft,
        planned_seconds: seconds,
      },
    ]);
    setStage('break');
  }

  function endBreakEarly() {
    setSubjectBreaks((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      const updated = [...prev.slice(0, -1), { ...last, planned_seconds: last.planned_seconds - breakSeconds }];
      return updated;
    });
    setBreakSeconds(0);
  }

  function addTime(minutes: number) {
    setSubjectSecondsLeft(minutes * 60);
    setTotalSecondsLeft((s) => s + minutes * 60);
    setStage('active');
  }

  function moveOnToReview() {
    setStage('subject-review');
  }

  async function submitReview() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && currentSubject) {
        const { data: sessionRow } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            subject_id: currentSubject.id,
            session_type: category,
            goal: category === 'deep' ? goal : microSteps,
            micro_steps: microSteps ? microSteps.split('\n').filter((l) => l.trim()) : null,
            depth_rating: category === 'deep' ? depth : null,
            planned_seconds: subjectTotal,
            actual_seconds: subjectTotal - subjectSecondsLeft,
            brain_dump: brainDump,
            finished_goal: reviewFinished,
            failure_tags: reviewBlocker ? [reviewBlocker] : [],
            started_at: new Date(Date.now() - (subjectTotal - subjectSecondsLeft) * 1000).toISOString(),
            ended_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (sessionRow && subjectBreaks.length) {
          await supabase.from('breaks').insert(
            subjectBreaks.map((b) => ({
              session_id: sessionRow.id,
              reason: b.reason,
              pushed_back: b.pushed_back,
              taken_at_seconds: b.taken_at_seconds,
              duration_seconds: b.planned_seconds,
            })),
          );
        }
      }
    } catch {
      // demo mode
    }

    // mark this subject done in schedule
    const updatedSchedule = schedule.map((i) => (i.id === currentSubject.id ? { ...i, done: true } : i));
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);

    setReviewFinished(null);
    setReviewBlocker(null);
    setBreaksThisSubject(0);
    setSubjectBreaks([]);

    if (subjectIdx + 1 < queue.length) {
      setSubjectIdx((i) => i + 1);
      setSubjectSecondsLeft(queue[subjectIdx + 1].minutes * 60);
      setStage('active');
    } else {
      setStage('session-complete');
    }
  }

  // ===================== RENDER =====================

  if (stage === 'loading') return null;

  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      {/* NEEDS INTRO COURSE */}
      {stage === 'needs-intro' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="mb-2 font-serif text-xl">Watch the intro lesson first</h2>
          <p className="mb-6 text-sm text-muted">
            Before your first work session, watch the short intro on how DeskHabits works and the science behind deep focus.
          </p>
          <Link href="/course" className="w-full rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink">
            Go to Course →
          </Link>
          <Link href="/home" className="mt-3 text-sm text-muted">Back to Home</Link>
        </div>
      )}

      {/* NO SCHEDULE YET */}
      {stage === 'no-schedule' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="mb-2 font-serif text-xl">You haven't scheduled today yet</h2>
          <p className="mb-6 text-sm text-muted">Block out your work periods to start your first session.</p>
          <Link href="/session/schedule" className="w-full rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink">
            Block Out Your Work →
          </Link>
          <Link href="/home" className="mt-3 text-sm text-muted">Back to Home</Link>
        </div>
      )}

      {/* CATEGORY PICK */}
      {stage === 'category-pick' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-5 font-serif text-xl">What do you want to work on?</h2>
          <div className="space-y-3">
            {(['deep', 'light'] as const).map((cat) => {
              const items = schedule.filter((i) => i.category === cat && !i.done);
              if (!items.length) return null;
              return (
                <button
                  key={cat}
                  onClick={() => beginCategory(cat, schedule)}
                  className="w-full rounded-xl2 border border-border bg-panel p-4 text-left"
                >
                  <div className="font-serif text-lg">{cat === 'deep' ? 'Deep Work' : 'Light Work'}</div>
                  <div className="text-xs text-muted">{items.map((i) => i.name).join(', ')}</div>
                  <div className="text-xs text-muted">{items.reduce((s, i) => s + i.minutes, 0)} min total</div>
                </button>
              );
            })}
          </div>
          <div className="flex-1" />
          <Link href="/home" className="text-center text-sm text-muted">Back to Home</Link>
        </div>
      )}

      {/* BRAIN DUMP */}
      {stage === 'braindump' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">Loading Dock</h2>
          <textarea
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            placeholder="Dump every distracting thought here..."
            className="mb-6 h-40 rounded-xl2 border border-border bg-panel p-4 text-sm outline-none focus:border-accent"
          />
          <div className="flex-1" />
          <button onClick={() => setStage('goal')} className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            Continue →
          </button>
        </div>
      )}

      {/* GOAL / MICRO-STEPS */}
      {stage === 'goal' && (
        <div className="flex flex-1 flex-col">
          {category === 'deep' ? (
            <>
              <h2 className="mb-2 font-serif text-xl">Set Your Goal</h2>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What does success look like for this session?"
                className="mb-4 h-24 rounded-xl2 border border-border bg-panel p-4 text-sm outline-none focus:border-accent"
              />
            </>
          ) : (
            <h2 className="mb-2 font-serif text-xl">Break this down into mini steps</h2>
          )}

          <textarea
            value={microSteps}
            onChange={(e) => setMicroSteps(e.target.value)}
            placeholder="List the small steps you'll take, one at a time..."
            className="mb-6 h-28 rounded-xl2 border border-border bg-panel p-4 text-sm outline-none focus:border-accent"
          />

          {category === 'deep' && (
            <>
              <label className="mb-2 text-xs uppercase tracking-wide text-muted">How deep are you committing? (1-10)</label>
              <div className="mb-2 flex gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setDepth(n)} className={`h-8 flex-1 rounded ${n <= depth ? 'bg-accent' : 'bg-border'}`} />
                ))}
              </div>
              {depth >= 7 && (
                <div className="mb-4 rounded-lg border border-accent bg-panel2 p-3 text-xs text-accent">
                  You're putting your reputation on the line for this one. No backing out.
                </div>
              )}
            </>
          )}

          <div className="flex-1" />
          <button
            disabled={category === 'deep' ? !goal.trim() : !microSteps.trim()}
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
          <button onClick={() => setStage('incantation')} className="w-full rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            I'm Ready →
          </button>
        </div>
      )}

      {/* INCANTATION */}
      {stage === 'incantation' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="mb-4 font-serif text-xl">Say it out loud</h2>
          <p className="mb-2 px-4 font-serif text-lg italic">
            "I will go as long as I can without taking breaks and getting distracted."
          </p>
          <p className="mb-8 text-sm text-muted">
            Total session: {Math.round((totalSecondsLeft / 60) * 10) / 10} minutes across {queue.length} subject{queue.length > 1 ? 's' : ''}
          </p>
          <button onClick={() => setStage('environment')} className="w-full rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            Continue →
          </button>
        </div>
      )}

      {/* ENVIRONMENT LOCK (last) */}
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
          <div className="flex-1" />
          <button
            disabled={!checks.every(Boolean)}
            onClick={startActive}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            Start Session ▶
          </button>
        </div>
      )}

      {/* ACTIVE */}
      {stage === 'active' && currentSubject && (
        <div className="flex flex-1 flex-col items-center">
          <div className="mb-1 text-xs uppercase tracking-widest text-muted">
            Subject {subjectIdx + 1} of {queue.length} · {category === 'deep' ? 'Deep Work' : 'Light Work'}
          </div>
          <div className="mb-4 font-serif text-lg">{currentSubject.name}</div>

          <div className="relative my-4 flex h-44 w-44 items-center justify-center">
            <svg viewBox="0 0 200 200" className="h-44 w-44 -rotate-90">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#2a3354" strokeWidth="10" />
              <circle
                cx="100" cy="100" r={radius} fill="none" stroke="#e8d9b5" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-serif text-2xl">{fmt(subjectSecondsLeft)}</div>
          </div>

          <div className="mb-6 text-sm text-muted">Total remaining: {fmt(totalSecondsLeft)}</div>

          {showBreakWarning && (
            <div className="mb-4 w-full rounded-xl2 border border-red bg-panel2 p-4 text-center text-sm text-red">
              Taking several breaks is counterproductive to the deep work strategy.
              <button onClick={() => setShowBreakWarning(false)} className="mt-2 block w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink">
                Got it
              </button>
            </div>
          )}

          <div className="flex w-full flex-col gap-2">
            <button onClick={moveOnToReview} className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
              I'm Finished ✓
            </button>
            <button onClick={requestBreak} className="rounded-xl2 border border-border py-3 text-center text-sm text-muted">
              Take a break
            </button>
          </div>
        </div>
      )}

      {/* NEED MORE TIME */}
      {stage === 'need-more-time' && currentSubject && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="mb-2 font-serif text-xl">Time's up on {currentSubject.name}</h2>
          <p className="mb-6 text-sm text-muted">Do you need more time, or can you move on?</p>
          <div className="w-full space-y-2">
            <button onClick={() => addTime(5)} className="w-full rounded-lg border border-border bg-panel px-4 py-3 text-sm">+5 more minutes</button>
            <button onClick={() => addTime(10)} className="w-full rounded-lg border border-border bg-panel px-4 py-3 text-sm">+10 more minutes</button>
            <button onClick={moveOnToReview} className="w-full rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
              I'm Finished — Move On →
            </button>
          </div>
        </div>
      )}

      {/* BREAK REASON */}
      {stage === 'break-reason' && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-4 font-serif text-xl">Taking a break?</h2>

          {showFocusPushback ? (
            <div className="rounded-xl2 border border-accent bg-panel2 p-4 text-sm">
              <p className="mb-3 text-accent">The discomfort is your poor attention span. Try 5 more minutes to improve.</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => { setShowFocusPushback(false); setStage('active'); }} className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-ink">
                  Try 5 more minutes
                </button>
                <button onClick={() => actuallyTakeBreak('focus_broke')} className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
                  Take the break anyway
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {BREAK_REASONS.map((r) => (
                <button key={r.id} onClick={() => confirmBreakReason(r.id)} className="w-full rounded-lg border border-border bg-panel px-4 py-3 text-left text-sm">
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1" />
          <button onClick={() => setStage('active')} className="text-center text-sm text-muted">Never mind, keep going</button>
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
          <button onClick={endBreakEarly} className="w-full rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink">
            End Break Early →
          </button>
        </div>
      )}

      {/* SUBJECT REVIEW */}
      {stage === 'subject-review' && currentSubject && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-2 font-serif text-xl">{currentSubject.name}</h2>
          <p className="mb-4 text-sm text-muted">Did you finish your work?</p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button onClick={() => setReviewFinished(true)} className={`rounded-lg border py-3 text-sm ${reviewFinished === true ? 'border-green bg-panel2 text-green' : 'border-border bg-panel text-muted'}`}>Yes</button>
            <button onClick={() => setReviewFinished(false)} className={`rounded-lg border py-3 text-sm ${reviewFinished === false ? 'border-red bg-panel2 text-red' : 'border-border bg-panel text-muted'}`}>No</button>
          </div>

          {reviewFinished === false && (
            <>
              <p className="mb-3 text-sm text-muted">What got in your way?</p>
              <div className="mb-6 space-y-2">
                {BLOCKER_TAGS.map((tag) => (
                  <button key={tag} onClick={() => setReviewBlocker(tag)} className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${reviewBlocker === tag ? 'border-accent bg-panel2' : 'border-border bg-panel text-muted'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex-1" />
          <button
            disabled={reviewFinished === null || (reviewFinished === false && !reviewBlocker)}
            onClick={submitReview}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            {subjectIdx + 1 < queue.length ? 'Next Subject →' : 'Finish Session →'}
          </button>
        </div>
      )}

      {/* SESSION COMPLETE */}
      {stage === 'session-complete' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="mb-2 font-serif text-xl">Session Complete</h2>
          <p className="mb-8 text-sm text-muted">Nice work. Your analytics have been updated.</p>
          <Link href="/home" className="w-full rounded-xl2 bg-accent py-4 text-center font-serif text-lg font-semibold text-ink">
            Back to Home
          </Link>
        </div>
      )}
    </main>
  );
}
