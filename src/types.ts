export type ViewState = 
  | 'goal-list'
  | 'setup' 
  | 'dashboard-performance' 
  | 'dashboard-supplement' 
  | 'dashboard-rest' 
  | 'plan' 
  | 'result';

export interface ViewProps {
  onNavigate?: (view: ViewState) => void;
  currentGoalId?: string | null;
  setCurrentGoalId?: (id: string | null) => void;
  simulatedDayIndex?: number;
  setSimulatedDayIndex?: (idx: number) => void;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  goal_reason: string;
  success_condition: string;
  start_date: string;
  end_date: string;
  current_level: string;
  weekly_hours: number;
  difficulty: number;
  success_threshold: number;
  performance_days: string[];
  supplement_day: string;
  rest_day: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  goal_id: string;
  cycle_number: number;
  scheduled_date: string; // YYYY-MM-DD
  title: string;
  difficulty: number; // 1-5
  estimated_minutes: number;
  completion_condition: string;
  status: 'todo' | 'in_progress' | 'completed' | 'incomplete';
  memo: string;
  actual_minutes: number;
  result_link: string;
  carryover_count: number;
  completed_at: string;
}

export interface Cycle {
  id: string;
  goal_id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  performance_rate: number;
  final_rate: number;
  success_status: 'success' | 'fail' | 'pending';
  created_at: string;
}

export interface SupplementRecord {
  id: string;
  task_id: string;
  unfinished_reason: string;
  supplement_status: 'none' | 'supplemented' | 'carryover' | 'reduced' | 'deleted' | 'changed';
  carryover_selected: boolean;
  created_at: string;
}

export interface FreeMemo {
  id: string;
  goal_id: string;
  memo_date: string; // YYYY-MM-DD
  content: string;
  created_at: string;
}

