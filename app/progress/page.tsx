import BottomNav from '@/components/BottomNav';
import { demoStats } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const s = demoStats;

  const attentionRatio = (s.totalFocusMinutes - s.deepWorkBreaks * 10) / s.totalFocusMinutes;
  const breaksPerDeepSession = s.deepWorkBreaks / s.deepWorkSessions;

  const delayedGratList = s.totalDistractionFreeMinutesBeforeFirstBreak;
  const delayedGratAvg = delayedGratList.reduce((a, b) => a + b, 0) / delayedGratList.length;

  const phonePickupRatio = s.phonePickupsDuringSessions / (s.totalSessionMinutesTracked / 60);

  return (
    <main className="px-5 pb-28 pt-8">
      <h1 className="mb-1 font-serif text-2xl">Analytics</h1>
      <p className="mb-6 text-xs uppercase tracking-widest text-muted">The math behind your focus.</p>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-1 font-serif text-lg">Delayed Gratification Score</div>
        <div className="mb-2 text-3xl font-bold text-accent">{delayedGratAvg.toFixed(1)} <span className="text-sm text-muted">min</span></div>
        <p className="text-xs text-muted">
          Average uninterrupted focus time before your first break or distraction, across your last{' '}
          {delayedGratList.length} deep work sessions.
        </p>
        <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
          ({delayedGratList.join(' + ')}) ÷ {delayedGratList.length} = {delayedGratAvg.toFixed(1)} min
        </div>
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-1 font-serif text-lg">Attention Ratio</div>
        <div className="mb-2 text-3xl font-bold text-accent">{Math.round(attentionRatio * 100)}%</div>
        <p className="text-xs text-muted">Share of your total focus time that wasn't lost to breaks during deep work.</p>
        <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
          ({s.totalFocusMinutes} − {s.deepWorkBreaks} × 10) ÷ {s.totalFocusMinutes} = {Math.round(attentionRatio * 100)}%
        </div>
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-1 font-serif text-lg">Breaks per Deep Work Session</div>
        <div className="mb-2 text-3xl font-bold text-accent">{breaksPerDeepSession.toFixed(2)}</div>
        <p className="text-xs text-muted">
          Breaks during deep work hurt your progress most. Light work tolerates more.
        </p>
        <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
          {s.deepWorkBreaks} breaks ÷ {s.deepWorkSessions} sessions = {breaksPerDeepSession.toFixed(2)}
        </div>
      </section>

      <section className="mb-5 rounded-xl2 border border-border bg-panel p-5">
        <div className="mb-1 font-serif text-lg">Phone Pickups per Hour of Work</div>
        <div className="mb-2 text-3xl font-bold text-accent">{phonePickupRatio.toFixed(1)}</div>
        <p className="text-xs text-muted">
          Once connected to your phone's screen time, this tracks how often you unlock or switch apps mid-session.
        </p>
        <div className="mt-3 rounded-lg bg-panel2 p-3 font-mono text-[11px] text-muted">
          {s.phonePickupsDuringSessions} pickups ÷ {(s.totalSessionMinutesTracked / 60).toFixed(1)} hrs = {phonePickupRatio.toFixed(1)}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
