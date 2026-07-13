import React, { useState, useEffect } from 'react';
import { Flame, FolderOpen, CheckCircle2, Plus, AlertCircle, Clock, Link2, X, ClipboardSignature } from 'lucide-react';
import { ViewProps, Goal, Task } from '../../types';
import { getGoal, getTasksForCycle, updateTask, saveTasks, formatDate, addDays, getDayOfWeekString, getDaysDifference, getAllTasks } from '../../utils/storage';
import { CycleNavBar } from '../../components/CycleNavBar';
import { ComingSoonButton } from '../../components/ComingSoonModal';

export function PerformanceView({ onNavigate, currentGoalId, simulatedDayIndex = 1, setSimulatedDayIndex }: ViewProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [cycleTasks, setCycleTasks] = useState<Task[]>([]);
  const [activeDate, setActiveDate] = useState<{ date: string; dayName: string } | null>(null);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);

  // Task Completion Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [completionMemo, setCompletionMemo] = useState('');
  const [actualMinutes, setActualMinutes] = useState(60);
  const [resultLink, setResultLink] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick Task Add State (FAB)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState(3);
  const [newTaskMinutes, setNewTaskMinutes] = useState(60);
  const [newTaskCondition, setNewTaskCondition] = useState('');

  useEffect(() => {
    loadGoalAndTasks();
  }, [currentGoalId, simulatedDayIndex]);

  const loadGoalAndTasks = () => {
    if (currentGoalId) {
      const g = getGoal(currentGoalId);
      if (g) {
        setGoal(g);
        
        // Find performance dates
        const pDates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const dStr = addDays(g.start_date, i);
          const dayOfWeek = getDayOfWeekString(dStr);
          if (g.performance_days.includes(dayOfWeek)) {
            pDates.push(dStr);
          }
        }
        
        const targetDateStr = pDates[simulatedDayIndex - 1] || pDates[0];
        if (targetDateStr) {
          setActiveDate({
            date: targetDateStr,
            dayName: getDayOfWeekString(targetDateStr)
          });
        }

        const tasks = getTasksForCycle(g.id, 1);
        setCycleTasks(tasks);
      }

      // Load completed goals for the section
      const all = localStorage.getItem('gowith_goals');
      if (all) {
        const parsed: Goal[] = JSON.parse(all);
        setCompletedGoals(parsed.filter(g => g.status === 'completed' || g.status === 'failed'));
      }
    }
  };

  if (!goal || !activeDate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-error mb-4" />
        <h2 className="text-title-md font-bold text-on-surface mb-2">활성화된 목표가 없습니다</h2>
        <button 
          onClick={() => onNavigate?.('goal-list')}
          className="px-4 py-2 bg-primary text-on-primary rounded-xl"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // Today's tasks (simulated)
  const todayTasks = cycleTasks.filter(t => t.scheduled_date === activeDate.date);

  // Stats calculation
  const completedCount = cycleTasks.filter(t => t.status === 'completed').length;
  const totalCount = cycleTasks.length;
  const achievementRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const today = new Date();
  const goalEndDate = new Date(goal.end_date);
  const remainingDays = Math.max(0, Math.ceil((goalEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

  const handleOpenCompletion = (task: Task) => {
    if (task.status === 'completed') return; // Already completed
    setCompletingTask(task);
    setCompletionMemo('');
    setActualMinutes(task.estimated_minutes);
    setResultLink('');
    setValidationError(null);
    setIsCompletionModalOpen(true);
  };

  const handleSaveCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    if (!completionMemo.trim()) {
      setValidationError('완료 메모를 입력해주세요.');
      return;
    }

    const updatedTask: Task = {
      ...completingTask,
      status: 'completed',
      memo: completionMemo,
      actual_minutes: actualMinutes,
      result_link: resultLink,
      completed_at: new Date().toISOString()
    };

    updateTask(updatedTask);
    setIsCompletionModalOpen(false);
    loadGoalAndTasks(); // Reload
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setValidationError('과제명을 입력해주세요.');
      return;
    }
    if (!newTaskCondition.trim()) {
      setValidationError('완료 기준을 입력해주세요.');
      return;
    }

    // Check count for active date
    if (todayTasks.length >= 2) {
      setValidationError('수행일당 과제는 최대 2개까지만 등록할 수 있습니다.');
      return;
    }
    if (cycleTasks.length >= 10) {
      setValidationError('한 사이클 전체 과제는 최대 10개까지만 등록할 수 있습니다.');
      return;
    }

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      goal_id: goal.id,
      cycle_number: 1,
      scheduled_date: activeDate.date,
      title: newTaskTitle,
      difficulty: newTaskDifficulty,
      estimated_minutes: newTaskMinutes,
      completion_condition: newTaskCondition,
      status: 'todo',
      memo: '',
      actual_minutes: 0,
      result_link: '',
      carryover_count: 0,
      completed_at: ''
    };

    const all = getAllTasks();
    saveTasks([...all, newTask]);
    setIsAddModalOpen(false);
    setNewTaskTitle('');
    setNewTaskCondition('');
    loadGoalAndTasks();
  };

  const getKoreanDay = (dayName: string) => {
    const mapping: Record<string, string> = {
      Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일'
    };
    return mapping[dayName] || dayName;
  };

  const difficultyNames = ['최하', '하', '중', '상', '최상'];

  return (
    <div className="w-full px-margin-mobile md:px-gutter py-stack-lg flex flex-col gap-stack-lg relative pb-24 md:pb-0">
      
      {/* Contextual Indicator & Cycle Navigation */}
      <section className="flex flex-col gap-stack-sm w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-headline-lg text-on-surface font-bold">대시보드</h1>
            <p className="text-body-lg text-on-surface-variant font-medium">5+1+1 주간 리듬을 시뮬레이션하세요.</p>
          </div>
          
          <ComingSoonButton
            name="회원가입/로그인 및 프로필"
            description="개인화된 프로필 정보를 수정하고 SNS 소셜 계정과 연동합니다."
            position="대시보드 우측 상단"
          >
            <div className="bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-full border border-outline-variant/30 text-body-sm font-semibold text-on-surface flex items-center gap-2">
              Alex 님 (프로필)
            </div>
          </ComingSoonButton>
        </div>

        {/* Cycle Simulator Navigation */}
        <div className="bg-white/80 border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold text-body-sm mb-3">
            <ClipboardSignature className="w-4 h-4" />
            <span>가상 날짜 시뮬레이터 (요일을 클릭해 해당 날짜로 이동)</span>
          </div>
          {setSimulatedDayIndex && (
            <CycleNavBar
              goal={goal}
              currentView="dashboard-performance"
              onNavigate={onNavigate || (() => {})}
              simulatedDayIndex={simulatedDayIndex}
              setSimulatedDayIndex={setSimulatedDayIndex}
            />
          )}
        </div>
      </section>

      {/* Current Goal Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
        {/* Main Goal Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-outline-variant/30 p-stack-md flex flex-col gap-stack-md shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-label-caps text-primary bg-primary-container/10 px-2.5 py-0.5 rounded-full w-max font-bold">
                현재 수행 중
              </span>
              <h2 className="text-title-md text-on-surface font-bold mt-2">{goal.title}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/20">
              <FolderOpen className="text-primary w-6 h-6" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex justify-between text-body-sm">
              <span className="text-on-surface-variant font-medium">과제 수행률: {achievementRate}%</span>
              <span className="text-on-surface font-bold">{remainingDays}일 남음</span>
            </div>
            {/* Custom Progress Bar */}
            <div className="h-3.5 w-full bg-surface-container rounded-full overflow-hidden flex border border-outline-variant/10">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${achievementRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Stats/Context Card */}
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/30 p-stack-md flex flex-col justify-center items-center gap-stack-sm shadow-sm relative overflow-hidden text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
          <Flame className="text-primary w-10 h-10 fill-current animate-bounce" />
          <div className="flex flex-col items-center z-10">
            <span className="text-headline-lg font-bold text-on-surface leading-none">사이클 1</span>
            <span className="text-body-sm text-on-surface-variant mt-2 font-medium">
              꾸준한 리듬이 성공을 만듭니다.<br />
              오늘의 미션을 완료해 성공율을 높이세요!
            </span>
          </div>
        </div>
      </section>

      {/* Today's Status */}
      <section className="flex flex-col gap-stack-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-title-md text-on-surface font-bold">
              {simulatedDayIndex}일차 미션 ({getKoreanDay(activeDate.dayName)}요일, {activeDate.date})
            </h3>
            <span className="text-label-caps bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-bold">
              수행일
            </span>
          </div>
          <button 
            onClick={() => onNavigate?.('plan')}
            className="text-body-sm text-primary font-bold hover:underline"
          >
            계획 수정
          </button>
        </div>

        <div className="flex flex-col gap-stack-sm">
          {todayTasks.map(task => {
            const isCompleted = task.status === 'completed';
            return (
              <div 
                key={task.id}
                onClick={() => handleOpenCompletion(task)}
                className={`bg-white rounded-2xl border border-outline-variant/30 p-4 md:p-5 flex items-center gap-4 shadow-sm transition-all ${isCompleted ? 'opacity-70 bg-surface/50 border-dashed cursor-default' : 'hover:shadow-md hover:border-primary/40 cursor-pointer group'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant group-hover:border-primary'}`}>
                  {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className={`text-body-lg font-bold ${isCompleted ? 'line-through text-on-surface-variant/60' : 'text-on-surface'}`}>
                      {task.title}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">완료 기준: {task.completion_condition}</p>
                    {isCompleted && task.memo && (
                      <p className="text-xs text-secondary mt-2 bg-secondary/5 border border-secondary/10 p-2.5 rounded-lg">
                        <strong>완료 회고:</strong> {task.memo} ({task.actual_minutes}분 소요)
                        {task.result_link && (
                          <a href={task.result_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 text-primary hover:underline text-[10px]">
                            <Link2 className="w-3 h-3" /> 결과 링크 바로가기
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 items-center self-start md:self-auto">
                    <span className="text-label-caps bg-primary-container/10 text-primary px-2.5 py-1 rounded-full font-bold">
                      난이도 {task.difficulty}단계
                    </span>
                    <span className="text-label-caps bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full font-bold">
                      {task.estimated_minutes}분 예상
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {todayTasks.length === 0 && (
            <div className="bg-white/50 border-2 border-dashed border-outline-variant/40 rounded-2xl py-12 text-center text-on-surface-variant text-body-sm">
              오늘 계획된 과제가 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* Completed Goals */}
      <section className="flex flex-col gap-stack-md opacity-90">
        <h3 className="text-title-md text-on-surface-variant font-bold">완료한 목표 목록</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          {completedGoals.map(cg => (
            <div key={cg.id} className="bg-surface rounded-2xl border border-outline-variant border-dashed p-5 flex justify-between items-center opacity-70">
              <div className="flex flex-col">
                <span className="text-body-lg font-bold text-on-surface line-through">{cg.title}</span>
                <span className="text-body-sm text-on-surface-variant mt-1">성공 기준: {cg.success_condition}</span>
              </div>
              <CheckCircle2 className="text-secondary w-7 h-7 fill-current" />
            </div>
          ))}
          {completedGoals.length === 0 && (
            <div className="col-span-2 text-body-sm text-on-surface-variant text-center bg-surface-container-low/40 rounded-xl py-4">
              아직 완료된 목표가 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* FAB: Add task to today */}
      {todayTasks.length < 2 && (
        <button 
          onClick={() => { setValidationError(null); setIsAddModalOpen(true); }}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-40"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Task Completion Log Modal */}
      {isCompletionModalOpen && completingTask && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-title-md font-bold text-on-surface">과제 완료 기록</h3>
              <button 
                onClick={() => setIsCompletionModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mb-4 bg-error-container text-on-error-container p-3 rounded-lg text-xs font-semibold">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSaveCompletion} className="space-y-4">
              <div>
                <span className="block text-body-sm font-semibold text-on-surface-variant">대상 과제</span>
                <span className="block text-body-lg font-bold text-on-surface mt-1">{completingTask.title}</span>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-1">완료 회고 메모 <span className="text-error">*</span></label>
                <textarea 
                  value={completionMemo}
                  onChange={(e) => setCompletionMemo(e.target.value)}
                  placeholder="오늘 이 과제를 진행하며 느낀 점, 마주한 이슈 등을 기록해두세요..." 
                  rows={3} 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary resize-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface mb-1">실제 수행 시간(분)</label>
                  <input 
                    type="number" 
                    min="10" 
                    step="10"
                    value={actualMinutes}
                    onChange={(e) => setActualMinutes(parseInt(e.target.value) || 60)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface mb-1">결과물 링크 (선택)</label>
                  <input 
                    type="url" 
                    value={resultLink}
                    onChange={(e) => setResultLink(e.target.value)}
                    placeholder="https://github.com/..." 
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsCompletionModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm text-on-surface hover:bg-surface-container-low"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-secondary text-on-secondary rounded-lg text-body-sm font-semibold hover:bg-secondary/95 shadow-md"
                >
                  완료 처리
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB Quick Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-title-md font-bold text-on-surface">오늘의 할 일 추가</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mb-4 bg-error-container text-on-error-container p-3 rounded-lg text-xs font-semibold">
                {validationError}
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-1">과제명 <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="예: 기획안 검토 및 피드백 작성" 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface mb-1">난이도</label>
                  <select 
                    value={newTaskDifficulty} 
                    onChange={(e) => setNewTaskDifficulty(parseInt(e.target.value))}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="1">최하 (1)</option>
                    <option value="2">하 (2)</option>
                    <option value="3">중 (3)</option>
                    <option value="4">상 (4)</option>
                    <option value="5">최상 (5)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface mb-1">예상 시간(분)</label>
                  <input 
                    type="number" 
                    min="10" 
                    step="10"
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(parseInt(e.target.value) || 60)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-1">완료 기준 <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  value={newTaskCondition}
                  onChange={(e) => setNewTaskCondition(e.target.value)}
                  placeholder="예: 피드백 문서 1장 완성" 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm text-on-surface hover:bg-surface-container-low"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-semibold hover:bg-primary/95"
                >
                  과제 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
