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
