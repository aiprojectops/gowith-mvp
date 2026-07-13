import React from 'react';
import { Plus, FolderKanban, CheckCircle, Calendar, Sparkles, Award, ArrowRight, UserPlus, LogIn, Coins } from 'lucide-react';
import { ViewProps, Goal } from '../types';
import { getGoals, getTasks } from '../utils/storage';
import { ComingSoonButton } from '../components/ComingSoonModal';

export function GoalListView({ onNavigate, setCurrentGoalId }: ViewProps) {
  const goals = getGoals();
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed' || g.status === 'failed');

  const handleResumeGoal = (goalId: string) => {
    if (setCurrentGoalId) {
      setCurrentGoalId(goalId);
    }
    // Determine active day in cycle to navigate to performance view
    onNavigate?.('dashboard-performance');
  };

  return (
    <div className="w-full px-margin-mobile md:px-gutter py-stack-lg flex flex-col gap-stack-lg pb-32">
      {/* Top Banner with Login / Signup (Coming Soon) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 gap-4">
        <div>
          <h2 className="text-body-lg font-bold text-on-surface">더 체계적으로 목표를 관리해보세요</h2>
          <p className="text-body-sm text-on-surface-variant">계정을 연동하면 여러 기기에서 동기화할 수 있습니다.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ComingSoonButton 
            name="회원가입" 
            description="이메일 또는 휴대폰 번호로 새로운 Gowith 계정을 생성합니다." 
            position="시작 화면 상단"
            className="flex-1 sm:flex-none"
          >
            <div className="flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-xl bg-white hover:bg-surface-container-lowest transition-colors text-body-sm font-semibold text-on-surface">
              <UserPlus className="w-4 h-4" />
              회원가입
            </div>
          </ComingSoonButton>
          <ComingSoonButton 
            name="소셜 로그인" 
            description="구글, 카카오, 네이버 등 소셜 계정으로 빠르고 안전하게 로그인합니다." 
            position="시작 화면 로그인 영역"
            className="flex-1 sm:flex-none"
          >
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl hover:bg-primary/95 transition-colors text-body-sm font-semibold">
              <LogIn className="w-4 h-4" />
              소셜 로그인
            </div>
          </ComingSoonButton>
        </div>
      </div>

      {/* Main Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-headline-lg md:text-display-lg text-on-surface font-bold mb-1">내 목표 리스트</h1>
          <p className="text-body-lg text-on-surface-variant">나만의 5+1+1 리듬으로 목표를 끝까지 달성하세요.</p>
        </div>
        <button 
          onClick={() => onNavigate?.('setup')}
          className="bg-primary text-on-primary px-5 py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">새 목표 만들기</span>
        </button>
      </div>

      {/* Grid Layout: Goals & Mileage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Goals Lists */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Ongoing Goals */}
          <section className="space-y-4">
            <h2 className="text-title-md text-on-surface flex items-center gap-2">
              <FolderKanban className="text-primary w-5 h-5" />
              <span>진행 중인 목표 ({activeGoals.length})</span>
            </h2>

            {activeGoals.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-outline-variant/50 rounded-2xl p-12 text-center">
                <Sparkles className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                <p className="text-body-lg font-bold text-on-surface mb-2">등록된 목표가 없습니다</p>
                <p className="text-body-sm text-on-surface-variant mb-6">새로운 목표와 5+1+1 리듬을 설정하고 시작해보세요.</p>
                <button 
                  onClick={() => onNavigate?.('setup')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  첫 목표 만들기
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map(goal => {
                  const tasks = getTasks(goal.id);
                  const completedCount = tasks.filter(t => t.status === 'completed').length;
                  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
                  
                  // Calculate days remaining
                  const today = new Date();
                  const end = new Date(goal.end_date);
                  const timeDiff = end.getTime() - today.getTime();
                  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

                  return (
                    <div 
                      key={goal.id}
                      onClick={() => handleResumeGoal(goal.id)}
                      className="bg-white border border-outline-variant/30 hover:border-primary/50 hover:shadow-lg transition-all rounded-2xl p-5 cursor-pointer flex flex-col gap-4 group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-label-caps bg-primary-container/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
                            난이도 {goal.difficulty}단계
                          </span>
                          <h3 className="text-title-md text-on-surface font-bold mt-2 group-hover:text-primary transition-colors">
                            {goal.title}
                          </h3>
                        </div>
                        <span className="text-body-sm font-semibold text-primary bg-primary-container/10 px-2 py-1 rounded-lg">
                          D-{daysRemaining}
                        </span>
                      </div>
                      
                      <p className="text-body-sm text-on-surface-variant line-clamp-2">
                        {goal.description}
                      </p>

                      <div className="mt-auto pt-2 space-y-2">
                        <div className="flex justify-between text-body-sm">
                          <span className="text-on-surface-variant font-medium">과제 달성</span>
                          <span className="text-on-surface font-bold">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed Goals */}
          <section className="space-y-4">
            <h2 className="text-title-md text-on-surface-variant flex items-center gap-2">
              <CheckCircle className="text-secondary w-5 h-5" />
              <span>완료한 목표 ({completedGoals.length})</span>
            </h2>

            {completedGoals.length === 0 ? (
              <div className="bg-surface-container-low/40 border border-outline-variant/20 rounded-2xl p-8 text-center text-on-surface-variant text-body-sm">
                완료 또는 종료된 목표가 여기에 표시됩니다.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {completedGoals.map(goal => (
                  <div 
                    key={goal.id}
                    className="bg-white border border-outline-variant/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-body-lg font-bold text-on-surface">{goal.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${goal.status === 'completed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                          {goal.status === 'completed' ? '성공' : '미흡'}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-1">성공 기준: {goal.success_condition}</p>
                    </div>
                    <button 
                      onClick={() => handleResumeGoal(goal.id)}
                      className="text-body-sm text-primary font-bold hover:underline flex items-center gap-1 active:scale-95 whitespace-nowrap"
                    >
                      결과 리포트 보기
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right 1 Column: Today's Status & Mileage */}
        <div className="space-y-6">
          
          {/* Today's status block */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-title-md text-on-surface font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-primary w-5 h-5" />
              오늘의 상태
            </h3>
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30">
                  <span className="text-label-caps text-on-surface-variant block">진행 중인 목표</span>
                  <span className="text-body-lg font-bold text-primary block mt-1">{activeGoals[0].title}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-surface-container/50 rounded-xl p-3 text-center">
                    <span className="text-label-caps text-on-surface-variant block">오늘 요일</span>
                    <span className="text-body-lg font-bold text-on-surface block mt-1">
                      {['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()]}요일
                    </span>
                  </div>
                  <button 
                    onClick={() => handleResumeGoal(activeGoals[0].id)}
                    className="flex-1 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/95 transition-all text-body-sm active:scale-95"
                  >
                    대시보드 이동
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant">활성화된 목표가 없습니다. 새 목표를 만들어 시작해보세요!</p>
            )}
          </div>

          {/* Mileage / Reward box (Coming Soon) */}
          <ComingSoonButton
            name="마일리지"
            description="목표 수행 및 완료에 따라 적립되는 보상 포인트로, 다양한 혜택과 상점에서 교환할 수 있습니다."
            position="시작 화면 우측 프로필/마일리지 영역"
          >
            <div className="bg-gradient-to-br from-secondary/10 to-primary/5 border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex items-center justify-between group">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-secondary">
                  <Coins className="w-5 h-5" />
                  <span className="text-label-caps font-bold">마일리지 포인트</span>
                </div>
                <span className="text-2xl font-bold text-on-surface block">150 P</span>
                <span className="text-xs text-on-surface-variant">목표 성공 달성 보너스 적립 완료</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </ComingSoonButton>

        </div>

      </div>
    </div>
  );
}
