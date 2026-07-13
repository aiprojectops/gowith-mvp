import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environmental variables
// In local dev, look for .env.local first, then fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const app = express();
app.use(express.json());

// Initialize Google Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
} else {
  console.warn('WARNING: GEMINI_API_KEY env variable is not set. AI plan generation will fail.');
}

// API endpoint: Generate cycle plan using Gemini AI
app.post('/api/generate-plan', async (req, res) => {
  if (!aiClient) {
    return res.status(500).json({ error: 'Gemini AI 클라이언트가 초기화되지 않았습니다. GEMINI_API_KEY 환경변수를 확인하세요.' });
  }

  const { goal, performanceDates } = req.body;
  if (!goal || !performanceDates || !Array.isArray(performanceDates)) {
    return res.status(400).json({ error: '필수 매개변수(goal, performanceDates)가 누락되었습니다.' });
  }

  try {
    const datesStr = performanceDates.map(d => `${d.date} (${d.dayName}요일)`).join(', ');
    
    const prompt = `
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
1. 과제는 오직 위 ${performanceDates.length}개의 날짜(${performanceDates.map(d => d.date).join(', ')})에만 정확히 배정해야 합니다.
2. 각 날짜(수행일)당 배정할 수 있는 과제는 최대 2개 이하로 제한합니다.
3. 전체 사이클(5일 수행일 총합)의 과제 개수는 최대 10개 이하여야 합니다.
4. 과제별 난이도는 사용자가 설정한 전체 난이도(${goal.difficulty})를 초과할 수 없습니다. 즉, 모든 과제 난이도는 1부터 ${goal.difficulty} 사이여야 합니다.
5. 과제마다 예상 수행 시간(분 단위)과 구체적인 완료 기준을 작성하세요.
6. 모든 과제의 예상 수행 시간 총합은 사용자의 주당 가능 시간(${goal.weekly_hours}시간 = ${goal.weekly_hours * 60}분)을 절대 초과할 수 없으며, 보완일을 위해 주당 가능 시간의 최소 20%를 여유 시간으로 남겨야 합니다. (즉, 총합은 ${Math.round(goal.weekly_hours * 60 * 0.8)}분을 넘지 말 것)
7. 각 날짜마다 최소 1개의 과제는 반드시 포함되어야 합니다.

응답 형식은 아래 JSON 스키마를 만족해야 합니다.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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
                  scheduled_date: { type: 'STRING', description: '수행일 날짜 (YYYY-MM-DD 포맷)' },
                  title: { type: 'STRING', description: '과제명' },
                  difficulty: { type: 'INTEGER', description: '과제 난이도 (1-5 정수)' },
                  estimated_minutes: { type: 'INTEGER', description: '예상 수행 시간 (분 단위, 예: 30, 60, 90, 120)' },
                  completion_condition: { type: 'STRING', description: '이 과제가 완료되었음을 확인 가능한 구체적인 체크리스트 조건' }
                },
                required: ['scheduled_date', 'title', 'difficulty', 'estimated_minutes', 'completion_condition']
              }
            }
          },
          required: ['tasks']
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API로부터 응답을 받지 못했습니다.');
    }

    const result = JSON.parse(responseText);
    res.json(result);
  } catch (error: any) {
    console.error('Error generating AI plan:', error);
    res.status(500).json({ error: error.message || 'AI 계획 생성 실패' });
  }
});

// Configure Vite integration or static assets serving
const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function startServer() {
  if (!isProd) {
    // Development mode: integration with Vite Dev Server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production mode: serving built assets from dist
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port} in ${isProd ? 'production' : 'development'} mode.`);
  });
}

startServer();
