import templates from "../_fixtures/templates.json";
import analysis from "../_fixtures/analysis.json";
import schedule from "../_fixtures/schedule.json";
import validation from "../_fixtures/validation.json";
import learning from "../_fixtures/learning.json";
import journey from "../_fixtures/journey.json";
import type { Template, AnalysisResult, SchedulePlan, ValidationMetrics, LearningVersion, JourneyStep, ScriptDoc, Prediction } from "../_types";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const SandboxServices = {
  async listTemplates(niche?: string, goal?: string): Promise<Template[]> {
    await delay(200);
    const list = templates as Template[];
    return list.filter((t) => (!niche || t.niche === niche) && (!goal || t.goal === goal));
  },
  async getAnalysis(script: ScriptDoc): Promise<AnalysisResult> {
    await delay(250);
    const base = analysis as AnalysisResult;
    const passed = (base.score ?? 0) >= 0.85;
    return { ...base, passed };
  },
  async mutateScriptApplyAllFixes(script: ScriptDoc): Promise<ScriptDoc> {
    await delay(150);
    const body = (script.body || "").replace(/\s+/g, " ").trim();
    return { ...script, body: body ? body : "Optimized script with concise CTA." };
  },
  async getSchedulePlan(): Promise<SchedulePlan> {
    await delay(150);
    return schedule as SchedulePlan;
  },
  async getValidationMetrics(): Promise<ValidationMetrics> {
    await delay(180);
    return validation as ValidationMetrics;
  },
  async getLearningVersions(): Promise<LearningVersion[]> {
    await delay(120);
    return learning as LearningVersion[];
  },
  async getJourney(): Promise<JourneyStep[]> {
    await delay(120);
    return journey as JourneyStep[];
  },
  async savePredictionReceipt(pred: Prediction): Promise<boolean> {
    await delay(80);
    try {
      const key = "sandboxUser.receipts";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(pred);
      localStorage.setItem(key, JSON.stringify(existing));
      return true;
    } catch {
      return false;
    }
  },
};


