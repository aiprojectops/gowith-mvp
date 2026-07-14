// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();
var app = express();
app.use(express.json());
var geminiApiKey = process.env.GEMINI_API_KEY;
var aiClient = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
} else {
  console.warn("WARNING: GEMINI_API_KEY env variable is not set. AI plan generation will fail.");
}
app.post("/api/generate-plan", async (req, res) => {
  if (!aiClient) {
    return res.status(500).json({ error: "Gemini AI \uD074\uB77C\uC774\uC5B8\uD2B8\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. GEMINI_API_KEY \uD658\uACBD\uBCC0\uC218\uB97C \uD655\uC778\uD558\uC138\uC694." });
  }
  const { goal, performanceDates } = req.body;
  if (!goal || !performanceDates || !Array.isArray(performanceDates)) {
    return res.status(400).json({ error: "\uD544\uC218 \uB9E4\uAC1C\uBCC0\uC218(goal, performanceDates)\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  }
  try {
    const datesStr = performanceDates.map((d) => `${d.date} (${d.dayName}\uC694\uC77C)`).join(", ");
    const prompt = `
\uB2F9\uC2E0\uC740 \uBAA9\uD45C \uAD00\uB9AC \uC9C0\uC6D0 AI \uBE44\uC11C\uC785\uB2C8\uB2E4. \uC0AC\uC6A9\uC790\uC758 \uBAA9\uD45C \uC815\uBCF4\uB97C \uBC14\uD0D5\uC73C\uB85C \uD604\uC7AC 5\uC77C \uC218\uD589\uC77C\uC5D0 \uC54C\uB9DE\uC740 \uC77C\uC77C \uACFC\uC81C(\uD0DC\uC2A4\uD06C) \uACC4\uD68D\uC744 \uC218\uB9BD\uD574\uC57C \uD569\uB2C8\uB2E4.
\uB2E4\uC74C \uAE30\uD68D\uC11C \uC6D0\uCE59 \uBC0F \uC81C\uC57D \uC870\uAC74\uC744 \uC5C4\uACA9\uD558\uAC8C \uC801\uC6A9\uD558\uC5EC \uC0DD\uC131\uD574 \uC8FC\uC138\uC694.

[\uC0AC\uC6A9\uC790 \uBAA9\uD45C \uC815\uBCF4]
- \uBAA9\uD45C\uBA85: "${goal.title}"
- \uBAA9\uD45C \uC124\uBA85: "${goal.description || "\uC5C6\uC74C"}"
- \uBAA9\uD45C \uC218\uD589 \uC774\uC720: "${goal.goal_reason}"
- \uC131\uACF5 \uAE30\uC900: "${goal.success_condition}"
- \uD604\uC7AC \uC218\uC900: "${goal.current_level || "\uC5C6\uC74C"}"
- \uC804\uCCB4 \uBAA9\uD45C \uB09C\uC774\uB3C4: ${goal.difficulty}\uB2E8\uACC4 (1~5)
- \uC8FC\uB2F9 \uAC00\uB2A5 \uC2DC\uAC04: ${goal.weekly_hours}\uC2DC\uAC04

[\uC0DD\uC131 \uB300\uC0C1 \uC218\uD589\uC77C \uB0A0\uC9DC]
\uC544\uB798 \uBA85\uC2DC\uB41C 5\uAC1C\uC758 \uB0A0\uC9DC\uC5D0\uB9CC \uAC01\uAC01 \uACFC\uC81C\uB97C \uBC30\uC815\uD574\uC57C \uD569\uB2C8\uB2E4. \uBCF4\uC644\uC77C\uACFC \uD734\uC2DD\uC77C\uC740 \uC0DD\uC131 \uB300\uC0C1\uC5D0\uC11C \uC81C\uC678\uB429\uB2C8\uB2E4.
\uB0A0\uC9DC \uBAA9\uB85D: ${datesStr}

[\uC5C4\uACA9\uD55C \uC81C\uC57D \uC870\uAC74]
1. \uACFC\uC81C\uB294 \uC624\uC9C1 \uC704 ${performanceDates.length}\uAC1C\uC758 \uB0A0\uC9DC(${performanceDates.map((d) => d.date).join(", ")})\uC5D0\uB9CC \uC815\uD655\uD788 \uBC30\uC815\uD574\uC57C \uD569\uB2C8\uB2E4.
2. \uAC01 \uB0A0\uC9DC(\uC218\uD589\uC77C)\uB2F9 \uBC30\uC815\uD560 \uC218 \uC788\uB294 \uACFC\uC81C\uB294 \uCD5C\uB300 2\uAC1C \uC774\uD558\uB85C \uC81C\uD55C\uD569\uB2C8\uB2E4.
3. \uC804\uCCB4 \uC0AC\uC774\uD074(5\uC77C \uC218\uD589\uC77C \uCD1D\uD569)\uC758 \uACFC\uC81C \uAC1C\uC218\uB294 \uCD5C\uB300 10\uAC1C \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.
4. \uACFC\uC81C\uBCC4 \uB09C\uC774\uB3C4\uB294 \uC0AC\uC6A9\uC790\uAC00 \uC124\uC815\uD55C \uC804\uCCB4 \uB09C\uC774\uB3C4(${goal.difficulty})\uB97C \uCD08\uACFC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC989, \uBAA8\uB4E0 \uACFC\uC81C \uB09C\uC774\uB3C4\uB294 1\uBD80\uD130 ${goal.difficulty} \uC0AC\uC774\uC5EC\uC57C \uD569\uB2C8\uB2E4.
5. \uACFC\uC81C\uB9C8\uB2E4 \uC608\uC0C1 \uC218\uD589 \uC2DC\uAC04(\uBD84 \uB2E8\uC704)\uACFC \uAD6C\uCCB4\uC801\uC778 \uC644\uB8CC \uAE30\uC900\uC744 \uC791\uC131\uD558\uC138\uC694.
6. \uBAA8\uB4E0 \uACFC\uC81C\uC758 \uC608\uC0C1 \uC218\uD589 \uC2DC\uAC04 \uCD1D\uD569\uC740 \uC0AC\uC6A9\uC790\uC758 \uC8FC\uB2F9 \uAC00\uB2A5 \uC2DC\uAC04(${goal.weekly_hours}\uC2DC\uAC04 = ${goal.weekly_hours * 60}\uBD84)\uC744 \uC808\uB300 \uCD08\uACFC\uD560 \uC218 \uC5C6\uC73C\uBA70, \uBCF4\uC644\uC77C\uC744 \uC704\uD574 \uC8FC\uB2F9 \uAC00\uB2A5 \uC2DC\uAC04\uC758 \uCD5C\uC18C 20%\uB97C \uC5EC\uC720 \uC2DC\uAC04\uC73C\uB85C \uB0A8\uACA8\uC57C \uD569\uB2C8\uB2E4. (\uC989, \uCD1D\uD569\uC740 ${Math.round(goal.weekly_hours * 60 * 0.8)}\uBD84\uC744 \uB118\uC9C0 \uB9D0 \uAC83)
7. \uAC01 \uB0A0\uC9DC\uB9C8\uB2E4 \uCD5C\uC18C 1\uAC1C\uC758 \uACFC\uC81C\uB294 \uBC18\uB4DC\uC2DC \uD3EC\uD568\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.

\uC751\uB2F5 \uD615\uC2DD\uC740 \uC544\uB798 JSON \uC2A4\uD0A4\uB9C8\uB97C \uB9CC\uC871\uD574\uC57C \uD569\uB2C8\uB2E4.
    `;
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            tasks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  scheduled_date: { type: "STRING", description: "\uC218\uD589\uC77C \uB0A0\uC9DC (YYYY-MM-DD \uD3EC\uB9F7)" },
                  title: { type: "STRING", description: "\uACFC\uC81C\uBA85" },
                  difficulty: { type: "INTEGER", description: "\uACFC\uC81C \uB09C\uC774\uB3C4 (1-5 \uC815\uC218)" },
                  estimated_minutes: { type: "INTEGER", description: "\uC608\uC0C1 \uC218\uD589 \uC2DC\uAC04 (\uBD84 \uB2E8\uC704, \uC608: 30, 60, 90, 120)" },
                  completion_condition: { type: "STRING", description: "\uC774 \uACFC\uC81C\uAC00 \uC644\uB8CC\uB418\uC5C8\uC74C\uC744 \uD655\uC778 \uAC00\uB2A5\uD55C \uAD6C\uCCB4\uC801\uC778 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uC870\uAC74" }
                },
                required: ["scheduled_date", "title", "difficulty", "estimated_minutes", "completion_condition"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });
    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gemini API\uB85C\uBD80\uD130 \uC751\uB2F5\uC744 \uBC1B\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    }
    const result = JSON.parse(responseText);
    res.json(result);
  } catch (error) {
    console.error("Error generating AI plan:", error);
    res.status(500).json({ error: error.message || "AI \uACC4\uD68D \uC0DD\uC131 \uC2E4\uD328" });
  }
});
var isProd = process.env.NODE_ENV === "production";
var port = process.env.PORT || 3e3;
async function startServer() {
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), "dist")));
    app.use("*", (req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  }
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port} in ${isProd ? "production" : "development"} mode.`);
  });
}
startServer();
