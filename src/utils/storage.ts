import { Goal, Task, Cycle, SupplementRecord, FreeMemo } from '../types';

const STORAGE_KEYS = {
  GOALS: 'gowith_goals',
  TASKS: 'gowith_tasks',
  CYCLES: 'gowith_cycles',
  SUPPLEMENTS: 'gowith_supplements',
  MEMOS: 'gowith_memos',
};

// Goals Storage
export function getGoals(): Goal[] {
  const data = localStorage.getItem(STORAGE_KEYS.GOALS);
  return data ? JSON.parse(data) : [];
}

export function saveGoals(goals: Goal[]): void {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
}

export function getGoal(id: string): Goal | undefined {
  return getGoals().find(g => g.id === id);
}

export function addGoal(goal: Goal): void {
  const goals = getGoals();
  goals.push(goal);
  saveGoals(goals);
}

export function updateGoal(updated: Goal): void {
  const goals = getGoals();
  const index = goals.findIndex(g => g.id === updated.id);
  if (index !== -1) {
    goals[index] = updated;
    saveGoals(goals);
  }
}

// Tasks Storage
export function getAllTasks(): Task[] {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

export function getTasks(goalId: string): Task[] {
  return getAllTasks().filter(t => t.goal_id === goalId);
}

export function getTasksForCycle(goalId: string, cycleNumber: number): Task[] {
  return getTasks(goalId).filter(t => t.cycle_number === cycleNumber);
}

export function addTask(task: Task): void {
  const tasks = getAllTasks();
  tasks.push(task);
  saveTasks(tasks);
}

export function updateTask(updated: Task): void {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === updated.id);
  if (index !== -1) {
    tasks[index] = updated;
    saveTasks(tasks);
  }
}

export function deleteTask(id: string): void {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== id);
  saveTasks(filtered);
}

// Cycles Storage
export function getAllCycles(): Cycle[] {
  const data = localStorage.getItem(STORAGE_KEYS.CYCLES);
  return data ? JSON.parse(data) : [];
}

export function saveCycles(cycles: Cycle[]): void {
  localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(cycles));
}

export function getCycles(goalId: string): Cycle[] {
  return getAllCycles().filter(c => c.goal_id === goalId);
}

export function addCycle(cycle: Cycle): void {
  const cycles = getAllCycles();
  cycles.push(cycle);
  saveCycles(cycles);
}

export function updateCycle(updated: Cycle): void {
  const cycles = getAllCycles();
  const index = cycles.findIndex(c => c.id === updated.id);
  if (index !== -1) {
    cycles[index] = updated;
    saveCycles(cycles);
  }
}

// Supplements Storage
export function getSupplementRecords(): SupplementRecord[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTS);
  return data ? JSON.parse(data) : [];
}

export function saveSupplementRecords(records: SupplementRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(records));
}

export function addSupplementRecord(record: SupplementRecord): void {
  const records = getSupplementRecords();
  records.push(record);
  saveSupplementRecords(records);
}

export function updateSupplementRecord(updated: SupplementRecord): void {
  const records = getSupplementRecords();
  const index = records.findIndex(r => r.id === updated.id);
  if (index !== -1) {
    records[index] = updated;
    saveSupplementRecords(records);
  }
}

// Free Memos Storage
export function getFreeMemos(goalId: string): FreeMemo[] {
  const data = localStorage.getItem(STORAGE_KEYS.MEMOS);
  const all: FreeMemo[] = data ? JSON.parse(data) : [];
  return all.filter(m => m.goal_id === goalId);
}

export function addFreeMemo(memo: FreeMemo): void {
  const data = localStorage.getItem(STORAGE_KEYS.MEMOS);
  const all: FreeMemo[] = data ? JSON.parse(data) : [];
  all.push(memo);
  localStorage.setItem(STORAGE_KEYS.MEMOS, JSON.stringify(all));
}

// Helper: Calculate Date difference in days
export function getDaysDifference(d1: string, d2: string): number {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Get day of week string from date (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
export function getDayOfWeekString(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

// Helper: Format date to YYYY-MM-DD local time
export function formatDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset*60*1000));
  return localDate.toISOString().split('T')[0];
}

// Helper: Add days to date
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
