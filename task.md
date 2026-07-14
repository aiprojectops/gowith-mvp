# AI 상세 가이드 생성 및 대시보드 체크리스트 연동 작업 목록

- `[x]` **1. 데이터 모델 확장**
  - [x] `src/types.ts`에 `SubTask` 인터페이스 추가 및 `Task` 인터페이스 확장 (`sub_tasks?: SubTask[]`)
- `[x]` **2. 5일 계획 화면(PlanView.tsx) UI/UX 구현**
  - [x] 각 과제 카드에 "AI 상세" 생성 버튼 추가 (Sparkles 아이콘 활용)
  - [x] 클릭 시 개별 과제용 Gemini API 호출 기능 추가 (주어진 과제명과 완료조건을 기반으로 구조화된 sub-task 3~5개 생성)
  - [x] 생성된 sub-tasks 데이터를 해당 과제에 바인딩하여 LocalStorage에 저장
  - [x] 이미 상세 가이드가 존재하는 과제에는 "가이드 수립 완료 (N개)" 텍스트 및 배지 시각화
- `[x]` **3. 대시보드 수행 화면(PerformanceView.tsx) 연동**
  - [x] 체크박스 클릭 시, `sub_tasks`가 존재하는 경우 일반 완료 창 대신 "상세 과제 체크리스트 모달" 오픈
  - [x] 체크리스트 모달 내에서 개별 서브 태스크 완료 상태 변경 및 LocalStorage 저장 연동
  - [x] 서브 태스크 진행률 바(0~100%) 실시간 렌더링
  - [x] 100% 완료 상태가 되었을 때에만 최종 회고 메모 및 결과물 링크/인풋 등록 활성화
- `[ ]` **4. 빌드 및 동작 검증**
  - [ ] 클라이언트 사이드 빌드 검증 (`npm run build`)
  - [ ] Firebase Hosting 최종 배포 (`firebase deploy`)
- `[ ]` **5. Walkthrough 문서 작성 및 최종 보고**
