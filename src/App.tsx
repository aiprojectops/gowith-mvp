import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { Layout } from './components/Layout';
import { GoalListView } from './views/GoalListView';
import { SetupView } from './views/SetupView';
import { PerformanceView } from './views/Dashboard/PerformanceView';
import { SupplementView } from './views/Dashboard/SupplementView';
import { RestView } from './views/Dashboard/RestView';
import { PlanView } from './views/PlanView';
import { ResultView } from './views/ResultView';
import { getGoals } from './utils/storage';

export default function App() {
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('goal-list');
  const [simulatedDayIndex, setSimulatedDayIndex] = useState<number>(1);
  const [showDevMenu, setShowDevMenu] = useState(false);

  useEffect(() => {
    // Check if there is an active goal in LocalStorage
    const goals = getGoals();
    const activeGoal = goals.find(g => g.status === 'active');
    if (activeGoal) {
      setCurrentGoalId(activeGoal.id);
      setCurrentView('dashboard-performance');
    } else {
      setCurrentView('goal-list');
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'goal-list':
        return <GoalListView onNavigate={setCurrentView} setCurrentGoalId={setCurrentGoalId} />;
      case 'setup': 
        return <SetupView onNavigate={setCurrentView} setCurrentGoalId={setCurrentGoalId} />;
      case 'dashboard-performance': 
        return (
          <PerformanceView 
            onNavigate={setCurrentView} 
            currentGoalId={currentGoalId} 
            simulatedDayIndex={simulatedDayIndex}
            setSimulatedDayIndex={setSimulatedDayIndex}
          />
        );
      case 'dashboard-supplement': 
        return (
          <SupplementView 
            onNavigate={setCurrentView} 
            currentGoalId={currentGoalId} 
            simulatedDayIndex={simulatedDayIndex}
            setSimulatedDayIndex={setSimulatedDayIndex}
          />
        );
      case 'dashboard-rest': 
        return (
          <RestView 
            onNavigate={setCurrentView} 
            currentGoalId={currentGoalId} 
            simulatedDayIndex={simulatedDayIndex}
            setSimulatedDayIndex={setSimulatedDayIndex}
          />
        );
      case 'plan': 
        return <PlanView onNavigate={setCurrentView} currentGoalId={currentGoalId} />;
      case 'result': 
        return <ResultView onNavigate={setCurrentView} currentGoalId={currentGoalId} />;
      default: 
        return <GoalListView onNavigate={setCurrentView} setCurrentGoalId={setCurrentGoalId} />;
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView}
        hideNav={currentView === 'setup' || currentView === 'goal-list'}
      >
        {renderView()}
      </Layout>

      {/* Development Navigation Menu */}
      <div className="fixed bottom-32 md:bottom-8 left-4 z-[100]">
        {showDevMenu && (
          <div className="bg-surface border border-outline-variant p-4 rounded-xl shadow-xl mb-4 flex flex-col gap-2 min-w-[200px]">
            <p className="text-label-caps text-outline font-bold uppercase mb-2">Dev: Switch View</p>
            <button onClick={() => { setCurrentView('goal-list'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">0. 시작화면 및 목록 (Home)</button>
            <button onClick={() => { setCurrentView('setup'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">1. 목표 설정 (Setup)</button>
            <button onClick={() => { setCurrentView('dashboard-performance'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">2. 대시보드 (수행일)</button>
            <button onClick={() => { setCurrentView('dashboard-supplement'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">3. 대시보드 (보완일)</button>
            <button onClick={() => { setCurrentView('dashboard-rest'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">4. 대시보드 (휴식일)</button>
            <button onClick={() => { setCurrentView('plan'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">5. 로드맵/계획 (Plan)</button>
            <button onClick={() => { setCurrentView('result'); setShowDevMenu(false); }} className="text-left text-body-sm hover:text-primary">6. 사이클 결과 (Result)</button>
          </div>
        )}
        <button 
          onClick={() => setShowDevMenu(!showDevMenu)}
          className="bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full text-label-caps shadow-lg hover:opacity-90 font-bold"
        >
          {showDevMenu ? 'Close Dev Menu' : 'Dev Menu'}
        </button>
      </div>
    </>
  );
}
