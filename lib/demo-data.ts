// Fallback content shown when Supabase isn't configured yet or the user
// isn't signed in — keeps every screen renderable during early development.

export const demoProfile = {
  full_name: 'there',
  daily_minutes: 150,
};

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
