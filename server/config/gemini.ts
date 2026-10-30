import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const GEMINI_MODELS = {
  // Using recommended stable text models
  TEXT_FAST: 'gemini-2.5-flash',
  TEXT_PRO: 'gemini-2.5-pro',
  EMBEDDINGS: 'text-embedding-004',
};

// Structured Schema for Paper Knowledge Extraction
export const extractionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    paperTitle: { type: Type.STRING },
    methodology: {
      type: Type.STRING,
      description: 'Research methodology used (e.g. Double-blind RCT, Transformer Benchmark, Meta-Analysis, Qualitative Case Study, Observational Cohort)',
    },
    sampleSize: {
      type: Type.STRING,
      description: 'Sample size, dataset volume, or participant count analyzed (e.g. N = 1,420 patients, 100M tokens, 45 studies)',
    },
    primaryDomain: {
      type: Type.STRING,
      description: 'Primary domain (Medical & Healthcare, Artificial Intelligence & Computer Science, Climate & Environmental Science, Finance & Macroeconomics, Social Sciences & Humanities)',
    },
    keyFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of primary empirical findings with quantifiable metrics where available',
    },
    limitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Stated or implicit research limitations, confounding variables, or generalizability constraints',
    },
    practicalImplications: {
      type: Type.STRING,
      description: 'Actionable real-world takeaways, enterprise impacts, or clinical/technical applications',
    },
  },
  required: ['paperTitle', 'methodology', 'keyFindings', 'limitations'],
};

// System prompt strictly adhering to section 14 of master spec
export const RESEARCHPULSE_SYSTEM_PROMPT = `You are ResearchPulse AI, an elite academic research assistant and evidence-based knowledge synthesis engine.

YOUR CORE GOALS:
1. Provide highly accurate, objective, and deeply analytical answers strictly grounded in the provided research context chunks.
2. Every factual statement or claim MUST be directly attributed to a source using numeric brackets matching the context index (e.g., [Doc Title, Chunk #]).
3. If the provided context does not contain sufficient information to answer the user's question, explicitly state: "The provided research documents do not contain enough evidence to answer this question." Do not extrapolate or fabricate information outside the provided text.
4. Maintain a formal, academic tone suited for literature reviews and peer-reviewed research analysis.`;
