import React, { useState, useEffect } from 'react';
import { AlertCircle, Upload, ArrowRight, Scissors, Edit2, Trash2, ListPlus, CheckCircle2, ClipboardSignature, X } from 'lucide-react';
import { ViewProps, Goal, Task, SupplementRecord } from '../../types';
import { getGoal, getTasksForCycle, updateTask, deleteTask, addSupplementRecord, getSupplementRecords, saveTasks, getAllTasks, formatDate, addDays, getDayOfWeekString } from '../../utils/storage';
import { CycleNavBar } from '../../components/CycleNavBar';
import { ComingSoonButton } from '../../components/ComingSoonModal';

export function SupplementView({ onNavigate, currentGoalId, simulatedDayIndex = 1, setSimulatedDayIndex }: ViewProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [incompleteTasks, setIncompleteTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]); // Task IDs chosen for supplement
  const [activeSupplementTasks, setActiveSupplementTasks] = useState<string[]>([]); // Task IDs currently in supplement process
  const [records, setRecords] = useState<SupplementRecord[]>([]);

  // Modals and dialogs
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [completionMemo, setCompletionMemo] = useState('');
  const [actualMinutes, setActualMinutes] = useState(60);
  const [resultLink, setResultLink] = useState('');

  // Repeat Incomplete Action Dialog
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionTask, setActionTask] = useState<Task | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Replacement state
  const [newTitle, setNewTitle] = useState('');
  const [newScopeMinutes, setNewScopeMinutes] = useState(30);

  useEffect(() => {
    loadData();
  }, [currentGoalId]);

  const loadData = () => {
    if (currentGoalId) {
      const g = getGoal(currentGoalId);
      if (g) {
        setGoal(g);
        
        // Find tasks in Cycle 1 that are NOT completed
        const tasks = getTasksForCycle(g.id, 1);
        const incomplete = tasks.filter(t => t.status !== 'completed');
        setIncompleteTasks(incomplete);

        const recs = getSupplementRecords();
        setRecords(recs);
      }
    }
  };

  if (!goal) {
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

  // Toggle selection of tasks for supplement (max 2)
  const handleToggleSelect = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      if (selectedTasks.length >= 2) {
        alert('보완일에는 최대 2개의 과제만 선택하여 수행할 수 있습니다.');
        return;
      }
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  // Perform Supplement Action (adds to active supplement)
  const handleStartSupplement = () => {
    if (selectedTasks.length === 0) {
      alert('보완할 과제를 최소 1개 이상 선택해 주세요.');
      return;
    }
    setActiveSupplementTasks(selectedTasks);
    
    // Log supplement record in localstorage
    selectedTasks.forEach(id => {
      const record: SupplementRecord = {
        id: Math.random().toString(36).substr(2, 9),
        task_id: id,
        unfinished_reason: '보완일 수행 선택',
        supplement_status: 'supplemented',
        carryover_selected: false,
        created_at: new Date().toISOString()
      };
      addSupplementRecord(record);
    });
  };

  // Complete a supplemented task
  const handleOpenCompleteModal = (task: Task) => {
    setCompletingTask(task);
    setCompletionMemo('');
    setActualMinutes(task.estimated_minutes);
    setResultLink('');
    setIsCompletionModalOpen(true);
  };

  const handleSaveCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    if (!completionMemo.trim()) {
      alert('완료 회고 메모를 작성해 주세요.');
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
    
    // Clear selection
    setSelectedTasks(selectedTasks.filter(id => id !== completingTask.id));
    setActiveSupplementTasks(activeSupplementTasks.filter(id => id !== completingTask.id));
    loadData();
  };

  // Carryover task
  const handleCarryover = (task: Task) => {
    setValidationError(null);
    // Carry over rule: can only carry over once.
    // If carryover_count >= 1, this is the 3rd time incomplete (Cycle 0 was incomplete -> carried to Cycle 1 -> still incomplete in Cycle 1)
    // We must trigger the choice modal for repeat incomplete
    if (task.carryover_count >= 1) {
      setActionTask(task);
      setNewTitle(task.title);
      setNewScopeMinutes(Math.max(10, Math.round(task.estimated_minutes / 2)));
      setIsActionModalOpen(true);
      return;
    }

    // Execute standard carryover to Cycle 2
    // Scheduled date for next cycle is start_date + 7 days
    const nextCycleStartDate = addDays(goal.start_date, 7);
    const dayOfWeek = getDayOfWeekString(task.scheduled_date);
    
    // Find matching date in next cycle
    let nextScheduledDate = nextCycleStartDate;
    for (let i = 0; i < 7; i++) {
      const dStr = addDays(nextCycleStartDate, i);
      if (getDayOfWeekString(dStr) === dayOfWeek) {
        nextScheduledDate = dStr;
        break;
      }
    }

    const updatedTask: Task = {
      ...task,
      cycle_number: 2,
      scheduled_date: nextScheduledDate,
      carryover_count: task.carryover_count + 1,
      status: 'todo'
    };

    updateTask(updatedTask);

    const record: SupplementRecord = {
      id: Math.random().toString(36).substr(2, 9),
      task_id: task.id,
      unfinished_reason: '다음 사이클 이월',
      supplement_status: 'carryover',
      carryover_selected: true,
      created_at: new Date().toISOString()
    };
    addSupplementRecord(record);

    alert(`과제 '${task.title}'가 다음 사이클로 이월되었습니다.`);
    loadData();
  };

  // Repeat incomplete action handler (Shrink scope, Delete, Change)
  const handleRepeatAction = (type: 'shrink' | 'delete' | 'change') => {
    if (!actionTask) return;

    if (type === 'shrink') {
      // Reduce estimated minutes and update title
      const updated: Task = {
        ...actionTask,
        title: `[축소] ${actionTask.title}`,
        estimated_minutes: newScopeMinutes,
        cycle_number: 2, // Move to next cycle with reduced scope
        carryover_count: 0, // Reset carryover count since it's redesigned
        status: 'todo'
      };
      updateTask(updated);
      alert('과제 범위가 축소되어 다음 사이클로 이월되었습니다.');
    } else if (type === 'delete') {
      deleteTask(actionTask.id);
      alert('과제가 삭제되었습니다.');
    } else if (type === 'change') {
      if (!newTitle.trim()) {
        alert('새 과제명을 입력해주세요.');
        return;
      }
      const updated: Task = {
        ...actionTask,
        title: newTitle,
        estimated_minutes: newScopeMinutes,
        cycle_number: 2,
        carryover_count: 0,
        status: 'todo'
      };
      updateTask(updated);
      alert('새 과제로 변경되어 다음 사이클에 등록되었습니다.');
    }

    setIsActionModalOpen(false);
    setActionTask(null);
    loadData();
  };

  return (
    <div className="w-full px-margin-mobile md:px-gutter py-stack-lg flex flex-col gap-stack-lg relative pb-24 md:pb-0">
      
      {/* Header Section */}
      <div className="flex flex-col gap-stack-sm w-full">
        <h1 className="text-headline-lg text-on-surface font-bold">대시보드 - 보완일</h1>
        <p className="text-body-lg text-on-surface-variant font-medium">
          오늘은 새로운 과제를 추가하는 날이 아닙니다. 지난 5일 동안 완료하지 못한 과제를 확인하고 보충하거나 이월하세요.
        </p>

        {/* Date Navigator */}
        <div className="bg-white/80 border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold text-body-sm mb-3">
            <ClipboardSignature className="w-4 h-4" />
            <span>가상 날짜 시뮬레이터</span>
          </div>
          {setSimulatedDayIndex && (
            <CycleNavBar
              goal={goal}
              currentView="dashboard-supplement"
              onNavigate={onNavigate || (() => {})}
              simulatedDayIndex={simulatedDayIndex}
              setSimulatedDayIndex={setSimulatedDayIndex}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incomplete Task List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-title-md text-on-surface border-b border-outline-variant/30 pb-2 font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-secondary" />
            <span>미완료 과제 목록 (지난 5일)</span>
          </h2>

          {incompleteTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-outline-variant/30">
              <CheckCircle2 className="w-12 h-12 text-secondary mx-auto mb-4" />
              <p className="text-body-lg font-bold text-on-surface mb-1">모든 과제를 완료했습니다!</p>
              <p className="text-body-sm text-on-surface-variant">이번 사이클을 성공적으로 완수하셨습니다. 휴식일로 이동하세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteTasks.map(task => {
                const isSelected = selectedTasks.includes(task.id);
                const isActive = activeSupplementTasks.includes(task.id);
                
                return (
                  <div 
                    key={task.id}
                    className={`bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-4 transition-all ${isActive ? 'border-secondary-container bg-secondary/5' : isSelected ? 'border-primary' : 'border-outline-variant/30'}`}
                  >
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      disabled={isActive}
                      onChange={() => handleToggleSelect(task.id)}
                      className="mt-1.5 w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-primary-container/10 text-primary rounded-full text-[10px] font-bold">
                          난이도 {task.difficulty}단계
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">이월 횟수: {task.carryover_count}/1회</span>
                      </div>
                      <h3 className={`text-body-lg font-bold text-on-surface ${isActive ? 'text-secondary' : ''}`}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 font-medium">완료 기준: {task.completion_condition}</p>
                      
                      {isActive && (
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => handleOpenCompleteModal(task)}
                            className="bg-secondary text-on-secondary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-secondary/95 shadow-sm active:scale-95"
                          >
                            보완 완료 기록
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {!isActive && (
                      <button 
                        onClick={() => handleCarryover(task)}
                        className="text-body-sm font-bold text-primary hover:underline self-center flex items-center gap-1 active:scale-95"
                      >
                        이월/조치
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-body-sm text-on-surface-variant font-bold">
            선택된 보완 과제: {selectedTasks.length} / 2개
          </div>
        </div>

        {/* Actions & Side panel */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-title-md text-on-surface font-bold mb-2">과제 보완하기</h3>
            <p className="text-body-sm text-on-surface-variant mb-6 font-medium">
              미완료 과제 중 오늘 집중해서 해결할 과제를 최대 2개 골라 '보완 시작'을 누르세요.
            </p>

            <button 
              onClick={handleStartSupplement}
              disabled={selectedTasks.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-on-primary rounded-xl text-body-sm font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 shadow-md active:scale-95"
            >
              <ListPlus className="w-4 h-4" />
              선택한 과제 보완 시작
            </button>
          </div>

          {/* Coming Soon Feature */}
          <ComingSoonButton 
            name="과제 증빙 파일 업로드" 
            description="완료한 과제의 보고서 PDF, 스크린샷 이미지 등 증빙 파일을 업로드하여 저장합니다." 
            position="보완 화면 우측 하단"
          >
            <div className="p-5 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-low text-center">
              <Upload className="text-on-surface-variant w-8 h-8 mx-auto mb-2" />
              <span className="text-body-sm font-bold text-on-surface-variant block">파일 업로드 / 증빙 자료 제출</span>
              <span className="text-label-caps text-outline bg-surface-variant px-2.5 py-0.5 rounded-full mt-2 font-bold border border-outline-variant/20">추가 예정</span>
            </div>
          </ComingSoonButton>
        </div>
      </div>

      {/* Task Completion Log Modal */}
      {isCompletionModalOpen && completingTask && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-title-md font-bold text-on-surface">보완 과제 완료 기록</h3>
              <button 
                onClick={() => setIsCompletionModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  placeholder="보완하여 과제를 해결한 방법과 회고를 입력하세요..." 
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

      {/* Repeat Incomplete Action Modal (3rd incomplete) */}
      {isActionModalOpen && actionTask && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-up">
            <div className="flex items-center gap-2 text-error mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-title-md font-bold text-on-surface">3회 이상 미완료 조치 필요</h3>
            </div>
            
            <p className="text-body-sm text-on-surface-variant mb-4 font-medium">
              과제 <strong>'{actionTask.title}'</strong>가 반복해서 완료되지 않았습니다. 기획서의 조치 규칙에 따라 아래 옵션 중 하나를 반드시 선택해야 합니다.
            </p>

            <div className="space-y-3">
              {/* Option 1: Shrink Scope */}
              <div className="border border-outline-variant/40 rounded-xl p-3.5 hover:border-primary transition-colors">
                <span className="text-body-sm font-bold text-on-surface block mb-2 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-primary" />
                  1. 과제 범위 축소 후 이월
                </span>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-on-surface-variant whitespace-nowrap font-medium">예상 시간 수정:</span>
                  <input 
                    type="number" 
                    value={newScopeMinutes}
                    onChange={(e) => setNewScopeMinutes(parseInt(e.target.value) || 30)}
                    className="w-20 bg-surface border border-outline-variant rounded px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-on-surface-variant">분으로 축소</span>
                </div>
                <button 
                  onClick={() => handleRepeatAction('shrink')}
                  className="mt-3 w-full bg-primary/10 text-primary text-xs font-bold py-1.5 rounded-lg hover:bg-primary/25"
                >
                  범위 축소 적용
                </button>
              </div>

              {/* Option 2: Replace with other task */}
              <div className="border border-outline-variant/40 rounded-xl p-3.5 hover:border-primary transition-colors">
                <span className="text-body-sm font-bold text-on-surface block mb-2 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-primary" />
                  2. 다른 과제로 교체하여 다음 사이클 등록
                </span>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="새로운 과제명을 적어주세요..."
                  className="w-full bg-surface border border-outline-variant rounded px-2.5 py-1.5 text-xs focus:outline-none"
                />
                <button 
                  onClick={() => handleRepeatAction('change')}
                  className="mt-3 w-full bg-primary/10 text-primary text-xs font-bold py-1.5 rounded-lg hover:bg-primary/25"
                >
                  과제 교체 적용
                </button>
              </div>

              {/* Option 3: Delete Task */}
              <div className="border border-outline-variant/40 rounded-xl p-3.5 hover:border-error transition-colors bg-error-container/5">
                <span className="text-body-sm font-bold text-error block mb-1 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  3. 이 과제를 완전 삭제
                </span>
                <button 
                  onClick={() => handleRepeatAction('delete')}
                  className="mt-2 w-full bg-error text-on-error text-xs font-bold py-1.5 rounded-lg hover:bg-error/95"
                >
                  과제 삭제 적용
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => { setIsActionModalOpen(false); setActionTask(null); }}
                className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container-low"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
