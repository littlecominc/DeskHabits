// Fallback content shown when Supabase isn't configured yet or the user
// has no data — keeps every screen renderable during early development.

export const demoProfile = {
  full_name: 'Alex',
  daily_minutes: 150,
};

export const demoProgress = {
  stones: 4,
  current_streak: 18,
  longest_streak: 21,
  avg_break_minutes: 47,
  phone_pickups_today: 23,
  discipline_score: 68,
  attention_score: 74,
  resilience_score: 61,
};

export const demoSchedule = [
  { id: '1', start_time: '9:00 AM', label: 'Focus Session 1', duration_minutes: 50, block_type: 'deep' as const, status: 'pending' as const },
  { id: '2', start_time: '10:00 AM', label: 'Break', duration_minutes: 10, block_type: 'break' as const, status: 'pending' as const },
  { id: '3', start_time: '10:10 AM', label: 'Lesson: Stay Present', duration_minutes: 5, block_type: 'lesson' as const, status: 'active' as const },
  { id: '4', start_time: '11:00 AM', label: 'Focus Session 2', duration_minutes: 50, block_type: 'deep' as const, status: 'pending' as const },
  { id: '5', start_time: '12:00 PM', label: 'Break', duration_minutes: 10, block_type: 'break' as const, status: 'pending' as const },
  { id: '6', start_time: '12:10 PM', label: 'Reflect & Log', duration_minutes: 5, block_type: 'reflect' as const, status: 'pending' as const },
];

export const demoCourse = {
  title: 'Focus Foundations',
  subtitle: 'Building habits for deep focus in a distracted world.',
  lesson_title: 'Why your attention matters more than you think',
  lesson_minutes: 3,
  completed: 2,
  total: 8,
};

export const demoLessons = [
  { id: 1, title: 'Why your attention matters more than you think', minutes: 3, done: true },
  { id: 2, title: 'The myth of multitasking', minutes: 4, done: true },
  { id: 3, title: 'Designing your environment for focus', minutes: 5, done: false },
  { id: 4, title: 'What deep work actually feels like', minutes: 6, done: false },
  { id: 5, title: 'Breaking the phone-checking habit', minutes: 4, done: false },
  { id: 6, title: 'Recovering from a broken streak', minutes: 3, done: false },
  { id: 7, title: 'Building a pre-session ritual', minutes: 5, done: false },
  { id: 8, title: 'Studying for high-stakes exams', minutes: 7, done: false },
];

export const demoInsights = {
  weeklyFocusMinutes: [90, 120, 60, 150, 100, 40, 130],
  weeklyLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  hardWorkRatio: 0.62,
  delayedGratificationScore: 71,
  totalDistractions: 14,
  sessionsCompleted: 23,
  sessionsFailed: 4,
};

export const demoSubjects = [
  { id: '1', name: 'AP Calculus', next_test_date: '2026-06-19' },
  { id: '2', name: 'AP US History', next_test_date: null },
  { id: '3', name: 'Chemistry', next_test_date: null },
];
