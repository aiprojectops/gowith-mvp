import React, { useState, useEffect } from 'react';
import { Zap, ListPlus, Coffee, Calendar, ArrowRight, GraduationCap, Clock, AlertTriangle } from 'lucide-react';
import { ViewProps, Goal } from '../types';
import { addGoal, formatDate, addDays, getDaysDifference } from '../utils/storage';
import { ComingSoonButton } from '../components/ComingSoonModal';

export function SetupView({ onNavigate, setCurrentGoalId }: ViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalReason, setGoalReason] = useState('');
  const [successCondition, setSuccessCondition] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  
  const todayStr = formatDate(new Date());
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(addDays(todayStr, 7)); // Default 1 week
  const [weeklyHours, setWeeklyHours] = useState(10);
  
  const [difficulty, setDifficulty] = useState(3);
  const difficultyLabels = ['매우 쉬움 (1)', '쉬움 (2)', '보통 (3)', '어려움 (4)', '매우 어려움 (5)'];

  const [successThreshold, setSuccessThreshold] = useState(80);

  const [schedule, setSchedule] = useState<Record<string, 'action' | 'supplement' | 'rest'>>({
    Mon: 'action', Tue: 'action', Wed: 'action', Thu: 'action', Fri: 'action', Sat: 'supplement', Sun: 'rest'
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Set end date based on quick choices
  const handleQuickPeriod = (days: number) => {
    setEndDate(addDays(startDate, days));
  };

  const handleQuickPeriodMonths = (months: number) => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + months);
    setEndDate(formatDate(start));
  };

  const cycleSchedule = (day: string) => {
    const states: ('action' | 'supplement' | 'rest')[] = ['action', 'supplement', 'rest'];
    const currentIndex = states.indexOf(schedule[day]);
    const nextState = states[(currentIndex + 1) % states.length];
    setSchedule({ ...schedule, [day]: nextState });
  };

  // Validate schedule counts
  const validateSchedule = (): boolean => {
    const counts = { action: 0, supplement: 0, rest: 0 };
    Object.values(schedule).forEach(state => {
      counts[state]++;
    });

    if (counts.action !== 5) {
      setValidationError(`수행일은 반드시 5개여야 합니다. (현재: ${counts.action}개)`);
      return false;
    }
    if (counts.supplement !== 1) {
      setValidationError(`보완일은 반드시 1개여야 합니다. (현재: ${counts.supplement}개)`);
      return false;
    }
    if (counts.rest !== 1) {
      setValidationError(`휴식일은 반드시 1개여야 합니다. (현재: ${counts.rest}개)`);
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('목표명을 입력해주세요.');
      return;
    }
    if (!successCondition.trim()) {
      setValidationError('성공 기준을 입력해주세요.');
      return;
    }

    const durationDays = getDaysDifference(startDate, endDate);
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    if (date2 < date1) {
      setValidationError('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    if (durationDays < 7) {
      setValidationError('최소 목표 기간은 7일입니다. 종료일을 늘려주세요.');
      return;
    }

    if (!validateSchedule()) {
      return;
    }

    if (weeklyHours <= 0) {
      setValidationError('주당 가능 시간은 1시간 이상이어야 합니다.');
      return;
    }

    // Extract days
    const performance_days = Object.entries(schedule).filter(([_, state]) => state === 'action').map(([day]) => day);
    const supplement_day = Object.entries(schedule).filter(([_, state]) => state === 'supplement').map(([day]) => day)[0];
    const rest_day = Object.entries(schedule).filter(([_, state]) => state === 'rest').map(([day]) => day)[0];

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      goal_reason: goalReason,
      success_condition: successCondition,
      start_date: startDate,
      end_date: endDate,
      current_level: currentLevel,
      weekly_hours: weeklyHours,
      difficulty,
      success_threshold: successThreshold,
      performance_days,
      supplement_day,
      rest_day,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addGoal(newGoal);
    if (setCurrentGoalId) {
      setCurrentGoalId(newGoal.id);
    }
    onNavigate?.('plan');
  };

  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-gutter pt-stack-lg pb-stack-lg w-full">
      <div className="mb-stack-lg">
        <p className="text-label-caps text-primary tracking-widest uppercase mb-2">목표 설정 단계</p>
        <h2 className="text-display-lg text-on-surface mb-4">새 목표 설계하기</h2>
        <p className="text-body-lg text-on-surface-variant">나만의 속도에 맞추어 지속 가능한 성장 리듬을 디자인하세요.</p>
      </div>

      {validationError && (
        <div className="mb-6 bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-body-sm font-semibold">{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-stack-lg">
        {/* Basic Info */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
          <h3 className="text-title-md text-on-surface font-bold">1. 기본 목표 정보</h3>
          <div className="space-y-stack-md">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-2">목표명 <span className="text-error">*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 주니어 프론트엔드 개발자 취업" 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-2">목표 설명</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="어떤 프로젝트를 하고 어떤 기술을 익힐지 간략하게 적어보세요..." 
                rows={2} 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none" 
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-2">목표를 수행하려는 이유 (목표 이유) <span className="text-error">*</span></label>
              <textarea 
                value={goalReason}
                onChange={(e) => setGoalReason(e.target.value)}
                placeholder="이 목표가 내 커리어나 성장에 왜 핵심적인가요? 힘이 빠질 때 되새길 동기를 적어보세요..." 
                rows={2} 
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-2">현재 수준 (출발점)</label>
                <input 
                  type="text" 
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  placeholder="예: 기본적인 HTML/JS 이해, React 경험 없음" 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-on-surface mb-2">성공 기준 (최종 아웃풋) <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  value={successCondition}
                  onChange={(e) => setSuccessCondition(e.target.value)}
                  placeholder="예: 포트폴리오 사이트 완성 및 배포" 
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Weekly Hours */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
          <h3 className="text-title-md text-on-surface font-bold">2. 기간 및 가용 시간</h3>
          
          {/* Quick Selection for Period */}
          <div className="space-y-2">
            <span className="block text-body-sm font-semibold text-on-surface-variant">기간 빠른 선택</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '1주', val: 7 },
                { label: '2주', val: 14 },
                { label: '30일', val: 30 },
                { label: '60일', val: 60 },
                { label: '3개월', m: 3 },
                { label: '6개월', m: 6 },
                { label: '1년', m: 12 },
              ].map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => opt.val ? handleQuickPeriod(opt.val) : handleQuickPeriodMonths(opt.m || 0)}
                  className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface hover:bg-primary-container/10 hover:border-primary transition-colors font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface-variant mb-1">시작일</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none" 
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface-variant mb-1">종료일 (최소 7일 이후)</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none" 
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-body-sm font-semibold text-on-surface mb-2">주당 가능 시간 (주당 가용 시간)</label>
            <div className="relative max-w-[200px]">
              <input 
                type="number" 
                min="1" 
                max="168"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-12 py-3 text-body-lg text-on-surface focus:border-primary focus:outline-none"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-on-surface-variant font-bold">시간</span>
            </div>
          </div>
        </div>

        {/* The Rhythm (5+1+1) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start flex-col sm:flex-row gap-2">
            <div>
              <h3 className="text-title-md text-on-surface font-bold">3. 주간 리듬 (5 수행 + 1 보완 + 1 휴식)</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">지속 가능하고 규칙적인 생활 흐름을 완성하세요. 중복 없이 딱 채워야 합니다.</p>
            </div>
            <div className="flex gap-2 text-xs font-semibold self-end">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> 5 수행</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> 1 보완</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-surface-variant border border-outline-variant"></span> 1 휴식</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mt-4">
            {Object.entries(schedule).map(([day, state]) => {
              const bg = state === 'action' ? 'bg-primary text-on-primary border-primary' : 
                         state === 'supplement' ? 'bg-secondary text-on-secondary border-secondary' : 
                         'bg-surface-variant text-on-surface-variant border-outline-variant';
              
              return (
                <button 
                  key={day}
                  type="button"
                  onClick={() => cycleSchedule(day)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors aspect-square active:scale-95 ${bg}`}
                >
                  <span className="text-label-caps opacity-90">{day}</span>
                  {state === 'action' && <Zap className="w-5 h-5 mt-1 animate-pulse" />}
                  {state === 'supplement' && <ListPlus className="w-5 h-5 mt-1" />}
                  {state === 'rest' && <Coffee className="w-5 h-5 mt-1" />}
                </button>
              );
            })}
          </div>
          <p className="text-body-sm text-on-surface-variant text-center mt-2 italic">요일 버튼을 클릭해 5수행, 1보완, 1휴식 구조를 고르게 맞춰주세요.</p>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          {/* Difficulty Slider */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-title-md text-on-surface font-bold mb-2">전체 목표 난이도</h3>
              <p className="text-body-sm text-on-surface-variant mb-6">사용자 본인의 현재 수준 기준 부담 난이도입니다.</p>
            </div>
            <div className="px-2">
              <div className="flex justify-between text-label-caps text-on-surface-variant mb-2">
                <span>쉬움</span>
                <span className="text-primary font-bold">{difficultyLabels[difficulty - 1]}</span>
                <span>어려움</span>
              </div>
              <input 
                type="range" 
                min="1" max="5" 
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer" 
              />
              <div className="flex justify-between mt-2 px-1">
                {[1,2,3,4,5].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>)}
              </div>
            </div>
          </div>

          {/* Success Threshold */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
            <h3 className="text-title-md text-on-surface font-bold mb-2">사이클 성공 기준</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">목표로 삼을 사이클(주간) 과제 성공 최소 완료율입니다.</p>
            <div className="grid grid-cols-2 gap-3">
              {[70, 80, 90, 100].map(val => (
                <div key={val} className="relative">
                  <input 
                    type="radio" 
                    name="threshold" 
                    id={`t${val}`} 
                    value={val} 
                    checked={successThreshold === val}
                    onChange={() => setSuccessThreshold(val)}
                    className="peer sr-only" 
                  />
                  <label htmlFor={`t${val}`} className="block text-center py-3 px-2 border border-outline-variant rounded-lg cursor-pointer text-title-md text-on-surface-variant hover:bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary transition-colors font-bold">
                    {val}%
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <ComingSoonButton 
          name="학교 및 기관 연결" 
          description="학교, 캠프 또는 부트캠프 기관의 미션 보드와 해당 목표를 직접 동기화하여 지도를 받습니다." 
          position="목표 설정 화면"
        >
          <div className="rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low p-6 text-center hover:bg-surface-container-high transition-colors">
            <GraduationCap className="text-on-surface-variant w-8 h-8 mx-auto mb-2" />
            <h3 className="text-title-md text-on-surface-variant font-bold mb-1">학교 및 기관 / 교수자·멘토 연결</h3>
            <p className="text-body-sm text-on-surface-variant opacity-80">Soon you'll be able to link this goal directly with mentors or specific programs for guided oversight.</p>
            <div className="mt-4 inline-block bg-surface-container px-3 py-1 rounded-full text-label-caps text-on-surface-variant font-bold border border-outline-variant/30">추가 예정</div>
          </div>
        </ComingSoonButton>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant">
          <button 
            type="button" 
            onClick={() => onNavigate?.('goal-list')}
            className="px-6 py-3 rounded-lg border border-outline-variant text-title-md text-on-surface hover:bg-surface-container-low transition-colors"
          >
            취소
          </button>
          <button 
            type="submit" 
            className="px-6 py-3 rounded-lg bg-primary text-on-primary text-title-md hover:bg-primary/95 transition-colors flex items-center justify-center gap-2 font-bold shadow-md"
          >
            다음 단계 (계획 설계)
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
