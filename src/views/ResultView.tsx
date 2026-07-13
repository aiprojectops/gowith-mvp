import React, { useState, useEffect } from 'react';
import { Verified, Flag, TrendingUp, Users, Store, AlertCircle, Sparkles, HelpCircle, RefreshCw } from 'lucide-react';
import { ViewProps, Goal, Task, SupplementRecord } from '../types';
import { getGoal, getTasks, getSupplementRecords, updateGoal, saveGoals, getGoals, addDays, formatDate } from '../utils/storage';
import { ComingSoonButton } from '../components/ComingSoonModal';

export function ResultView({ onNavigate, currentGoalId }: ViewProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<SupplementRecord[]>([]);

  useEffect(() => {
    if (currentGoalId) {
      const g = getGoal(currentGoalId);
      if (g) {
        setGoal(g);
        const goalTasks = getTasks(g.id);
        setTasks(goalTasks);
        const recs = getSupplementRecords();
        setRecords(recs);
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

  // Filter tasks for Cycle 1
  const cycle1Tasks = tasks.filter(t => t.cycle_number === 1);
  const totalCycle1Tasks = cycle1Tasks.length;

  // Determine standard vs supplemented completed tasks
  // Supplemented tasks have a SupplementRecord showing 'supplemented'
  const supplementedTaskIds = records
    .filter(r => r.supplement_status === 'supplemented')
    .map(r => r.task_id);

  const standardCompleted = cycle1Tasks.filter(
    t => t.status === 'completed' && !supplementedTaskIds.includes(t.id)
  ).length;

  const supplementedCompleted = cycle1Tasks.filter(
    t => t.status === 'completed' && supplementedTaskIds.includes(t.id)
  ).length;

  // Rates
  const performanceRate = totalCycle1Tasks > 0 
    ? Math.round((standardCompleted / totalCycle1Tasks) * 100) 
    : 0;

  const supplementRate = totalCycle1Tasks > 0
    ? Math.round((supplementedCompleted / totalCycle1Tasks) * 100)
    : 0;

  const finalRate = performanceRate + supplementRate;

  const isCycleSuccess = finalRate >= goal.success_threshold;

  // Overall Goal stats
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = tasks.length;
  const avgPerformanceRate = totalTasksCount > 0 
    ? Math.round((totalCompleted / totalTasksCount) * 100) 
    : 0;

  // Calculate elapsed days
  const today = new Date();
  const start = new Date(goal.start_date);
  const elapsedDays = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24)));
  const totalCycles = Math.ceil(elapsedDays / 7);

  // Next 5-Day Plan (Simulate advancing cycle)
  const handleCreateNextPlan = () => {
    // Advancing start date to start_date + 7 days
    const nextStart = addDays(goal.start_date, 7);
    const updatedGoal: Goal = {
      ...goal,
      start_date: nextStart,
      updated_at: new Date().toISOString()
    };
    updateGoal(updatedGoal);
    
    alert('다음 사이클 계획 작성 화면으로 이동합니다. 날짜가 1주일 앞당겨졌습니다.');
    onNavigate?.('plan');
  };

  const handleFinalEvaluation = (status: 'completed' | 'failed') => {
    const updatedGoal: Goal = {
      ...goal,
      status: status,
      updated_at: new Date().toISOString()
    };
    updateGoal(updatedGoal);
    alert(status === 'completed' ? '축하합니다! 목표를 최종 성공 처리하였습니다.' : '목표를 보완하기 위해 대시보드 리스트로 이동합니다.');
    onNavigate?.('goal-list');
  };

  return (
    <div className="w-full px-margin-mobile py-stack-lg flex-grow flex flex-col gap-stack-lg mb-20 md:mb-0">
      
      {/* Header Section */}
      <div className="flex flex-col gap-stack-sm md:flex-row md:justify-between md:items-end">
        <div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">사이클 1 결과 리포트</h2>
          <p className="text-body-lg text-on-surface-variant font-medium">이번 5+1+1 사이클의 최종 달성률 지표입니다.</p>
        </div>
        
        {isCycleSuccess ? (
          <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full shadow-sm w-max font-bold">
            <Verified className="w-5 h-5 fill-current" />
            <span className="text-label-caps">사이클 성공! (기준 {goal.success_threshold}% 만족)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-error-container text-on-error-container px-4 py-2 rounded-full shadow-sm w-max font-bold">
            <AlertCircle className="w-5 h-5" />
            <span className="text-label-caps">성공 기준 미흡 ({finalRate}% / 기준 {goal.success_threshold}%)</span>
          </div>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Performance vs Supplemented */}
        <div className="col-span-12 md:col-span-6 bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-sm p-6 rounded-2xl flex flex-col gap-stack-md relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-surface-variant rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          
          <h3 className="text-title-md text-on-surface font-bold z-10">사이클 상세 요약</h3>
          <div className="flex justify-between items-end z-10">
            <div className="flex flex-col">
              <span className="text-label-caps text-on-surface-variant font-bold">수행일 달성률</span>
              <span className="text-display-lg text-primary font-bold">{performanceRate}%</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-label-caps text-on-surface-variant font-bold">보완율 (누적)</span>
              <span className="text-headline-lg text-secondary font-bold">+{supplementRate}%</span>
            </div>
          </div>
          
          {/* Custom Progress Bar */}
          <div className="w-full h-5 bg-surface-container rounded-full flex overflow-hidden mt-4 z-10 border border-outline-variant/10">
            <div className="h-full bg-primary" style={{ width: `${performanceRate}%` }}></div>
            <div className="h-full bg-secondary" style={{ width: `${supplementRate}%` }}></div>
          </div>
          
          <div className="flex justify-between text-label-caps text-on-surface-variant z-10 font-bold mt-2">
            <span>기본 수행: {standardCompleted}개 완료</span>
            <span>보완 수행: {supplementedCompleted}개 완료</span>
          </div>
        </div>

        {/* Goal Summary */}
        <div className="col-span-12 md:col-span-6 bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-sm p-6 rounded-2xl flex flex-col gap-stack-md">
          <div className="flex justify-between items-center">
            <h3 className="text-title-md text-on-surface font-bold">전체 목표 누적 통계</h3>
            <Flag className="text-outline w-5 h-5" />
          </div>
          <p className="text-body-sm text-on-surface-variant font-medium">목표 달성 시점까지의 누적 지표입니다.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface p-4 rounded-xl flex flex-col border border-outline-variant/20">
              <span className="text-label-caps text-on-surface-variant font-bold">경과 사이클</span>
              <span className="text-headline-lg-mobile text-on-surface font-bold">{totalCycles} 주차</span>
            </div>
            <div className="bg-surface p-4 rounded-xl flex flex-col border border-outline-variant/20">
              <span className="text-label-caps text-on-surface-variant font-bold">완료한 과제</span>
              <span className="text-headline-lg-mobile text-on-surface font-bold">{totalCompleted} / {totalTasksCount}개</span>
            </div>
            <div className="col-span-2 bg-surface p-4 rounded-xl flex flex-col border border-outline-variant/20">
              <span className="text-label-caps text-on-surface-variant font-bold">평균 달성률</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-headline-lg-mobile text-on-surface font-bold">{avgPerformanceRate}%</span>
                <span className="text-xs text-secondary flex items-center gap-1 font-bold bg-secondary/10 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-4 h-4" /> 리듬 유지 우수
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Cycle Activation */}
        <div className="col-span-12 bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-title-md text-on-surface font-bold">다음 사이클 시작하기</h4>
            <p className="text-body-sm text-on-surface-variant font-medium">
              현재 사이클을 마치고 다음 5일 계획(수행 과제)을 새로 설계할 준비를 합니다.
            </p>
          </div>
          <button 
            onClick={handleCreateNextPlan}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
            다음 5일 계획 만들기
          </button>
        </div>

        {/* Final Success Evaluation */}
        <div className="col-span-12 bg-primary text-on-primary flex flex-col md:flex-row items-center justify-between gap-stack-md p-stack-lg rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="z-10 text-center md:text-left flex-1">
            <div className="flex items-center gap-2 justify-center md:justify-start text-label-caps bg-white/20 px-3 py-1 rounded-full w-max font-bold mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>목표 종료 평가</span>
            </div>
            <h3 className="text-headline-lg-mobile md:text-headline-lg font-bold mb-2">전체 목표 최종 완료하기</h3>
            <p className="text-body-lg opacity-90 font-medium">
              설정하신 최종 성공 기준인 <strong>'{goal.success_condition}'</strong>을 달성하셨나요?
            </p>
          </div>
          <div className="z-10 flex gap-4 w-full md:w-auto self-end md:self-auto">
            <button 
              onClick={() => handleFinalEvaluation('completed')}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white text-primary rounded-xl font-bold hover:bg-surface-container-low transition-colors shadow-md active:scale-95 text-body-sm whitespace-nowrap"
            >
              네, 달성했습니다!
            </button>
            <button 
              onClick={() => handleFinalEvaluation('failed')}
              className="flex-1 md:flex-none px-6 py-3.5 bg-transparent border-2 border-on-primary text-on-primary rounded-xl font-bold hover:bg-white/10 transition-colors active:scale-95 text-body-sm whitespace-nowrap"
            >
              조금 부족해요
            </button>
          </div>
        </div>

      </div>

      {/* Extensions Footer (Coming Soon) */}
      <div className="mt-stack-lg pt-stack-lg border-t border-outline-variant/30">
        <h4 className="text-title-md text-on-surface font-bold mb-stack-md">Gowith 확장 기능</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComingSoonButton 
            name="크라우드펀딩" 
            description="달성하고자 하는 개인 목표를 펀딩 상품으로 등록해 후원자들로부터 금전적 후원 및 지지를 얻습니다." 
            position="결과 화면 확장 기능"
          >
            <div className="border border-dashed border-outline-variant/30 rounded-xl p-4 bg-surface hover:bg-surface-container-low transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20">
                <Users className="text-primary w-5 h-5" />
              </div>
              <div>
                <span className="text-body-lg text-on-surface font-bold block">크라우드펀딩</span>
                <span className="text-label-caps text-outline font-bold">추가 예정</span>
              </div>
            </div>
          </ComingSoonButton>

          <ComingSoonButton 
            name="커뮤니티" 
            description="비슷한 자기계발 목표를 설정한 사용자들끼리 일일 미션을 서로 응원하고 회고를 공유하는 채널입니다." 
            position="결과 화면 확장 기능"
          >
            <div className="border border-dashed border-outline-variant/30 rounded-xl p-4 bg-surface hover:bg-surface-container-low transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20">
                <Users className="text-primary w-5 h-5" />
              </div>
              <div>
                <span className="text-body-lg text-on-surface font-bold block">커뮤니티</span>
                <span className="text-label-caps text-outline font-bold">추가 예정</span>
              </div>
            </div>
          </ComingSoonButton>

          <ComingSoonButton 
            name="복지몰" 
            description="적립된 마일리지 포인트를 사용해 제휴된 학습 강의 수강권, 서적, 웰니스 상품 등으로 교환합니다." 
            position="결과 화면 확장 기능"
          >
            <div className="border border-dashed border-outline-variant/30 rounded-xl p-4 bg-surface hover:bg-surface-container-low transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20">
                <Store className="text-primary w-5 h-5" />
              </div>
              <div>
                <span className="text-body-lg text-on-surface font-bold block">복지몰</span>
                <span className="text-label-caps text-outline font-bold">추가 예정</span>
              </div>
            </div>
          </ComingSoonButton>
        </div>
      </div>

    </div>
  );
}
