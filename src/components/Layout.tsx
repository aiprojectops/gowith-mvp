import React from 'react';
import { User, Settings, LayoutDashboard, CalendarDays, BarChart2, Home } from 'lucide-react';
import { ViewState } from '../types';
import { ComingSoonButton } from './ComingSoonModal';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  hideNav?: boolean;
}

export function Layout({ children, currentView, onNavigate, hideNav = false }: LayoutProps) {
  const isDashboard = currentView.startsWith('dashboard');

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 relative">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-margin-mobile h-16 w-full z-50 bg-surface sticky top-0 md:px-gutter max-w-container-max mx-auto border-b border-surface-variant/30 md:border-none">
        <button 
          onClick={() => onNavigate('goal-list')}
          className="flex items-center gap-4 text-left active:scale-95 transition-transform focus:outline-none"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center">
            <Home className="text-primary w-5 h-5" />
          </div>
          <span className="text-headline-lg-mobile md:text-headline-lg font-bold text-primary">Gowith</span>
        </button>
        
        {!hideNav && (
          <nav className="hidden md:flex items-center gap-8 font-semibold">
            <button 
              onClick={() => onNavigate('goal-list')}
              className={`font-title-md px-4 py-2 rounded-lg transition-colors ${currentView === 'goal-list' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              목록 홈
            </button>
            <button 
              onClick={() => onNavigate('dashboard-performance')}
              className={`font-title-md px-4 py-2 rounded-lg transition-colors ${isDashboard ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              대시보드
            </button>
            <button 
              onClick={() => onNavigate('plan')}
              className={`font-title-md px-4 py-2 rounded-lg transition-colors ${currentView === 'plan' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              계획
            </button>
            <button 
              onClick={() => onNavigate('result')}
              className={`font-title-md px-4 py-2 rounded-lg transition-colors ${currentView === 'result' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              결과
            </button>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isDashboard && (
            <ComingSoonButton 
              name="소셜 네트워킹 및 피드" 
              description="다른 유저의 목표 진행률 피드를 공유받고 실시간 응원 이모지를 전송합니다." 
              position="상단 앱바"
            >
              <span className="hidden md:inline-block bg-primary-container/10 text-primary text-[10px] px-3 py-1.5 rounded-full font-bold border border-primary/20">
                Coming Soon: Social
              </span>
            </ComingSoonButton>
          )}
          
          <ComingSoonButton 
            name="시스템 설정" 
            description="다크 모드 활성화, 알림 수신 주기 설정 및 저장된 데이터를 초기화할 수 있는 세부 설정 메뉴입니다." 
            position="상단 앱바 우측"
          >
            <div className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-primary">
              <Settings className="w-6 h-6" />
            </div>
          </ComingSoonButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto flex flex-col">
        {children}
      </main>

      {/* BottomNavBar (Mobile Only) */}
      {!hideNav && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface rounded-t-xl border-t border-outline-variant/20 shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => onNavigate('goal-list')}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-150 active:scale-90 ${currentView === 'goal-list' ? 'bg-primary-container text-on-primary-container rounded-full' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">목록 홈</span>
          </button>
          <button 
            onClick={() => onNavigate('dashboard-performance')}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-150 active:scale-90 ${isDashboard ? 'bg-primary-container text-on-primary-container rounded-full' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <LayoutDashboard className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">대시보드</span>
          </button>
          <button 
            onClick={() => onNavigate('plan')}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-150 active:scale-90 ${currentView === 'plan' ? 'bg-primary-container text-on-primary-container rounded-full' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <CalendarDays className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">계획</span>
          </button>
          <button 
            onClick={() => onNavigate('result')}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-150 active:scale-90 ${currentView === 'result' ? 'bg-primary-container text-on-primary-container rounded-full' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <BarChart2 className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">결과</span>
          </button>
        </nav>
      )}
    </div>
  );
}
