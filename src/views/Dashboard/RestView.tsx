import React, { useState, useEffect } from 'react';
import { CalendarDays, Gift, Cloud, AlertCircle, ClipboardSignature } from 'lucide-react';
import { ViewProps, Goal, Task, FreeMemo } from '../../types';
import { getGoal, getTasksForCycle, getFreeMemos, addFreeMemo, formatDate, addDays, getDayOfWeekString } from '../../utils/storage';
import { CycleNavBar } from '../../components/CycleNavBar';
import { ComingSoonButton } from '../../components/ComingSoonModal';

export function RestView({ onNavigate, currentGoalId, simulatedDayIndex = 1, setSimulatedDayIndex }: ViewProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [cycle1Tasks, setCycle1Tasks] = useState<Task[]>([]);
  const [nextCycleTasks, setNextCycleTasks] = useState<Task[]>([]);
  const [memoText, setMemoText] = useState('');

  const todayStr = formatDate(new Date());

  useEffect(() => {
    if (currentGoalId) {
      const g = getGoal(currentGoalId);
      if (g) {
        setGoal(g);

        // Load current cycle (Cycle 1) tasks
        const tasks = getTasksForCycle(g.id, 1);
        setCycle1Tasks(tasks);

        // Load next cycle (Cycle 2) tasks for preview
        const nextTasks = getTasksForCycle(g.id, 2);
        setNextCycleTasks(nextTasks);

        // Load memo for today
        const memos = getFreeMemos(g.id);
        const todayMemo = memos.find(m => m.memo_date === todayStr);
        if (todayMemo) {
          setMemoText(todayMemo.content);
        }
      }
    }
  }, [currentGoalId]);

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

  // Calculate current cycle statistics
  const completedCount = cycle1Tasks.filter(t => t.status === 'completed').length;
  const totalCount = cycle1Tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle memo saving
  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMemoText(text);

    // Save to local storage
    const memos = getFreeMemos(goal.id);
    const existingIndex = memos.findIndex(m => m.memo_date === todayStr);

    const newMemo: FreeMemo = {
      id: Math.random().toString(36).substr(2, 9),
      goal_id: goal.id,
      memo_date: todayStr,
      content: text,
      created_at: new Date().toISOString()
    };

    const allMemos = localStorage.getItem('gowith_memos');
    let parsed: FreeMemo[] = allMemos ? JSON.parse(allMemos) : [];
    
    // Filter out old today's memo for this goal
    parsed = parsed.filter(m => !(m.goal_id === goal.id && m.memo_date === todayStr));
    parsed.push(newMemo);

    localStorage.setItem('gowith_memos', JSON.stringify(parsed));
  };

  // Preview next day's task (Cycle 2 D1)
  const nextTask = nextCycleTasks[0];

  const getKoreanDay = (dayName: string) => {
    const mapping: Record<string, string> = {
      Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일'
    };
    return mapping[dayName] || dayName;
  };

  // Generate 7 cycle dots matching user schedule
  const renderCycleScheduleDots = () => {
    const dots: { dayName: string; type: 'action' | 'supplement' | 'rest' }[] = [];
    for (let i = 0; i < 7; i++) {
      const dStr = addDays(goal.start_date, i);
      const dayOfWeek = getDayOfWeekString(dStr);
      if (goal.performance_days.includes(dayOfWeek)) {
        dots.push({ dayName: dayOfWeek, type: 'action' });
      } else if (goal.supplement_day === dayOfWeek) {
        dots.push({ dayName: dayOfWeek, type: 'supplement' });
      } else if (goal.rest_day === dayOfWeek) {
        dots.push({ dayName: dayOfWeek, type: 'rest' });
      }
    }

    return (
      <div className="flex gap-1 h-3.5 w-full mt-4 border border-outline-variant/10 rounded-full overflow-hidden">
        {dots.map((dot, idx) => {
          let bg = 'bg-surface-container';
          if (dot.type === 'action') bg = 'bg-primary';
          else if (dot.type === 'supplement') bg = 'bg-secondary/60';
          else bg = 'bg-on-surface-variant';
          return (
            <div key={idx} className={`flex-1 ${bg}`} title={`${getKoreanDay(dot.dayName)}요일`}></div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full px-margin-mobile md:px-gutter pt-8 md:pt-12 flex flex-col gap-stack-lg relative pb-24 md:pb-0 min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #e5eeff 100%)' }}>
      
      {/* Rest Day Header & Simulator */}
      <section className="text-center py-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/90 rounded-full mb-3 shadow-md border border-outline-variant/20">
          <Cloud className="w-10 h-10 text-secondary fill-current animate-pulse" />
        </div>
        <h2 className="text-display-lg text-on-surface font-bold">휴식일 (7일차)</h2>
        <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto font-medium">
          오늘은 Gowith가 권장하는 공식 휴식일입니다. 죄책감 없이 온전히 재충전에 집중하세요!
        </p>

        {/* Date Navigator */}
        <div className="bg-white/80 border border-outline-variant/30 rounded-2xl p-4 shadow-sm text-left max-w-2xl mx-auto mt-6">
          <div className="flex items-center gap-2 text-primary font-bold text-body-sm mb-3">
            <ClipboardSignature className="w-4 h-4" />
            <span>가상 날짜 시뮬레이터</span>
          </div>
          {setSimulatedDayIndex && (
            <CycleNavBar
              goal={goal}
              currentView="dashboard-rest"
              onNavigate={onNavigate || (() => {})}
              simulatedDayIndex={simulatedDayIndex}
              setSimulatedDayIndex={setSimulatedDayIndex}
            />
          )}
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md max-w-4xl mx-auto w-full">
        {/* Goal Progress Overview */}
        <div className="col-span-1 md:col-span-8 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-title-md text-on-surface font-bold">주간 사이클 완료도</h3>
            <p className="text-body-sm text-on-surface-variant mt-1 font-medium">이번 주 5+1+1 리듬 수행 지표입니다.</p>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-label-caps text-on-surface-variant mb-2 font-bold">
              <span>수행 완료: {completedCount} / {totalCount}개 과제</span>
              <span className="text-primary">{completionRate}% 완료</span>
            </div>
            {renderCycleScheduleDots()}
            <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant font-bold">
              <span>수행일</span>
              <span>보완일</span>
              <span className="text-on-surface font-extrabold">휴식일</span>
            </div>
          </div>
        </div>

        {/* Preview Tomorrow */}
        <div className="col-span-1 md:col-span-4 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title-md text-on-surface font-bold">다음 사이클 일정</h3>
            <CalendarDays className="text-primary w-5 h-5" />
          </div>
          <p className="text-body-sm text-on-surface-variant font-medium">다음 주기 첫 수행일에 해야 할 일 미리보기</p>
          
          <div className="mt-auto pt-4">
            {nextTask ? (
              <div className="bg-surface p-4 rounded-xl border border-outline-variant/30">
                <p className="text-body-lg text-on-surface font-bold">{nextTask.title}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    난이도 {nextTask.difficulty}단계
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-bold">
                    {nextTask.estimated_minutes}분 예상
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-surface p-4 rounded-xl border border-dashed border-outline-variant/30 text-center text-on-surface-variant text-xs">
                다음 사이클 계획이 아직 설계되지 않았습니다.<br />
                (결과 페이지에서 생성 가능)
              </div>
            )}
          </div>
        </div>

        {/* Free Memo Area */}
        <div className="col-span-1 md:col-span-12 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
          <h3 className="text-title-md text-on-surface font-bold">휴식일 회고 저널</h3>
          <p className="text-body-sm text-on-surface-variant mt-1 mb-4 font-medium">
            이번 주 과제들을 수행하며 마주한 감정이나, 다음 주에 더 집중해야 할 부분들을 자유롭게 기록해 보세요.
          </p>
          <textarea 
            value={memoText}
            onChange={handleMemoChange}
            className="w-full bg-surface border border-outline-variant rounded-xl p-4 text-body-lg text-on-surface focus:outline-none focus:border-primary resize-none h-32" 
            placeholder="이번 주의 활동 소감과 회고를 자유롭게 적어보세요. (자동 저장됩니다)..."
          ></textarea>
        </div>

        {/* Coming Soon: Mileage/Rewards */}
        <div className="col-span-1 md:col-span-12">
          <ComingSoonButton
            name="마일리지 몰 및 리워드 상점"
            description="모은 마일리지 포인트로 기프티콘을 구매하거나, 기획한 최종 목표를 달성할 때 실제 혜택으로 교환할 수 있는 상점입니다."
            position="휴식일 대시보드 하단"
          >
            <div className="rounded-2xl p-6 border-2 border-dashed border-outline-variant/60 bg-white/70 hover:bg-white transition-colors flex flex-col items-center justify-center text-center">
              <Gift className="w-9 h-9 text-secondary mb-2" />
              <h3 className="text-title-md text-on-surface-variant font-bold">마일리지 연동 리워드 상점</h3>
              <p className="text-label-caps text-outline bg-surface-variant px-2.5 py-0.5 rounded-full mt-2 font-bold border border-outline-variant/20">추가 예정</p>
            </div>
          </ComingSoonButton>
        </div>
      </div>
    </div>
  );
}
