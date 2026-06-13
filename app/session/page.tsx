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
  | 'categorize'
  | 'r-lock'
  | 'r-clear'
  | 'r-water'
  | 'r-dump'
  | 'r-goal'
  | 'r-depth'
  | 'r-breath'
  | 'r-incant'
  | 'runway'
  | 'l-start'
  | 'blitzconfirm'
  | 'session'
  | 'struggle'
  | 'breakreason'
  | 'break'
  | 'review'
  | 'complete';

const FAIL_TAGS = ['Attention collapsed', 'Material too hard', 'External distraction', 'Ran out of time'];

export default function SessionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>('loading');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [queue, setQueue] = useState<ScheduleItem[]>([]);
  const [index, setIndex] = useState(0);
  const [category, setCategory] = useState<'deep' | 'light'>('deep');
  const [blitz, setBlitz] = useState(false);

  // ritual inputs
  const [lock1, setLock1] = useState(false);
  const [lock2, setLock2] = useState(false);
  const [ambient, setAmbient] = useState('Silence');
  const [brainDump, setBrainDump] = useState('');
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState(['', '', '', '']);
  const [depth, setDepth] = useState(0);
  const [runwaySuccess, setRunwaySuccess] = useState('');
  const [runwayAction, setRunwayAction] = useState('');

  // session state
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [total, setTotal] = useState(0);
  const [distractions, setDistractions] = useState<string[]>([]);
  const [showPulse, setShowPulse] = useState(false);
  const [pulseStep, setPulseStep] = useState('Step 1');
  const [showDial, setShowDial] = useState(false);
  const [dialRating, setDialRating] = useState(0);
  const [pushback, setPushback] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState<{ reason: string; pushed: boolean; at: number }[]>([]);

  // review
  const [finishedMicro, setFinishedMicro] = useState<boolean | null>(null);
  const [failTags, setFailTags] = useState<string[]>([]);

  const [toast, setToast] = useState('');

  const current = queue[index];

  // ---------- mount ----------
  useEffect(() => {
    if (!hasCompletedIntro()) {
      setStage('needs-intro');
      return;
    }
    const isBlitz = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('blitz') === '1';
    const s = loadSchedule();
    if (s?.items?.length) {
      setSchedule(s.items);
      const q = s.items.filter((i) => !i.done);
      setQueue(q);
      if (isBlitz) {
        setStage('blitzconfirm');
      } else if (q.length) {
        setStage('categorize');
      } else {
        setStage('complete');
      }
    } else {
      if (isBlitz) setStage('blitzconfirm');
      else setStage('no-schedule');
    }
  }, []);

  // ---------- blitz theme toggle ----------
  useEffect(() => {
    const shell = document.getElementById('app-shell');
    if (!shell) return;
    shell.classList.toggle('blitz', blitz);
    return () => shell.classList.remove('blitz');
  }, [blitz]);

  // ---------- session timer ----------
  useEffect(() => {
    if (stage !== 'session') return;
    if (secondsLeft <= 0) {
      setStage('review');
      return;
    }
    const t = setTimeout(() => {
      const next = secondsLeft - 1;
      setSecondsLeft(next);
      const elapsed = total - next;
      if (!showPulse && total > 1800 && elapsed >= total / 2) setShowPulse(true);
      if (!showDial && elapsed >= 15) setShowDial(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [stage, secondsLeft, total, showPulse, showDial]);

  // ---------- break timer ----------
  useEffect(() => {
    if (stage !== 'break') return;
    if (breakSeconds <= 0) {
      setStage('session');
      return;
    }
    const t = setTimeout(() => setBreakSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, breakSeconds]);

  function fmt(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  // ---------- flow actions ----------
  function categorize(type: 'deep' | 'light') {
    setCategory(type);
    setPushback(false);
    setStage('r-lock');
  }

  function afterDump() {
    setStage(category === 'deep' ? 'r-goal' : 'l-start');
  }

  function beginSession(type: 'deep' | 'light') {
    const minutes = current?.minutes ?? (type === 'deep' ? 50 : 25);
    const secs = minutes * 60;
    setTotal(secs);
    setSecondsLeft(secs);
    setDistractions([]);
    setShowPulse(false);
    setShowDial(false);
    setDialRating(0);
    setBreaksTaken([]);
    setStage('session');
  }

  function enterBlitz() {
    setBlitz(true);
    setCategory('deep');
    const secs = 25 * 60;
    setTotal(secs);
    setSecondsLeft(secs);
    setDistractions([]);
    setShowPulse(false);
    setShowDial(false);
    setGoal('Drill review packet');
    setStage('session');
    flashToast('⚡ Blitz Mode activated. Sessions are shorter, breaks are tighter, and Fata is watching.');
  }

  function logDistraction() {
    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const next = [...distractions, stamp];
    setDistractions(next);
    if (next.length >= 3) setStage('struggle');
  }

  function closeStruggle() {
    setDistractions([]);
    setStage('session');
  }

  function chooseBreakReason(reason: string) {
    if (reason === 'natural' || reason === 'water') {
      startBreak(reason, false);
    } else {
      setPushback(true);
    }
  }

  function startBreak(reason: string, pushed: boolean) {
    setBreaksTaken((b) => [...b, { reason, pushed, at: total - secondsLeft }]);
    setBreakSeconds(blitz ? 120 : reason === 'think' ? 600 : 300);
    setPushback(false);
    setStage('break');
  }

  function toggleFailTag(tag: string) {
    setFailTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function finishReview() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const microSteps = steps.filter((s) => s.trim());
        const { data: row } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            subject_id: current?.id ?? null,
            session_type: blitz ? 'blitz' : category,
            goal: goal || current?.name || null,
            micro_steps: microSteps.length ? microSteps : null,
            depth_rating: category === 'deep' ? depth : null,
            planned_seconds: total,
            actual_seconds: total - secondsLeft,
            brain_dump: brainDump || null,
            finished_goal: finishedMicro,
            failure_tags: failTags.length ? failTags : [],
            started_at: new Date(Date.now() - (total - secondsLeft) * 1000).toISOString(),
            ended_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (row && breaksTaken.length) {
          await supabase.from('breaks').insert(
            breaksTaken.map((b) => ({
              session_id: row.id,
              reason: b.reason === 'focus' ? 'focus_broke' : b.reason === 'think' ? 'need_to_think' : b.reason === 'water' ? 'water_movement' : 'natural',
              pushed_back: b.pushed,
              taken_at_seconds: b.at,
            })),
          );
        }
      }
    } catch {
      /* demo mode */
    }

    if (current) {
      const updated = schedule.map((i) => (i.id === current.id ? { ...i, done: true } : i));
      setSchedule(updated);
      saveSchedule(updated);
    }

    // reset per-subject ritual inputs
    setFinishedMicro(null);
    setFailTags([]);
    setGoal('');
    setSteps(['', '', '', '']);
    setDepth(0);
    setBrainDump('');
    setLock1(false);
    setLock2(false);
    setRunwaySuccess('');
    setRunwayAction('');

    if (blitz) {
      setBlitz(false);
      setStage('complete');
      return;
    }
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1);
      setStage('categorize');
    } else {
      setStage('complete');
    }
  }

  // timer ring geometry
  const C = 2 * Math.PI * 70;
  const pct = total > 0 ? secondsLeft / total : 1;

  if (stage === 'loading') return null;

  // ================= NON-FLOW SCREENS =================
  if (stage === 'needs-intro') {
    return (
      <div className="screen">
        <div className="content center-col" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="ritual-icon">📘</div>
          <h2 style={{ marginBottom: 8 }}>Watch the intro lesson first</h2>
          <p style={{ marginBottom: 24 }}>Before your first session, watch the short intro on how DeskHabits works.</p>
          <Link href="/course" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Go to Course →</Link>
          <Link href="/home" className="nav-btn" style={{ marginTop: 16, flexDirection: 'row' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  if (stage === 'no-schedule') {
    return (
      <div className="screen">
        <div className="content center-col" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="ritual-icon">🗓️</div>
          <h2 style={{ marginBottom: 8 }}>You haven&apos;t scheduled today yet</h2>
          <p style={{ marginBottom: 24 }}>Block out your work periods to start your first session.</p>
          <Link href="/session/schedule" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Build Your Plan →</Link>
          <Link href="/home" className="nav-btn" style={{ marginTop: 16, flexDirection: 'row' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen fade-in">
      {/* CATEGORIZE */}
      {stage === 'categorize' && current && (
        <div className="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ marginBottom: 8 }}>SUBJECT {index + 1} OF {queue.length}</h3>
          <h1 style={{ marginBottom: 6 }}>{current.name}</h1>
          <p style={{ marginBottom: 30 }}>How are you working on this subject today?</p>
          <div className="card" style={{ width: '100%', cursor: 'pointer', borderColor: 'var(--accent)' }} onClick={() => categorize('deep')}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🧠 Deep Work</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Test prep, projects, essays — work that requires undistracted focus</div>
          </div>
          <div className="card" style={{ width: '100%', cursor: 'pointer' }} onClick={() => categorize('light')}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>📋 Light Work</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Assignments, memorization, notes — routine tasks</div>
          </div>
        </div>
      )}

      {/* RITUAL: ENVIRONMENT LOCK */}
      {stage === 'r-lock' && (
        <>
          <RitualBar step={1} />
          <div className="ritual-center">
            <div className="ritual-icon">🔒</div>
            <div className="ritual-title">Environment Lock</div>
            <div className="ritual-sub">The environment does the willpower work, so you don&apos;t have to.</div>
            <div className={`check-row ${lock1 ? 'done' : ''}`} onClick={() => setLock1(!lock1)} style={{ width: '100%' }}>
              <div className="check" />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Phone in another room or on airplane mode</div>
            </div>
            <div className={`check-row ${lock2 ? 'done' : ''}`} onClick={() => setLock2(!lock2)} style={{ width: '100%' }}>
              <div className="check" />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Distracting browser tabs / extensions blocked</div>
            </div>
            <div className="check-row" style={{ cursor: 'default', width: '100%' }}>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Choose your ambient sound</div>
                <div className="mc-grid">
                  {['Brown Noise', 'Binaural Beats', 'Silence'].map((a) => (
                    <div key={a} className={`tag ${ambient === a ? 'selected' : ''}`} onClick={() => setAmbient(a)}>{a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <button className="btn btn-primary" disabled={!(lock1 && lock2)} onClick={() => setStage('r-clear')}>Continue →</button>
          </div>
        </>
      )}

      {stage === 'r-clear' && (
        <RitualSimple step={2} icon="🧹" title="Clear Your Desk" sub="Only what you need for this session should remain in front of you." btn="Done" onNext={() => setStage('r-water')} />
      )}
      {stage === 'r-water' && (
        <RitualSimple step={3} icon="💧" title="Obtain a Full Glass of Water" sub="Hydration supports sustained cognitive performance." btn="Done" onNext={() => setStage('r-dump')} />
      )}

      {/* BRAIN DUMP */}
      {stage === 'r-dump' && (
        <>
          <RitualBar step={4} />
          <div className="content">
            <div className="ritual-icon" style={{ textAlign: 'center' }}>🗑️</div>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>The Loading Dock</h2>
            <p style={{ textAlign: 'center', marginBottom: 18 }}>Dump everything competing for your attention right now. Once it&apos;s written down, your brain can let it go.</p>
            <textarea rows={6} value={brainDump} onChange={(e) => setBrainDump(e.target.value)} placeholder="e.g. text Mom back, finish laundry, that argument is still bugging me..." />
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button className="btn btn-primary" onClick={afterDump}>Capture &amp; Continue →</button>
          </div>
        </>
      )}

      {/* DEEP: GOAL */}
      {stage === 'r-goal' && (
        <>
          <RitualBar step={5} />
          <div className="content">
            <div className="ritual-icon" style={{ textAlign: 'center' }}>🎯</div>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Define Your Single Target</h2>
            <p style={{ textAlign: 'center', marginBottom: 14 }}>What does &quot;done&quot; look like at the end of this session?</p>
            <textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Finish problems 12-20 in Chapter 4" style={{ marginBottom: 14 }} />
            <h3 style={{ marginBottom: 8 }}>Break it into 3–5 micro-steps</h3>
            {steps.map((s, i) => (
              <input key={i} type="text" value={s} placeholder={`${i + 1}. ${['Re-read worked example', 'Attempt problems 12-15', 'Attempt problems 16-20', 'Check answers, flag mistakes'][i]}`}
                onChange={(e) => setSteps((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))} style={{ marginBottom: 8 }} />
            ))}
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button className="btn btn-primary" disabled={!goal.trim()} onClick={() => setStage('r-depth')}>Continue →</button>
          </div>
        </>
      )}

      {/* DEEP: DEPTH */}
      {stage === 'r-depth' && (
        <>
          <RitualBar step={6} />
          <div className="ritual-center">
            <div className="ritual-icon">⭐</div>
            <div className="ritual-title">Rate the Intellectual Depth</div>
            <div className="ritual-sub">How demanding is this session, 1–10?</div>
            <div className="star-row">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`star ${i < depth ? 'on' : ''}`} onClick={() => setDepth(i + 1)}>★</span>
              ))}
            </div>
            {depth >= 7 && (
              <div style={{ marginTop: 10, padding: 14, background: 'rgba(108,99,255,.12)', border: '1px solid var(--accent)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                This session requires my full capacity.
              </div>
            )}
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <button className="btn btn-primary" disabled={depth === 0} onClick={() => setStage('r-breath')}>Continue →</button>
          </div>
        </>
      )}

      {stage === 'r-breath' && (
        <RitualSimple step={7} icon="🫁" title="5 Slow, Deep Breaths" sub="In for 4... out for 6. Find your stillness before you begin." btn="I'm Ready" onNext={() => setStage('r-incant')} full />
      )}

      {/* INCANTATION */}
      {stage === 'r-incant' && (
        <>
          <div className="ritual-center">
            <div className="ritual-icon">🗣️</div>
            <div className="ritual-title">The Incantation</div>
            <div className="ritual-sub">Read this aloud. Then confirm.</div>
            <div className="pledge-box" style={{ textAlign: 'left' }}>
              &quot;For the next <b>{current ? current.minutes : 50} minutes</b> I will work on <b>{goal || current?.name}</b>, and I will not stop for anything less than a genuine emergency.&quot;
            </div>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <button className="btn btn-primary" onClick={() => setStage('runway')}>I Commit</button>
          </div>
        </>
      )}

      {/* RUNWAY */}
      {stage === 'runway' && (
        <>
          <div className="content">
            <div className="ritual-icon" style={{ textAlign: 'center' }}>🛫</div>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>The Runway</h2>
            <p style={{ textAlign: 'center', marginBottom: 18 }}>Two questions before the clock starts.</p>
            <h3 style={{ marginBottom: 6 }}>What does success look like at the end of this session?</h3>
            <textarea rows={2} value={runwaySuccess} onChange={(e) => setRunwaySuccess(e.target.value)} placeholder="e.g. All 8 problems attempted with work shown" style={{ marginBottom: 16 }} />
            <h3 style={{ marginBottom: 6 }}>What is the FIRST physical action you&apos;ll take?</h3>
            <textarea rows={2} value={runwayAction} onChange={(e) => setRunwayAction(e.target.value)} placeholder="e.g. Open the textbook to page 142 and re-read the worked example" />
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button className="btn btn-primary" disabled={!runwayAction.trim()} onClick={() => beginSession('deep')}>Begin Session →</button>
          </div>
        </>
      )}

      {/* LIGHT START */}
      {stage === 'l-start' && (
        <RitualSimple icon="📵" title="Put Your Phone Aside and Begin" sub="Light work session — assignments, memorization, notes." btn="Begin Session →" onNext={() => beginSession('light')} full />
      )}

      {/* BLITZ CONFIRM */}
      {stage === 'blitzconfirm' && (
        <div className="content center-col" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ color: 'var(--red)', marginBottom: 10 }}>Enter Blitz Mode?</h1>
          <p style={{ marginBottom: 20 }}>Blitz mode shortens breaks, increases session intensity, and turns the whole app red. You&apos;ll be watched. There is no soft opt-out.</p>
          <button className="btn btn-blitz" onClick={enterBlitz}>⚡ Activate Blitz Mode</button>
          <div style={{ height: 10 }} />
          <button className="btn btn-ghost" onClick={() => router.push('/home')}>Never mind</button>
        </div>
      )}

      {/* SESSION */}
      {stage === 'session' && (
        <>
          {blitz && <div className="blitz-banner">⚡ BLITZ MODE — FATA IS WATCHING</div>}
          {blitz && <div className="eyes-row"><div className="eye" /><div className="eye" /></div>}
          <div className="session-header">
            <div className="subject">{(current?.name ?? 'Session').toUpperCase()} · {blitz ? 'BLITZ MODE' : category === 'deep' ? 'DEEP WORK' : 'LIGHT WORK'}</div>
            <div className="task-title">{goal || current?.name || 'Focus'}</div>
          </div>
          <div className="timer-ring-wrap">
            <div className="timer-ring">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#2e2e40" strokeWidth="9" />
                <circle cx="80" cy="80" r="70" fill="none" stroke={blitz ? '#f87171' : '#6c63ff'} strokeWidth="9" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round" />
              </svg>
              <div className="timer-label">
                <div className="timer-digits">{fmt(secondsLeft)}</div>
                <div className="timer-sub">REMAINING</div>
              </div>
            </div>
          </div>
          <div className="content" style={{ paddingTop: 0 }}>
            {showPulse && (
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>Mid-Session Pulse</h3>
                <p style={{ marginBottom: 8 }}>Are you on the micro-plan? Which step are you on?</p>
                <div className="mc-grid">
                  {['Step 1', 'Step 2', 'Step 3', 'Off-plan'].map((p) => (
                    <div key={p} className={`tag ${pulseStep === p ? 'selected' : ''}`} onClick={() => setPulseStep(p)}>{p}</div>
                  ))}
                </div>
              </div>
            )}
            {showDial && (
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>Quick Depth Check</h3>
                <p style={{ marginBottom: 8 }}>Rate your depth right now, 1–5</p>
                <div className="star-row" style={{ fontSize: 24 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`star ${i < dialRating ? 'on' : ''}`} onClick={() => setDialRating(i + 1)}>★</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>DISTRACTION LOG ({distractions.length})</div>
            <div style={{ minHeight: 24, marginBottom: 12 }}>
              {distractions.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--border)' }}>None yet</div>
              ) : (
                distractions.map((d, i) => (
                  <span key={i} className="tag" style={{ marginRight: 4, marginBottom: 4, display: 'inline-block' }}>⚠ {d}</span>
                ))
              )}
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={logDistraction} style={{ flex: 1 }}>⚠ Log Distraction</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPushback(false); setStage('breakreason'); }} style={{ flex: 1 }}>Take a Break</button>
            </div>
            <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => setStage('review')}>End Session</button>
          </div>
        </>
      )}

      {/* STRUGGLE */}
      {stage === 'struggle' && (
        <>
          <div className="ritual-center">
            <div className="ritual-icon">🤔</div>
            <div className="ritual-title">Let&apos;s name it.</div>
            <div className="ritual-sub">You&apos;ve flagged 3 distractions in a row. What specifically is hard about this right now?</div>
            <textarea rows={3} placeholder="e.g. I don't know how to start this argument..." style={{ textAlign: 'left' }} />
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <button className="btn btn-primary" onClick={closeStruggle}>Back to Work</button>
          </div>
        </>
      )}

      {/* BREAK REASON */}
      {stage === 'breakreason' && (
        <div className="content center-col">
          <h2 style={{ marginBottom: 4 }}>Why are you taking a break?</h2>
          <p style={{ marginBottom: 18 }}>Be honest — this trains your future sessions.</p>
          {[
            { id: 'natural', label: '✅ I hit a natural stopping point' },
            { id: 'focus', label: '😵 My focus broke' },
            { id: 'think', label: '🚶 I need to think away from the screen' },
            { id: 'water', label: '💧 I need water or movement' },
          ].map((r) => (
            <div key={r.id} className="card" style={{ cursor: 'pointer' }} onClick={() => chooseBreakReason(r.id)}>
              <div style={{ fontWeight: 700 }}>{r.label}</div>
            </div>
          ))}
          {pushback && (
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 700, marginBottom: 10 }}>The discomfort is the deep work. Try 5 more minutes before stopping?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { setPushback(false); setStage('session'); }}>5 More Minutes</button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => startBreak('focus', true)}>Take Break Anyway</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BREAK */}
      {stage === 'break' && (
        <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3>PRODUCTIVE BREAK</h3>
          <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: '-3px', color: 'var(--green)', margin: '16px 0' }}>{fmt(breakSeconds)}</div>
          <p style={{ marginBottom: 16 }}>Get a snack, stretch, or step outside. Session resumes automatically.</p>
          <div className="mc-grid" style={{ width: '100%' }}>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26 }}>🍎</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Snack</div></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26 }}>🚶</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Walk</div></div>
            <div className="card" style={{ textAlign: 'center', opacity: 0.35 }}><div style={{ fontSize: 26 }}>📱</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Phone (locked)</div></div>
            <div className="card" style={{ textAlign: 'center', opacity: 0.35 }}><div style={{ fontSize: 26 }}>📺</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Video (locked)</div></div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => setBreakSeconds(0)}>End break early →</button>
        </div>
      )}

      {/* REVIEW */}
      {stage === 'review' && (
        <div className="content">
          <h3 style={{ marginBottom: 8 }}>Session Complete</h3>
          <h2 style={{ marginBottom: 18 }}>{current?.name ?? 'Session'} — {blitz ? 'Blitz' : category === 'deep' ? 'Deep Work' : 'Light Work'}</h2>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Did you finish your work?</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, ...(finishedMicro === true ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}) }} onClick={() => setFinishedMicro(true)}>Yes ✓</button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, ...(finishedMicro === false ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}) }} onClick={() => setFinishedMicro(false)}>No</button>
            </div>
            {finishedMicro === false && (
              <div style={{ marginTop: 10 }}>
                <p style={{ marginBottom: 8 }}>What got in the way?</p>
                <div className="tag-row">
                  {FAIL_TAGS.map((tag) => (
                    <div key={tag} className={`tag warn ${failTags.includes(tag) ? 'selected' : ''}`} onClick={() => toggleFailTag(tag)}>{tag}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Session Stats</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>Distractions logged</span><b>{distractions.length}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>Breaks taken</span><b>{breaksTaken.length}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>A stone has been added 🪨</span><b style={{ color: 'var(--accent)' }}>+1</b></div>
          </div>
          <button className="btn btn-primary" disabled={finishedMicro === null} onClick={finishReview}>
            {index + 1 < queue.length && !blitz ? 'Next Subject →' : 'Done → Back to Plan'}
          </button>
          <div style={{ height: 16 }} />
        </div>
      )}

      {/* COMPLETE */}
      {stage === 'complete' && (
        <div className="content center-col" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="ritual-icon">🪨</div>
          <h1 style={{ marginBottom: 8 }}>That&apos;s a wrap.</h1>
          <p style={{ marginBottom: 24 }}>Every session you complete lays another stone. Your analytics have been updated.</p>
          <Link href="/home" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Back to Plan</Link>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}

// ---------- ritual helpers ----------
function RitualBar({ step }: { step: number }) {
  return (
    <div className="ritual-progress">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`seg ${i < step ? 'done' : ''}`} />
      ))}
    </div>
  );
}

function RitualSimple({
  step,
  icon,
  title,
  sub,
  btn,
  onNext,
  full,
}: {
  step?: number;
  icon: string;
  title: string;
  sub: string;
  btn: string;
  onNext: () => void;
  full?: boolean;
}) {
  return (
    <>
      {!full && step != null && <RitualBar step={step} />}
      <div className="ritual-center">
        <div className="ritual-icon">{icon}</div>
        <div className="ritual-title">{title}</div>
        <div className="ritual-sub">{sub}</div>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <button className="btn btn-primary" onClick={onNext}>{btn}</button>
      </div>
    </>
  );
}
