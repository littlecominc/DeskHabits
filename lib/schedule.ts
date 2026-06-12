// Today's work schedule is built interactively each time the user starts a
// session, then cached in localStorage for the rest of the day.

export type ScheduleItem = {
  id: string;
  name: string;
  category: 'deep' | 'light';
  minutes: number;
  done: boolean;
};

export type TodaySchedule = {
  date: string; // yyyy-mm-dd
  items: ScheduleItem[];
};

const KEY = 'deskhabits_schedule';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function loadSchedule(): TodaySchedule | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: TodaySchedule = JSON.parse(raw);
    if (parsed.date !== todayStr()) return null; // resets every day
    return parsed;
  } catch {
    return null;
  }
}

export function saveSchedule(items: ScheduleItem[]) {
  if (typeof window === 'undefined') return;
  const data: TodaySchedule = { date: todayStr(), items };
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function markItemDone(id: string) {
  const schedule = loadSchedule();
  if (!schedule) return;
  schedule.items = schedule.items.map((i) => (i.id === id ? { ...i, done: true } : i));
  saveSchedule(schedule.items);
}
