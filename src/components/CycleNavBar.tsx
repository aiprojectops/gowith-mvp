import React from 'react';
import { ViewState, Goal } from '../types';
import { addDays, getDayOfWeekString } from '../utils/storage';

interface CycleNavBarProps {
  goal: Goal;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  simulatedDayIndex: number;
  setSimulatedDayIndex: (idx: number) => void;
}

export function CycleNavBar({ goal, currentView, onNavigate, simulatedDayIndex, setSimulatedDayIndex }: CycleNavBarProps) {
  // Generate the 7 days of the cycle
  const days: { date: string; dayName: string; type: 'action' | 'supplement' | 'rest'; index?: number }[] = [];
  let actionIdx = 1;

  for (let i = 0; i < 7; i++) {
    const dStr = addDays(goal.start_date, i);
    const dayOfWeek = getDayOfWeekString(dStr);
    
    if (goal.performance_days.includes(dayOfWeek)) {
      days.push({ date: dStr, dayName: dayOfWeek, type: 'action', index: actionIdx++ });
    } else if (goal.supplement_day === dayOfWeek) {
      days.push({ date: dStr, dayName: dayOfWeek, type: 'supplement' });
    } else if (goal.rest_day === dayOfWeek) {
      days.push({ date: dStr, dayName: dayOfWeek, type: 'rest' });
    }
  }

  // Helper to translate day name
  const getKoreanDay = (dayName: string) => {
    const mapping: Record<string, string> = {
      Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일'
    };
    return mapping[dayName] || dayName;
  };

  return (
    <div className="flex gap-2 items-center mt-4 overflow-x-auto hide-scrollbar pb-2 w-full justify-center md:justify-start">
      {days.map((item, idx) => {
        const isPerformanceView = currentView === 'dashboard-performance';
        const isSupplementView = currentView === 'dashboard-supplement';
        const isRestView = currentView === 'dashboard-rest';

        let isActive = false;
        let bgClass = 'bg-surface-container text-on-surface-variant border border-outline-variant';
        let label = '';
        let typeLabel = '';

        if (item.type === 'action') {
          label = `D${item.index}`;
          typeLabel = `${getKoreanDay(item.dayName)} (${item.date.slice(5)})`;
          isActive = isPerformanceView && simulatedDayIndex === item.index;
          if (isActive) {
            bgClass = 'bg-primary text-on-primary shadow-md border-2 border-surface scale-105';
          }
        } else if (item.type === 'supplement') {
          label = '+1';
          typeLabel = '보완';
          isActive = isSupplementView;
          bgClass = isActive 
            ? 'bg-secondary text-on-secondary shadow-md border-2 border-surface scale-105'
            : 'bg-secondary-container/30 text-on-secondary-container border border-secondary/20 border-dashed';
        } else {
          label = 'R';
          typeLabel = '휴식';
          isActive = isRestView;
          bgClass = isActive
            ? 'bg-on-surface-variant text-surface shadow-md border-2 border-surface scale-105'
            : 'bg-surface-variant/40 text-on-surface-variant border border-outline-variant border-dashed';
        }

        const handleClick = () => {
          if (item.type === 'action') {
            setSimulatedDayIndex(item.index || 1);
            onNavigate('dashboard-performance');
          } else if (item.type === 'supplement') {
            onNavigate('dashboard-supplement');
          } else if (item.type === 'rest') {
            onNavigate('dashboard-rest');
          }
        };

        return (
          <React.Fragment key={idx}>
            <button 
              type="button"
              onClick={handleClick}
              className="flex flex-col items-center gap-1 min-w-[56px] focus:outline-none transition-all active:scale-95"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-label-caps font-bold transition-all ${bgClass}`}>
                {label}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-primary font-extrabold' : 'text-on-surface-variant opacity-70'}`}>
                {typeLabel}
              </span>
            </button>
            {idx < days.length - 1 && <div className="h-px w-3 bg-outline-variant flex-shrink-0"></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
