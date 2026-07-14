import React, { useState, useEffect } from 'react';
import { Sparkles, Edit2, Trash2, Plus, Lock, Star, X, Clock, Loader2, AlertCircle } from 'lucide-react';
import { ViewProps, Goal, Task } from '../types';
import { getGoal, getTasksForCycle, saveTasks, formatDate, addDays, getDayOfWeekString, getDaysDifference } from '../utils/storage';
import { ComingSoonButton } from '../components/ComingSoonModal';
import { GoogleGenAI } from '@google/genai';

export function PlanView({ onNavigate, currentGoalId }: ViewProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [performanceDates, setPerformanceDates] = useState<{ date: string; dayName: string; index: number }[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDifficulty, setTaskDifficulty] = useState(3);
  const [taskMinutes, setTaskMinutes] = useState(60);
  const [taskCondition, setTaskCondition] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentGoalId) {
      const g = getGoal(currentGoalId);
      if (g) {
        setGoal(g);
        
        // Compute the dates of Cycle 1
        const dates: { date: string; dayName: string; index: number }[] = [];
        let pIndex = 1;
        for (let i = 0; i < 7; i++) {
          const dStr = addDays(g.start_date, i);
          const dayOfWeek = getDayOfWeekString(dStr);
          if (g.performance_days.includes(dayOfWeek)) {
            dates.push({ date: dStr, dayName: dayOfWeek, index: pIndex++ });
          }
        }
        setPerformanceDates(dates);

        // Load existing tasks if any
        const existing = getTasksForCycle(g.id, 1);
        setLocalTasks(existing);
      }
    }
  }, [currentGoalId]);

  if (!goal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-error mb-4" />
        <h2 className="text-title-md font-bold text-on-surface mb-2">선택된 목표가 없습니다</h2>
        <button 
          onClick={() => onNavigate?.('goal-list')}
          className="px-4 py-2 bg-primary text-on-primary rounded-xl"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // Calculate total duration in days
  const goalDurationDays = getDaysDifference(goal.start_date, goal.end_date) + 1;
  
  // Render timeline category based on duration:
  // 7~28일: 전체 단계와 현재 5일 과제
  // 29~90일: 주요 단계와 현재 5일 과제
  // 91일 이상: 월별 마일스톤과 현재 5일 과제
  const renderTimeline = () => {
    let type = '7-28';
    let labels: string[] = [];
    
    if (goalDurationDays >= 91) {
      type = '91+';
      const months = Math.ceil(goalDurationDays / 30);
      for (let i = 1; i <= Math.min(4, months); i++) {
        labels.push(`${i}개월`);
      }
    } else if (goalDurationDays >= 29) {
      type = '29-90';
      const phases = Math.ceil(goalDurationDays / 14);
      for (let i = 1; i <= Math.min(4, phases); i++) {
        labels.push(`단계 ${i}`);
      }
    } else {
      type = '7-28';
      const cycles = Math.ceil(goalDurationDays / 7);
      for (let i = 1; i <= Math.min(4, cycles); i++) {
        labels.push(`사이클 ${i}`);
      }
    }

    return (
      <section className="bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-5 mb-stack-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-body-lg font-bold text-on-surface">목표 타임라인</h2>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            {type === '91+' ? '월별 마일스톤 구조' : type === '29-90' ? '주요 단계 구조' : '전체 단계 구조'} ({goalDurationDays}일)
          </span>
        </div>
        <div className="relative pt-4 pb-2">
          <div className="absolute top-[40%] left-0 w-full h-1 bg-surface-container-high rounded-full -translate-y-1/2"></div>
          <div className="absolute top-[40%] left-0 w-1/4 h-1 bg-primary rounded-full -translate-y-1/2"></div>
          
          <div className="flex justify-between relative z-10">
            {labels.map((lbl, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                {idx === 0 ? (
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center ring-4 ring-surface-bright -mt-1 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-surface-container-high border border-outline-variant ring-4 ring-surface-bright"></div>
                )}
                <span className={`text-label-caps font-bold ${idx === 0 ? 'text-primary' : 'text-on-surface-variant'}`}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const handleOpenAddTask = (dateStr: string) => {
    // Check limit: 수행일당 최대 2개
    const dayTasks = localTasks.filter(t => t.scheduled_date === dateStr);
    if (dayTasks.length >= 2) {
      setError('수행일당 과제는 최대 2개까지만 등록할 수 있습니다.');
      return;
    }
    // Check total limit: 사이클당 최대 10개
    if (localTasks.length >= 10) {
      setError('한 사이클(5일 수행일 전체)에 과제는 최대 10개까지만 등록할 수 있습니다.');
      return;
    }

    setEditingTask(null);
    setTaskTitle('');
    setTaskDifficulty(3);
    setTaskMinutes(60);
    setTaskCondition('');
    setTargetDate(dateStr);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDifficulty(task.difficulty);
    setTaskMinutes(task.estimated_minutes);
    setTaskCondition(task.completion_condition);
    setTargetDate(task.scheduled_date);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setLocalTasks(localTasks.filter(t => t.id !== taskId));
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setValidationError('과제명을 입력해주세요.');
      return;
    }
    if (!taskCondition.trim()) {
      setValidationError('완료 기준을 입력해주세요.');
      return;
    }

    if (editingTask) {
      // Edit
      setLocalTasks(localTasks.map(t => t.id === editingTask.id ? {
        ...t,
        title: taskTitle,
        difficulty: taskDifficulty,
        estimated_minutes: taskMinutes,
        completion_condition: taskCondition
      } : t));
    } else {
      // Add
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        goal_id: goal.id,
        cycle_number: 1,
        scheduled_date: targetDate,
        title: taskTitle,
        difficulty: taskDifficulty,
        estimated_minutes: taskMinutes,
        completion_condition: taskCondition,
        status: 'todo',
        memo: '',
        actual_minutes: 0,
        result_link: '',
        carryover_count: 0,
        completed_at: ''
      };
      setLocalTasks([...localTasks, newTask]);
    }

    setIsModalOpen(false);
  };

  const handleAIPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      let useClientSide = false;

      try {
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, performanceDates })
        });
        if (response.ok) {
          data = await response.json();
        } else {
          useClientSide = true;
        }
      } catch (e) {
        useClientSide = true;
      }

      if (useClientSide) {
        let localKey = localStorage.getItem('gowith_gemini_api_key');
        if (!localKey) {
          localKey = prompt('Gemini API 키가 설정되지 않았습니다. AI 계획 생성을 위해 API 키를 입력해 주세요:');
          if (localKey) {
            localStorage.setItem('gowith_gemini_api_key', localKey);
          } else {
            throw new Error('API 키 입력이 취소되어 AI 계획을 생성할 수 없습니다.');
          }
        }

        const ai = new GoogleGenAI({ apiKey: localKey });
        const datesStr = performanceDates.map(d => `${d.date} (${d.dayName}요일)`).join(', ');
        const promptText = `
당신은 목표 관리 지원 AI 비서입니다. 사용자의 목표 정보를 바탕으로 현재 5일 수행일에 알맞은 일일 과제(태스크) 계획을 수립해야 합니다.
다음 기획서 원칙 및 제약 조건을 엄격하게 적용하여 생성해 주세요.

[사용자 목표 정보]
- 목표명: "${goal.title}"
- 목표 설명: "${goal.description || '없음'}"
- 목표 수행 이유: "${goal.goal_reason}"
- 성공 기준: "${goal.success_condition}"
- 현재 수준: "${goal.current_level || '없음'}"
- 전체 목표 난이도: ${goal.difficulty}단계 (1~5)
- 주당 가능 시간: ${goal.weekly_hours}시간

[생성 대상 수행일 날짜]
아래 명시된 5개의 날짜에만 각각 과제를 배정해야 합니다. 보완일과 휴식일은 생성 대상에서 제외됩니다.
날짜 목록: ${datesStr}

[엄격한 제약 조건]
1. 과제는 오직 위 ${performanceDates.length}개의 날짜에만 정확히 배정해야 합니다.
2. 각 날짜(수행일)당 배정할 수 있는 과제는 최대 2개 이하로 제한합니다.
3. 전체 사이클(5일 수행일 총합)의 과제 개수는 최대 10개 이하여야 합니다.
4. 과제별 난이도는 사용자가 설정한 전체 난이도(${goal.difficulty})를 초과할 수 없습니다. 즉, 모든 과제 난이도는 1부터 ${goal.difficulty} 사이여야 합니다.
5. 과제마다 예상 수행 시간(분 단위)과 구체적인 완료 기준을 작성하세요.
6. 모든 과제의 예상 수행 시간 총합은 사용자의 주당 가능 시간(${goal.weekly_hours}시간 = ${goal.weekly_hours * 60}분)을 절대 초과할 수 없으며, 보완일을 위해 주당 가능 시간의 최소 20%를 여유 시간으로 남겨야 합니다. (총합은 ${Math.round(goal.weekly_hours * 60 * 0.8)}분을 넘지 말 것)
7. 각 날짜마다 최소 1개의 과제는 반드시 포함되어야 합니다.

응답 형식은 아래 JSON 구조를 만족해야 합니다.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                tasks: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      scheduled_date: { type: 'STRING' },
                      title: { type: 'STRING' },
                      difficulty: { type: 'INTEGER' },
                      estimated_minutes: { type: 'INTEGER' },
                      completion_condition: { type: 'STRING' }
                    },
                    required: ['scheduled_date', 'title', 'difficulty', 'estimated_minutes', 'completion_condition']
                  }
                }
              },
              required: ['tasks']
            }
          }
        });

        if (!response.text) {
          throw new Error('AI 응답이 올바르지 않습니다.');
        }
        data = JSON.parse(response.text);
      }

      if (data && Array.isArray(data.tasks)) {
        const validTasks: Task[] = [];
        const dayCounts: Record<string, number> = {};

        data.tasks.forEach((t: any) => {
          const dStr = t.scheduled_date;
          if (!dayCounts[dStr]) dayCounts[dStr] = 0;
          if (dayCounts[dStr] < 2 && validTasks.length < 10) {
            validTasks.push({
              id: Math.random().toString(36).substr(2, 9),
              goal_id: goal.id,
              cycle_number: 1,
              scheduled_date: dStr,
              title: t.title,
              difficulty: t.difficulty || 3,
              estimated_minutes: t.estimated_minutes || 60,
              completion_condition: t.completion_condition || '완료',
              status: 'todo',
              memo: '',
              actual_minutes: 0,
              result_link: '',
              carryover_count: 0,
              completed_at: ''
            });
            dayCounts[dStr]++;
          }
        });

        setLocalTasks(validTasks);
      }
    } catch (err: any) {
      setError(err.message || 'AI 연동 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = () => {
    if (localTasks.length === 0) {
      setError('최소 1개 이상의 과제를 계획에 추가해야 합니다.');
      return;
    }
    
    // Save to LocalStorage
    const allTasks = getTasksForCycle(goal.id, 1);
    // Remove old Cycle 1 tasks for this goal, and add new ones
    const filteredTasks = getAllTasks().filter(t => !(t.goal_id === goal.id && t.cycle_number === 1));
    saveTasks([...filteredTasks, ...localTasks]);

    // Go to Performance Dashboard
    onNavigate?.('dashboard-performance');
  };

  const getKoreanDay = (dayName: string) => {
    const mapping: Record<string, string> = {
      Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일'
    };
    return mapping[dayName] || dayName;
  };

  const difficultyColors = (diff: number) => {
    switch (diff) {
      case 1: case 2: return 'bg-secondary/15 text-secondary';
      case 3: return 'bg-tertiary-container/30 text-on-tertiary-container';
      default: return 'bg-error-container text-on-error-container';
    }
  };

  const difficultyNames = ['최하', '하', '중', '상', '최상'];

  return (
    <div className="flex-1 w-full px-margin-mobile md:px-gutter pb-32">
      {/* Error Banner */}
      {error && (
        <div className="mt-4 bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-body-sm font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-stack-lg pt-stack-lg">
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold mb-1">로드맵 및 5일 계획</h1>
          <p className="text-body-sm text-on-surface-variant font-medium">목표: <strong className="text-primary">{goal.title}</strong> | 현재 사이클 계획을 설계하세요.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleAIPlan}
            disabled={loading}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-primary text-primary text-body-sm flex items-center justify-center gap-2 hover:bg-primary-container/10 transition-colors font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI로 생성하기
          </button>
        </div>
      </div>

      {/* Timeline Section */}
      {renderTimeline()}

      {/* 5-Day Plan Grid */}
      <h2 className="text-title-md text-on-surface font-bold mb-stack-md">현재 사이클 (1-5일차)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-md mb-stack-lg">
        
        {performanceDates.map(pDate => {
          const dayTasks = localTasks.filter(t => t.scheduled_date === pDate.date);
          
          return (
            <div 
              key={pDate.date} 
              className="bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col min-h-[220px]"
            >
              <div className="flex justify-between items-center border-b border-surface-container-high pb-2 mb-3">
                <span className="text-body-lg font-bold text-on-surface">{pDate.index}일차</span>
                <span className="text-label-caps text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full font-bold">
                  {getKoreanDay(pDate.dayName)}요일 ({pDate.date.slice(5)})
                </span>
              </div>
              
              {/* Task Items */}
              <div className="space-y-2 flex-grow">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 relative overflow-hidden group/item"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-body-sm font-semibold text-on-surface">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${difficultyColors(task.difficulty)}`}>
                            {difficultyNames[task.difficulty - 1]}
                          </span>
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-bold">
                            <Clock className="w-3 h-3" /> {task.estimated_minutes}분
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-2 bg-surface p-2 rounded border border-outline-variant/10">
                          기준: {task.completion_condition}
                        </p>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenEditTask(task)} 
                          className="text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container-low transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-error-container/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {dayTasks.length === 0 && (
                  <div className="h-full flex items-center justify-center border border-dashed border-outline-variant/30 rounded-xl py-6 text-on-surface-variant/50 text-body-sm text-center">
                    과제가 없습니다.
                  </div>
                )}
              </div>

              {dayTasks.length < 2 && (
                <button 
                  onClick={() => handleOpenAddTask(pDate.date)}
                  className="w-full mt-3 py-2 border border-dashed border-outline-variant hover:border-primary/50 hover:bg-primary-container/10 rounded-xl text-on-surface-variant hover:text-primary text-body-sm transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="w-4 h-4" /> 과제 추가
                </button>
              )}
            </div>
          );
        })}

        {/* Coming Soon Feature */}
        <ComingSoonButton 
          name="복수 AI 에이전트" 
          description="다양한 페르소나의 AI 에이전트들이 교차 검토하여 더 정교한 목표 계획을 추천합니다." 
          position="계획 수립 화면 하단"
          className="h-full"
        >
          <div className="border border-dashed border-outline-variant bg-surface-container-low/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center h-full min-h-[220px]">
            <Sparkles className="text-on-surface-variant w-8 h-8 mb-2" />
            <span className="text-body-sm text-on-surface font-bold">복수 AI 에이전트 연동</span>
            <span className="text-label-caps text-outline bg-surface-variant px-2.5 py-0.5 rounded-full mt-2 font-bold border border-outline-variant/20">추가 예정</span>
          </div>
        </ComingSoonButton>

      </div>

      {/* Confirm Action Area */}
      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
        <button 
          onClick={() => onNavigate?.('setup')}
          className="px-6 py-3 rounded-lg border border-outline-variant text-body-sm font-semibold text-on-surface hover:bg-surface-container-low"
        >
          목표 설정 변경
        </button>
        <button 
          onClick={handleFinalize}
          className="bg-primary text-on-primary px-8 py-3 rounded-xl text-title-md font-bold shadow-md hover:bg-primary/95 transition-all flex items-center gap-2 active:scale-95"
        >
          <Lock className="w-5 h-5" />
          계획 확정하기 (대시보드로 이동)
        </button>
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-title-md font-bold text-on-surface">
                {editingTask ? '과제 수정하기' : '새 과제 추가'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-1">과제명 <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="예: 리액트 컴포넌트 실습 예제 3개 코딩" 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface mb-1">난이도</label>
                  <select 
                    value={taskDifficulty} 
                    onChange={(e) => setTaskDifficulty(parseInt(e.target.value))}
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
                    value={taskMinutes}
                    onChange={(e) => setTaskMinutes(parseInt(e.target.value) || 60)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-1">완료 기준 <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  value={taskCondition}
                  onChange={(e) => setTaskCondition(e.target.value)}
                  placeholder="예: 예제 코드 동작 성공 캡처 및 블로그 정리" 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary" 
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm text-on-surface hover:bg-surface-container-low"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-semibold hover:bg-primary/95"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
