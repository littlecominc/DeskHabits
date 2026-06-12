// Fallback content shown when Supabase isn't configured yet or the user
// has no data — keeps every screen renderable during early development.

export const demoProfile = {
  full_name: 'Alex',
  daily_minutes: 150,
};

// Raw aggregates — every score on Home/Analytics is computed from these,
// never stored as an opaque "score".
export const demoStats = {
  totalFocusMinutes: 540, // sum of all completed work-session minutes (last 7 days)
  totalBreaks: 9,
  deepWorkSessions: 11,
  deepWorkBreaks: 3, // breaks taken specifically during deep work
  totalDistractionFreeMinutesBeforeFirstBreak: [42, 18, 35, 50, 12, 28, 60, 22, 31, 45, 19], // per deep-work session
  phonePickupsDuringSessions: 23,
  totalSessionMinutesTracked: 540,
};

export const demoSchedule = [
  { id: '1', start_time: '9:00 AM', label: 'AP Calculus', duration_minutes: 60, block_type: 'deep' as const, status: 'pending' as const },
  { id: '2', start_time: '10:10 AM', label: 'AP US History', duration_minutes: 50, block_type: 'deep' as const, status: 'pending' as const },
  { id: '3', start_time: '11:15 AM', label: 'Spanish Vocab', duration_minutes: 25, block_type: 'light' as const, status: 'pending' as const },
];

// Timeline entries for "today's" focus timeline — alternating work/break segments.
export const demoTimeline = [
  { type: 'deep' as const, label: 'AP Calculus', start: '9:00 AM', end: '10:00 AM', minutes: 60 },
  { type: 'break' as const, label: 'Break', start: '10:00 AM', end: '10:08 AM', minutes: 8 },
  { type: 'deep' as const, label: 'AP US History', start: '10:08 AM', end: '10:58 AM', minutes: 50 },
];

export const demoCourse = {
  title: 'Learn how to work Deeper',
  subtitle: 'Building habits for deep focus in a distracted world.',
  lesson_title: 'Why your attention matters more than you think',
  lesson_minutes: 3,
  completed: 2,
  total: 8,
};

export const demoLessons = [
  { id: 0, title: 'Welcome: how DeskHabits works', minutes: 4, done: true, intro: true },
  { id: 1, title: 'Why your attention matters more than you think', minutes: 3, done: true },
  { id: 2, title: 'The myth of multitasking', minutes: 4, done: false },
  { id: 3, title: 'Designing your environment for focus', minutes: 5, done: false },
  { id: 4, title: 'What deep work actually feels like', minutes: 6, done: false },
  { id: 5, title: 'Breaking the phone-checking habit', minutes: 4, done: false },
  { id: 6, title: 'Recovering from a broken session', minutes: 3, done: false },
  { id: 7, title: 'Building a pre-session ritual', minutes: 5, done: false },
  { id: 8, title: 'Studying for high-stakes exams', minutes: 7, done: false },
];

export const demoInsights = {
  weeklyFocusMinutes: [90, 120, 60, 150, 100, 40, 130],
  weeklyLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  sessionsCompleted: 23,
  sessionsFailed: 4,
  breaksLogged: 9,
};

export const demoSubjects = [
  { id: '1', name: 'AP Calculus', next_test_date: '2026-06-19' },
  { id: '2', name: 'AP US History', next_test_date: null },
  { id: '3', name: 'Chemistry', next_test_date: null },
];
