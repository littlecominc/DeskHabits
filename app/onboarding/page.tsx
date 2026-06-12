'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type ChoiceState = number | string | null;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);

  // Step 0 — classes
  const [classes, setClasses] = useState(['', '', '']);
  const classExamples = ['Spanish', 'Math Integrated 2', 'AP Biology'];

  // Step 1 — time per day
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [touchedDaily, setTouchedDaily] = useState(false);

  // Step 2 — focus span
  const [focusMinutes, setFocusMinutes] = useState(20);
  const [touchedFocus, setTouchedFocus] = useState(false);

  // Step 3 — positive: follow-through
  const [followThrough, setFollowThrough] = useState<ChoiceState>(null);

  // Step 4 — positive: consistent study space
  const [hasStudySpace, setHasStudySpace] = useState<ChoiceState>(null);

  // Step 5 — negative: procrastination
  const [procrastination, setProcrastination] = useState(50);
  const [touchedProcrastination, setTouchedProcrastination] = useState(false);

  // Step 6 — negative: best friend calls
  const [friendCall, setFriendCall] = useState<ChoiceState>(null);

  // Step 7 — negative: true/false claim, no answer revealed
  const [rereadTrueFalse, setRereadTrueFalse] = useState<ChoiceState>(null);

  // Step 8 — negative: lied to parent/mentor
  const [liedAboutProgress, setLiedAboutProgress] = useState<ChoiceState>(null);

  // Pledge signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Account creation
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---- dynamic score ----
  // Each answer contributes 0-10 toward a "habits score". Higher = healthier habits.
  function calcScore() {
    const points: number[] = [];
    if (followThrough !== null) points.push(Number(followThrough) * 2); // 1-5 -> 2-10
    if (hasStudySpace !== null) points.push(hasStudySpace === 'yes' ? 10 : 2);
    points.push(Math.round((100 - procrastination) / 10)); // less procrastination = more points
    if (friendCall !== null) {
      points.push(friendCall === 'ignore' ? 10 : friendCall === 'text_later' ? 6 : 1);
    }
    if (rereadTrueFalse !== null) {
      // Re-reading notes is actually a low-effectiveness study method — "False" is the better answer.
      points.push(rereadTrueFalse === 'false' ? 10 : 2);
    }
    if (liedAboutProgress !== null) points.push(liedAboutProgress === 'no' ? 10 : 1);
    // Focus span: longer sustained focus = more points, capped at 60 min.
    points.push(Math.min(10, Math.round((focusMinutes / 60) * 10)));

    if (!points.length) return 0;
    const avg = points.reduce((a, b) => a + b, 0) / points.length;
    return Math.round(avg * 10);
  }
  const score = calcScore();

  const canContinue: Record<number, boolean> = {
    0: classes.some((c) => c.trim()),
    1: touchedDaily,
    2: touchedFocus,
    3: followThrough !== null,
    4: hasStudySpace !== null,
    5: touchedProcrastination,
    6: friendCall !== null,
    7: rereadTrueFalse !== null,
    8: liedAboutProgress !== null,
    9: true,
    10: hasSignature,
  };

  // ---- signature pad ----
  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#eef1fb';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }
  function endDraw() {
    drawing.current = false;
  }
  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account');
      setLoading(false);
      return;
    }

    const userId = data.user.id;
    const signatureDataUrl = canvasRef.current?.toDataURL('image/png') ?? null;

    await supabase.from('profiles').upsert({
      id: userId,
      full_name: name,
      email,
      desk_habits_score: score,
      daily_minutes: dailyMinutes,
      baseline_focus_minutes: focusMinutes,
      pledge_signed_at: new Date().toISOString(),
      pledge_signature: signatureDataUrl,
    });

    const subjectRows = classes.filter((c) => c.trim()).map((c) => ({ user_id: userId, name: c.trim() }));
    if (subjectRows.length) {
      await supabase.from('subjects').insert(subjectRows);
    }

    await supabase.from('progress').upsert({ user_id: userId });

    setLoading(false);
    router.push('/home');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-10">
      {/* Step 0: classes */}
      {step === 0 && (
        <Step title="What classes are you taking?" canContinue={canContinue[0]} onNext={() => setStep(1)}>
          {classes.map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={(e) => {
                const next = [...classes];
                next[i] = e.target.value;
                setClasses(next);
              }}
              placeholder={classExamples[i] ?? `Class ${i + 1}`}
              className="mb-2 w-full rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none placeholder:text-muted/50 focus:border-accent"
            />
          ))}
          <button
            type="button"
            onClick={() => setClasses([...classes, ''])}
            className="mb-4 rounded-lg border border-border px-4 py-2 text-sm text-muted"
          >
            + Add Class
          </button>
        </Step>
      )}

      {/* Step 1: time per day */}
      {step === 1 && (
        <Step title="How much time can you dedicate to your goals each day?" canContinue={canContinue[1]} onNext={() => setStep(2)}>
          <div className="mb-2 text-center text-3xl font-semibold text-accent">{(dailyMinutes / 60).toFixed(1)} hrs</div>
          <input
            type="range"
            min={15}
            max={360}
            step={15}
            value={dailyMinutes}
            onChange={(e) => {
              setDailyMinutes(Number(e.target.value));
              setTouchedDaily(true);
            }}
            className="w-full accent-[#e8d9b5]"
          />
        </Step>
      )}

      {/* Step 2: focus span */}
      {step === 2 && (
        <Step title="How long can you focus before getting distracted?" canContinue={canContinue[2]} onNext={() => setStep(3)}>
          <div className="mb-2 text-center text-3xl font-semibold text-accent">{focusMinutes} min</div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={focusMinutes}
            onChange={(e) => {
              setFocusMinutes(Number(e.target.value));
              setTouchedFocus(true);
            }}
            className="w-full accent-[#e8d9b5]"
          />
        </Step>
      )}

      {/* Step 3: positive — follow-through */}
      {step === 3 && (
        <Step title="If you committed to a study plan, how likely are you to follow through?" canContinue={canContinue[3]} onNext={() => setStep(4)}>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setFollowThrough(n)}
                className={`rounded-lg border py-4 text-lg font-semibold ${followThrough === n ? 'border-accent bg-panel2 text-accent' : 'border-border bg-panel text-muted'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </Step>
      )}

      {/* Step 4: positive — consistent study space */}
      {step === 4 && (
        <Step title="Do you have a consistent place where you study?" canContinue={canContinue[4]} onNext={() => setStep(5)}>
          <ChoiceRow value={hasStudySpace} onChange={setHasStudySpace} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        </Step>
      )}

      {/* Step 5: negative — procrastination */}
      {step === 5 && (
        <Step title="How often do you put off studying until the last minute?" canContinue={canContinue[5]} onNext={() => setStep(6)}>
          <div className="mb-2 text-center text-3xl font-semibold text-accent">{procrastination}%</div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={procrastination}
            onChange={(e) => {
              setProcrastination(Number(e.target.value));
              setTouchedProcrastination(true);
            }}
            className="w-full accent-[#e8d9b5]"
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>Never</span>
            <span>Always</span>
          </div>
        </Step>
      )}

      {/* Step 6: negative — best friend calls */}
      {step === 6 && (
        <Step title="If your best friend calls you while you're studying, what would happen?" canContinue={canContinue[6]} onNext={() => setStep(7)}>
          <ChoiceRow
            value={friendCall}
            onChange={setFriendCall}
            vertical
            options={[
              { value: 'answer', label: "I'd answer right away" },
              { value: 'text_later', label: "I'd silence it and text back later" },
              { value: 'ignore', label: "I'd ignore it completely until I'm done" },
            ]}
          />
        </Step>
      )}

      {/* Step 7: negative — true/false, no answer shown */}
      {step === 7 && (
        <Step title="True or False: Re-reading your notes is one of the most effective ways to study." canContinue={canContinue[7]} onNext={() => setStep(8)}>
          <ChoiceRow value={rereadTrueFalse} onChange={setRereadTrueFalse} options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]} />
        </Step>
      )}

      {/* Step 8: negative — lied to parent/mentor */}
      {step === 8 && (
        <Step title="Have you ever lied to a parent or mentor about your academic progress?" canContinue={canContinue[8]} onNext={() => setStep(9)}>
          <ChoiceRow value={liedAboutProgress} onChange={setLiedAboutProgress} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        </Step>
      )}

      {/* Step 9: score reveal */}
      {step === 9 && (
        <Step title="Your Desk Habits Score" canContinue={canContinue[9]} onNext={() => setStep(10)} nextLabel="Take the pledge →">
          <div className="py-6 text-center">
            <div className="text-5xl font-bold text-accent">{score}<span className="text-2xl text-muted">/100</span></div>
          </div>
        </Step>
      )}

      {/* Step 10: pledge + signature */}
      {step === 10 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-5 font-serif text-xl font-semibold leading-snug">The Pledge</h2>
          <p className="mb-4 text-sm text-muted">
            I will go as long as I can without taking breaks and getting distracted. I am committing to building
            real focus, one session at a time.
          </p>
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Sign with your finger</div>
          <canvas
            ref={canvasRef}
            width={320}
            height={140}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="mb-2 w-full touch-none rounded-xl2 border border-border bg-panel"
          />
          <button type="button" onClick={clearSignature} className="mb-6 self-start text-xs text-muted underline">
            Clear
          </button>

          <div className="flex-1" />
          <button
            disabled={!canContinue[10]}
            onClick={() => setStep(11)}
            className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
          >
            Sign &amp; Continue →
          </button>
        </div>
      )}

      {/* Step 11: account creation */}
      {step === 11 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 font-serif text-xl font-semibold">Save your plan</h2>
          <p className="mb-6 text-sm text-muted">Create your account to lock in your schedule.</p>
          <form onSubmit={handleSignUp} className="flex flex-1 flex-col gap-3">
            <input
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-red">{error}</p>}
            <div className="flex-1" />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-50"
            >
              {loading ? 'Building your plan…' : 'Build My Plan →'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function Step({
  title,
  children,
  onNext,
  canContinue,
  nextLabel = 'Continue →',
}: {
  title: string;
  children: React.ReactNode;
  onNext: () => void;
  canContinue: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="mb-5 font-serif text-xl font-semibold leading-snug">{title}</h2>
      <div className="mb-6">{children}</div>
      <div className="flex-1" />
      <button
        onClick={onNext}
        disabled={!canContinue}
        className="rounded-xl2 bg-accent py-4 font-serif text-lg font-semibold text-ink disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function ChoiceRow({
  value,
  onChange,
  options,
  vertical = false,
}: {
  value: ChoiceState;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  vertical?: boolean;
}) {
  return (
    <div className={vertical ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg border px-4 py-3 text-left text-sm ${
            value === opt.value ? 'border-accent bg-panel2 text-text' : 'border-border bg-panel text-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
