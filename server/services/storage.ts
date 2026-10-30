import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool, isPostgresAvailable } from '../config/db.ts';
import { cosineSimilarity, batchGenerateEmbeddings } from '../utils/textChunker.ts';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  authors: string;
  publication_date: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  status: 'pending' | 'processing' | 'indexed' | 'error';
  summary: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  workspace_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  embedding: number[];
  created_at: string;
}

export interface Extraction {
  id: string;
  document_id: string;
  workspace_id: string;
  paper_title?: string;
  methodology: string;
  sample_size: string;
  key_findings: string[];
  limitations: string[];
  extracted_data: Record<string, any>;
  created_at: string;
}

export interface SynthesisSession {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations: Array<{
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    snippet: string;
    similarity?: number;
  }>;
  created_at: string;
}

export interface DatabaseState {
  users: User[];
  workspaces: Workspace[];
  documents: Document[];
  document_chunks: DocumentChunk[];
  extractions: Extraction[];
  synthesis_sessions: SynthesisSession[];
  chat_messages: ChatMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'researchpulse_store.json');

// In-Memory state for instant sub-millisecond response & fallback persistence
let state: DatabaseState = {
  users: [],
  workspaces: [],
  documents: [],
  document_chunks: [],
  extractions: [],
  synthesis_sessions: [],
  chat_messages: [],
};

// Initialize file store
function saveStateToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store state to disk:', err);
  }
}

function loadStateFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      console.log(`Loaded store from disk: ${state.workspaces.length} workspaces, ${state.documents.length} docs, ${state.document_chunks.length} chunks.`);
    }
  } catch (err) {
    console.warn('Could not read existing store from disk, will seed default data:', err);
  }
}

// Seed realistic enterprise research workspaces & academic literature
export async function seedInitialResearchData() {
  loadStateFromDisk();

  // Always make sure default user exists
  let adminUser = state.users.find((u) => u.email === 'researcher@pulse.ai');
  const demoPasswordHash = bcrypt.hashSync('ResearchPulse2025!', 10);

  if (!adminUser) {
    adminUser = {
      id: 'e81a8f5b-6b74-4b52-9b21-4f9e15998a01',
      email: 'researcher@pulse.ai',
      password_hash: demoPasswordHash,
      full_name: 'Dr. Elena Vance, Senior AI Scientist',
      role: 'Principal Investigator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.users.push(adminUser);
  }

  // Check if workspaces exist for adminUser
  const existingWorkspaces = state.workspaces.filter((w) => w.user_id === adminUser!.id);
  if (existingWorkspaces.length === 0) {
    console.log('Seeding initial ResearchPulse academic workspaces and indexed literature...');

    const ws1Id = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const ws2Id = 'a12c4e6f-8d9e-4f1a-b2c3-d4e5f6a7b8c9';
    const ws3Id = 'f7e6d5c4-b3a2-41f0-9e8d-7c6b5a4f3e2d';

    state.workspaces.push(
      {
        id: ws1Id,
        user_id: adminUser.id,
        name: 'Clinical AI & Diagnostic Efficacy',
        description: 'Multi-center randomized controlled trials and deep neural network diagnostics in oncology and cardiology.',
        domain: 'Medical & Healthcare',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: ws2Id,
        user_id: adminUser.id,
        name: 'LLM Reasoning & Neural Retrieval Systems',
        description: 'Architectures for Dense Retrieval, RAG Hallucination Mitigation, and Multi-Agent Reasoning Protocols.',
        domain: 'Artificial Intelligence & Computer Science',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: ws3Id,
        user_id: adminUser.id,
        name: 'Global Decarbonization & Grid Resilience',
        description: 'Empirical modeling of renewable microgrids, battery degradation chemistry, and carbon sink dynamics.',
        domain: 'Climate & Environmental Science',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    // Seed Documents for ws1 (Medical)
    const doc1Id = '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d';
    const doc2Id = '3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e';

    const doc1Content = [
      `Title: Multi-Center Evaluation of Deep Residual Networks for Early Pancreatic Adenocarcinoma Detection on Contrast-Enhanced CT`,
      `Authors: Vance, E., Zhang, K., Holst, M., et al. (Journal of Clinical Oncology & Radiology, 2025)`,
      `Background: Pancreatic ductal adenocarcinoma (PDAC) carries a 5-year survival rate below 11%, primarily due to late-stage presentation. Subtle hypoattenuating lesions under 15mm are routinely missed on standard triphasic computed tomography (CT).`,
      `Methods: We conducted a blinded, multi-institutional diagnostic trial across 4 tertiary academic medical centers analyzing N = 2,840 abdominal CT scans (1,420 biopsy-confirmed PDAC cases, 1,420 matched healthy controls). The proposed architecture, ResNet-3D-Onco, incorporates multi-phase attention gating with voxel-wise feature pyramid networks.`,
      `Results: ResNet-3D-Onco achieved an area under the receiver operating characteristic curve (AUROC) of 0.962 (95% CI: 0.951-0.973) across the independent external test cohort. For micro-tumors (< 12mm), sensitivity was 89.4% compared to 64.2% for expert abdominal sub-specialist radiologists (p < 0.001). False positive rate was 3.1% in the high-risk pancreatitis subset.`,
      `Limitations: Retrospective design of external validation cohorts; reliance on intravenous iodinated contrast timing; reduced sensitivity in severe chronic pancreatitis calcification backgrounds.`,
      `Conclusions: Automated 3D deep attention models significantly outperform standard clinical triage for sub-centimeter pancreatic neoplasms, enabling surgical candidacy in 28% more patients.`,
    ];

    const doc2Content = [
      `Title: Comparative Trial of Glucagon-Like Peptide-1 (GLP-1) Receptor Agonists vs Dual GIP/GLP-1 in Cardiovascular Outcomes in Diabetic Cardiomyopathy`,
      `Authors: Al-Mansoor, S., Patel, R. K., Sterling, H. (The Lancet Diabetes & Endocrinology, 2024)`,
      `Background: Heart failure with preserved ejection fraction (HFpEF) remains refractory to conventional neurohormonal blockade in patients with type 2 diabetes mellitus and metabolic syndrome.`,
      `Methods: A double-blind, randomized, active-comparator phase 3 trial enrolled N = 1,850 participants with HbA1c > 8.0% and left ventricular diastolic dysfunction (E/e' > 14). Patients were randomized 1:1 to Tirzepatide (15mg subcutaneous weekly) or Semaglutide (2.4mg subcutaneous weekly) for 52 weeks.`,
      `Primary Endpoints: Change in 6-minute walk distance (6MWD) from baseline and reduction in NT-proBNP plasma concentrations at 52 weeks.`,
      `Results: Dual GIP/GLP-1 agonism demonstrated superior improvement in 6MWD (+48.2 meters vs +27.6 meters, p = 0.002) and a 38.4% mean reduction in NT-proBNP compared to 24.1% with selective GLP-1 agonism (difference -14.3%, p < 0.001). Left ventricular mass index decreased by 12.4 g/m² in the dual agonist arm vs 6.8 g/m² (p = 0.01).`,
      `Adverse Events: Gastrointestinal adverse events occurred in 41.2% (Tirzepatide) vs 38.9% (Semaglutide), primarily transient mild nausea during titration. Discontinuation rates were 4.8% and 5.1% respectively.`,
      `Limitations: 1-year follow-up limits definitive assessment of hard mortality endpoints; participants were predominantly non-Hispanic White and Asian demographics.`,
    ];

    // Seed Documents for ws2 (AI)
    const doc3Id = '4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f';
    const doc4Id = '5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a';

    const doc3Content = [
      `Title: Hybrid Dense-Sparse Vector Retrieval with Learned Late Interaction: Eliminating Hallucinations in Enterprise RAG Systems`,
      `Authors: Chen, L., Thorne, B., & Gupta, A. (ACM Transactions on Information Systems, 2025)`,
      `Abstract: Retrieval-Augmented Generation (RAG) often fails when queries contain exact product SKUs, alphanumeric constraints, or subtle negations. Dense semantic embeddings alone suffer from lexical blindness, while BM25 lacks semantic generalization.`,
      `Architecture: We introduce PulseRank-v2, a unified dual-encoder network that combines 768-dimensional dense vector projections with dynamic token-level ColBERT late-interaction scoring and BM25 inverted index re-weighting.`,
      `Experiments: Benchmarking across 5 enterprise question-answering corpuses (FinanceQA, BioLit, TechDocs, LegalBench, ArXiv-CS) encompassing 4.2 million document passages. Evaluated retrieval NDCG@10, Mean Reciprocal Rank (MRR), and downstream generation faithfulness.`,
      `Key Results: PulseRank-v2 improved NDCG@10 by +14.8% over pure Gemini/OpenAI dense embeddings and +22.4% over BM25. In downstream LLM generation tests with Gemini-2.5-Flash, hallucination rates dropped from 18.2% to 1.9% on numerical extraction benchmarks.`,
      `Resource Footprint: Average query latency is 42ms with IVF-PQ quantization index, maintaining sub-100ms P99 latency on a single 16-core CPU node without GPU requirements.`,
    ];

    const doc4Content = [
      `Title: Self-Reflective Tree-of-Thought Reasoning in Multi-Agent Autonomous Code Generation`,
      `Authors: Kovacs, M., Dubois, C., & Wei, S. (NeurIPS 2024 Spotlight)`,
      `Abstract: Linear Chain-of-Thought (CoT) prompting struggles with multi-file architectural consistency and complex algorithmic backtracking. We formulate an asynchronous Tree-of-Thought (ToT) exploration protocol orchestrated by specialized critic and synthesizer agents.`,
      `Methodology: The system maintains an explicit state-space tree where branching factor b=3 and depth d=5. A verification agent executes dynamic static analysis, type checking, and boundary unit test execution to calculate node reward scores r in [0, 1].`,
      `Empirical Results: On the SWE-bench Verified benchmark (500 challenging GitHub issues), the proposed multi-agent framework achieved 53.6% pass@1 resolution rate, outperforming single-turn frontier models by +19.4 absolute percentage points.`,
      `Computational Cost: Median token consumption increased by 3.2x compared to linear reasoning; however, catastrophic regression loops were reduced by 84%.`,
    ];

    // Add documents
    state.documents.push(
      {
        id: doc1Id,
        workspace_id: ws1Id,
        user_id: adminUser.id,
        title: 'Multi-Center Evaluation of Deep Residual Networks for Pancreatic Adenocarcinoma Detection',
        authors: 'Vance, E., Zhang, K., Holst, M., et al.',
        publication_date: '2025-01-15',
        file_name: 'resnet3d_pancreatic_oncology_2025.pdf',
        file_path: '/uploads/resnet3d_pancreatic_oncology_2025.pdf',
        file_type: 'application/pdf',
        file_size_bytes: 4210000,
        status: 'indexed',
        summary: 'Blinded multi-center trial demonstrating 0.962 AUROC for ResNet-3D-Onco in detecting early-stage micro-tumors on abdominal CT.',
        metadata: { pageCount: 14, studyType: 'Multi-Center Diagnostic Trial', sampleSize: 'N = 2,840' },
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: doc2Id,
        workspace_id: ws1Id,
        user_id: adminUser.id,
        title: 'Comparative Trial of GLP-1 vs Dual GIP/GLP-1 in Cardiovascular Outcomes in Diabetic Cardiomyopathy',
        authors: 'Al-Mansoor, S., Patel, R. K., Sterling, H.',
        publication_date: '2024-09-20',
        file_name: 'tirzepatide_cardiac_lancet_2024.pdf',
        file_path: '/uploads/tirzepatide_cardiac_lancet_2024.pdf',
        file_type: 'application/pdf',
        file_size_bytes: 3890000,
        status: 'indexed',
        summary: 'Phase 3 double-blind RCT showing superior 6MWD (+48.2m) and NT-proBNP reduction (-38.4%) with dual GIP/GLP-1 receptor agonist Tirzepatide.',
        metadata: { pageCount: 18, studyType: 'Phase 3 Double-Blind RCT', sampleSize: 'N = 1,850' },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: doc3Id,
        workspace_id: ws2Id,
        user_id: adminUser.id,
        title: 'Hybrid Dense-Sparse Vector Retrieval with Learned Late Interaction in Enterprise RAG Systems',
        authors: 'Chen, L., Thorne, B., & Gupta, A.',
        publication_date: '2025-02-10',
        file_name: 'hybrid_vector_rag_pulserank_2025.pdf',
        file_path: '/uploads/hybrid_vector_rag_pulserank_2025.pdf',
        file_type: 'application/pdf',
        file_size_bytes: 2950000,
        status: 'indexed',
        summary: 'Empirical benchmark establishing a 14.8% NDCG@10 gain and reduction of LLM hallucinations from 18.2% to 1.9% via late interaction hybrid retrieval.',
        metadata: { pageCount: 22, studyType: 'Systems & Algorithmic Benchmark', sampleSize: '4.2M Passages' },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: doc4Id,
        workspace_id: ws2Id,
        user_id: adminUser.id,
        title: 'Self-Reflective Tree-of-Thought Reasoning in Multi-Agent Autonomous Code Generation',
        authors: 'Kovacs, M., Dubois, C., & Wei, S.',
        publication_date: '2024-12-04',
        file_name: 'tot_multiagent_code_neurips_2024.pdf',
        file_path: '/uploads/tot_multiagent_code_neurips_2024.pdf',
        file_type: 'application/pdf',
        file_size_bytes: 3100000,
        status: 'indexed',
        summary: 'ToT multi-agent exploration benchmark on SWE-bench Verified reaching 53.6% pass@1 resolution rate through state-space search and automated critics.',
        metadata: { pageCount: 16, studyType: 'Empirical Benchmark & Evaluation', sampleSize: '500 GitHub Issues' },
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    );

    // Chunking and embedding generator helper
    const buildChunks = async (docId: string, wsId: string, paragraphs: string[]) => {
      const generated = await batchGenerateEmbeddings(paragraphs, 3);
      for (const item of generated) {
        state.document_chunks.push({
          id: crypto.randomUUID(),
          document_id: docId,
          workspace_id: wsId,
          chunk_index: item.chunkIndex,
          content: item.content,
          token_count: item.tokenCount,
          embedding: item.embedding,
          created_at: new Date().toISOString(),
        });
      }
    };

    await buildChunks(doc1Id, ws1Id, doc1Content);
    await buildChunks(doc2Id, ws1Id, doc2Content);
    await buildChunks(doc3Id, ws2Id, doc3Content);
    await buildChunks(doc4Id, ws2Id, doc4Content);

    // Seed Extractions
    state.extractions.push(
      {
        id: '6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d',
        document_id: doc1Id,
        workspace_id: ws1Id,
        paper_title: 'Multi-Center Evaluation of Deep Residual Networks for Pancreatic Adenocarcinoma Detection',
        methodology: 'Multi-Center Blinded Diagnostic Accuracy Trial (4 Academic Medical Centers)',
        sample_size: 'N = 2,840 Abdominal CT Scans (1,420 PDAC, 1,420 Matched Controls)',
        key_findings: [
          'AUROC of 0.962 (95% CI: 0.951-0.973) on independent external validation cohort',
          '89.4% sensitivity for sub-centimeter tumors (< 12mm) vs 64.2% for subspecialist radiologists (p < 0.001)',
          'False positive rate constrained to 3.1% in severe chronic pancreatitis high-risk background',
          '28% increase in eligible early surgical resection candidates identified',
        ],
        limitations: [
          'Retrospective validation design of institutional cohorts',
          'Dependency on precise intravenous contrast bolus timing',
          'Decreased discrimination in heavy chronic calcific pancreatitis cases',
        ],
        extracted_data: {
          primaryMetric: 'AUROC 0.962',
          imagingModality: 'Triphasic Contrast-Enhanced CT',
          clinicalImpact: 'Increases surgical candidacy by 28%',
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: '7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e',
        document_id: doc2Id,
        workspace_id: ws1Id,
        paper_title: 'Comparative Trial of GLP-1 vs Dual GIP/GLP-1 in Cardiovascular Outcomes in Diabetic Cardiomyopathy',
        methodology: 'Double-Blind Randomized Active-Comparator Phase 3 Trial (52-week treatment duration)',
        sample_size: 'N = 1,850 T2DM Patients with Diastolic Dysfunction (E/e\' > 14)',
        key_findings: [
          'Tirzepatide achieved superior 6-minute walk distance increase (+48.2m vs +27.6m, p = 0.002)',
          '38.4% mean reduction in NT-proBNP plasma biomarker compared to 24.1% with Semaglutide (p < 0.001)',
          'Left ventricular mass index reduced by 12.4 g/m² vs 6.8 g/m² (p = 0.01)',
          'Comparable discontinuation rates due to GI symptoms (4.8% vs 5.1%)',
        ],
        limitations: [
          'Limited to 52-week follow-up, preventing evaluation of hard all-cause mortality',
          'Under-representation of Hispanic and Black patient demographics in trial cohorts',
        ],
        extracted_data: {
          primaryMetric: '6MWD +48.2m vs +27.6m (p = 0.002)',
          biomarkerTarget: 'NT-proBNP (-38.4%)',
          safetyProfile: 'Well tolerated; 4.8% GI discontinuation rate',
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: '8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f',
        document_id: doc3Id,
        workspace_id: ws2Id,
        paper_title: 'Hybrid Dense-Sparse Vector Retrieval with Learned Late Interaction in Enterprise RAG Systems',
        methodology: 'Empirical Information Retrieval Benchmark & Systems Latency Audit',
        sample_size: '4.2 Million Passages across 5 Enterprise Domains (FinanceQA, BioLit, TechDocs, LegalBench, ArXiv)',
        key_findings: [
          'NDCG@10 improved by +14.8% over pure 768-dim dense embeddings and +22.4% over BM25',
          'Downstream LLM hallucination rates reduced from 18.2% to 1.9% on numerical reasoning extraction',
          'P99 retrieval latency constrained to 42ms utilizing IVF-PQ quantization index',
          'CPU-only serving viable on 16 cores without dedicated GPU clusters',
        ],
        limitations: [
          'Higher index build time during ingestion (2.1x standard vector indexing)',
          'Requires token-level storage caching for ColBERT late-interaction scoring',
        ],
        extracted_data: {
          retrievalGain: '+14.8% NDCG@10',
          hallucinationDrop: '18.2% -> 1.9%',
          queryLatency: '42ms P99',
        },
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    );

    // Seed a synthesis session and sample chat
    const sessId = '9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a';
    state.synthesis_sessions.push({
      id: sessId,
      workspace_id: ws1Id,
      user_id: adminUser.id,
      title: 'Efficacy Comparison: Early Oncology Detection vs Metabolic Therapy',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    });

    state.chat_messages.push(
      {
        id: crypto.randomUUID(),
        session_id: sessId,
        sender: 'user',
        content: 'What are the primary clinical trial outcomes and diagnostic thresholds demonstrated in the pancreatic cancer detection study?',
        citations: [],
        created_at: new Date(Date.now() - 86400000 * 2 + 1000).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        session_id: sessId,
        sender: 'assistant',
        content: `Based on the multi-center diagnostic evaluation of ResNet-3D-Onco [Multi-Center Evaluation of Deep Residual Networks for Pancreatic Adenocarcinoma Detection, Chunk #3]:

1. **Diagnostic Accuracy:** The deep attention model demonstrated an exceptional Area Under the Receiver Operating Characteristic (AUROC) curve of **0.962** (95% CI: 0.951–0.973) across the independent external cohort [Doc Title: Multi-Center Evaluation of Deep Residual Networks..., Chunk #4].
2. **Micro-Tumor Sensitivity:** For clinically occult neoplasms smaller than 12 mm, the algorithm attained **89.4% sensitivity**, markedly exceeding the **64.2% sensitivity** exhibited by experienced abdominal sub-specialist radiologists (p < 0.001) [Doc Title: Multi-Center Evaluation..., Chunk #4].
3. **Specificity in High-Risk Cohorts:** In challenging patient subgroups with pre-existing severe pancreatitis, the false positive rate was successfully held to **3.1%** [Doc Title: Multi-Center Evaluation..., Chunk #4].
4. **Surgical Candidacy:** Overall, this automated triphasic CT surveillance algorithm translated into an estimated **28% increase in eligible surgical resection candidates** due to timely pre-metastatic identification [Doc Title: Multi-Center Evaluation..., Chunk #6].`,
        citations: [
          {
            documentId: doc1Id,
            documentTitle: 'Multi-Center Evaluation of Deep Residual Networks for Pancreatic Adenocarcinoma Detection',
            chunkIndex: 4,
            snippet: 'ResNet-3D-Onco achieved an area under the receiver operating characteristic curve (AUROC) of 0.962 (95% CI: 0.951-0.973)... For micro-tumors (< 12mm), sensitivity was 89.4% compared to 64.2% for expert abdominal sub-specialist radiologists',
            similarity: 0.912,
          },
        ],
        created_at: new Date(Date.now() - 86400000 * 2 + 3000).toISOString(),
      }
    );

    saveStateToDisk();
    console.log('Seeding completed successfully.');
  }
}

// STORAGE API METHODS (with RLS isolation)

export const storage = {
  // USERS
  async findUserByEmail(email: string): Promise<User | null> {
    const norm = email.toLowerCase().trim();
    if (isPostgresAvailable && pool) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [norm]);
      return res.rows[0] || null;
    }
    return state.users.find((u) => u.email.toLowerCase() === norm) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return state.users.find((u) => u.id === id) || null;
  },

  async createUser(data: { email: string; password_hash: string; full_name: string; role?: string }): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase().trim(),
      password_hash: data.password_hash,
      full_name: data.full_name,
      role: data.role || 'researcher',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user.id, user.email, user.password_hash, user.full_name, user.role, user.created_at, user.updated_at]
      );
      return res.rows[0];
    }

    state.users.push(user);
    saveStateToDisk();
    return user;
  },

  // WORKSPACES (Enforcing workspaces.user_id = req.user.id)
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query('SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.rows;
    }
    return state.workspaces
      .filter((w) => w.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getWorkspaceById(id: string, userId: string): Promise<Workspace | null> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
      return res.rows[0] || null;
    }
    return state.workspaces.find((w) => w.id === id && w.user_id === userId) || null;
  },

  async createWorkspace(data: { user_id: string; name: string; description?: string; domain?: string }): Promise<Workspace> {
    const ws: Workspace = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      name: data.name,
      description: data.description || '',
      domain: data.domain || 'General Science',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `INSERT INTO workspaces (id, user_id, name, description, domain, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [ws.id, ws.user_id, ws.name, ws.description, ws.domain, ws.created_at, ws.updated_at]
      );
      return res.rows[0];
    }

    state.workspaces.unshift(ws);
    saveStateToDisk();
    return ws;
  },

  async deleteWorkspace(id: string, userId: string): Promise<boolean> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query('DELETE FROM workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
      return (res.rowCount ?? 0) > 0;
    }

    const idx = state.workspaces.findIndex((w) => w.id === id && w.user_id === userId);
    if (idx === -1) return false;

    state.workspaces.splice(idx, 1);
    // Cascade delete docs, chunks, extractions, sessions
    state.documents = state.documents.filter((d) => d.workspace_id !== id);
    state.document_chunks = state.document_chunks.filter((c) => c.workspace_id !== id);
    state.extractions = state.extractions.filter((e) => e.workspace_id !== id);
    state.synthesis_sessions = state.synthesis_sessions.filter((s) => s.workspace_id !== id);
    saveStateToDisk();
    return true;
  },

  // DOCUMENTS
  async getDocumentsByWorkspace(workspaceId: string, userId: string): Promise<Document[]> {
    // Verify workspace belongs to user
    const ws = await this.getWorkspaceById(workspaceId, userId);
    if (!ws) return [];

    if (isPostgresAvailable && pool) {
      const res = await pool.query('SELECT * FROM documents WHERE workspace_id = $1 ORDER BY created_at DESC', [workspaceId]);
      return res.rows;
    }

    return state.documents
      .filter((d) => d.workspace_id === workspaceId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getAllUserDocuments(userId: string): Promise<Document[]> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `SELECT d.* FROM documents d
         JOIN workspaces w ON d.workspace_id = w.id
         WHERE w.user_id = $1 ORDER BY d.created_at DESC`,
        [userId]
      );
      return res.rows;
    }

    const userWorkspaces = state.workspaces.filter((w) => w.user_id === userId).map((w) => w.id);
    return state.documents
      .filter((d) => userWorkspaces.includes(d.workspace_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getDocumentById(id: string, userId: string): Promise<Document | null> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `SELECT d.* FROM documents d
         JOIN workspaces w ON d.workspace_id = w.id
         WHERE d.id = $1 AND w.user_id = $2`,
        [id, userId]
      );
      return res.rows[0] || null;
    }

    const doc = state.documents.find((d) => d.id === id);
    if (!doc) return null;
    const ws = state.workspaces.find((w) => w.id === doc.workspace_id && w.user_id === userId);
    return ws ? doc : null;
  },

  async createDocument(data: Omit<Document, 'id' | 'created_at'>): Promise<Document> {
    const doc: Document = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `INSERT INTO documents (id, workspace_id, user_id, title, authors, publication_date, file_name, file_path, file_type, file_size_bytes, status, summary, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          doc.id,
          doc.workspace_id,
          doc.user_id,
          doc.title,
          doc.authors,
          doc.publication_date,
          doc.file_name,
          doc.file_path,
          doc.file_type,
          doc.file_size_bytes,
          doc.status,
          doc.summary,
          JSON.stringify(doc.metadata),
          doc.created_at,
        ]
      );
      return res.rows[0];
    }

    state.documents.unshift(doc);
    saveStateToDisk();
    return doc;
  },

  async updateDocument(
    id: string,
    updates: Partial<Pick<Document, 'status' | 'summary' | 'title' | 'authors' | 'metadata'>>
  ): Promise<Document | null> {
    if (isPostgresAvailable && pool) {
      const setClauses: string[] = [];
      const values: any[] = [id];
      let i = 2;

      for (const [key, val] of Object.entries(updates)) {
        setClauses.push(`${key} = $${i}`);
        values.push(key === 'metadata' ? JSON.stringify(val) : val);
        i++;
      }

      if (setClauses.length === 0) return null;
      const query = `UPDATE documents SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0] || null;
    }

    const doc = state.documents.find((d) => d.id === id);
    if (!doc) return null;
    Object.assign(doc, updates);
    saveStateToDisk();
    return doc;
  },

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const doc = await this.getDocumentById(id, userId);
    if (!doc) return false;

    if (isPostgresAvailable && pool) {
      await pool.query('DELETE FROM documents WHERE id = $1', [id]);
      return true;
    }

    state.documents = state.documents.filter((d) => d.id !== id);
    state.document_chunks = state.document_chunks.filter((c) => c.document_id !== id);
    state.extractions = state.extractions.filter((e) => e.document_id !== id);
    saveStateToDisk();
    return true;
  },

  // DOCUMENT CHUNKS & VECTOR SEARCH
  async insertChunks(chunks: Array<Omit<DocumentChunk, 'id' | 'created_at'>>): Promise<void> {
    const now = new Date().toISOString();
    const preparedChunks: DocumentChunk[] = chunks.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      created_at: now,
    }));

    if (isPostgresAvailable && pool) {
      for (const c of preparedChunks) {
        await pool.query(
          `INSERT INTO document_chunks (id, document_id, workspace_id, chunk_index, content, token_count, embedding, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            c.id,
            c.document_id,
            c.workspace_id,
            c.chunk_index,
            c.content,
            c.token_count,
            `[${c.embedding.join(',')}]`,
            c.created_at,
          ]
        );
      }
      return;
    }

    state.document_chunks.push(...preparedChunks);
    saveStateToDisk();
  },

  async getChunksForDocument(documentId: string): Promise<DocumentChunk[]> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        'SELECT id, document_id, workspace_id, chunk_index, content, token_count, created_at FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC',
        [documentId]
      );
      return res.rows;
    }

    return state.document_chunks
      .filter((c) => c.document_id === documentId)
      .sort((a, b) => a.chunk_index - b.chunk_index);
  },

  /**
   * Hybrid Vector & Full-Text Retrieval
   * Calculates cosine similarity against query embedding + keyword relevance
   */
  async hybridSearch(params: {
    workspaceId: string;
    userId: string;
    queryEmbedding: number[];
    queryText: string;
    topK: number;
    documentIds?: string[];
  }): Promise<
    Array<{
      chunk: DocumentChunk;
      document: Document;
      similarity: number;
      keywordScore: number;
      combinedScore: number;
    }>
  > {
    const { workspaceId, userId, queryEmbedding, queryText, topK, documentIds } = params;

    // Verify workspace ownership
    const ws = await this.getWorkspaceById(workspaceId, userId);
    if (!ws) return [];

    // Get all user documents in workspace
    const docs = await this.getDocumentsByWorkspace(workspaceId, userId);
    const docMap = new Map<string, Document>(docs.map((d) => [d.id, d]));

    // Eligible document IDs
    const targetDocIds = documentIds && documentIds.length > 0
      ? documentIds.filter((id) => docMap.has(id))
      : Array.from(docMap.keys());

    if (targetDocIds.length === 0) return [];

    let candidateChunks: DocumentChunk[] = [];

    if (isPostgresAvailable && pool) {
      try {
        // Query using pgvector cosine operator <=>
        const vectorStr = `[${queryEmbedding.join(',')}]`;
        const res = await pool.query(
          `SELECT id, document_id, workspace_id, chunk_index, content, token_count,
                  1 - (embedding <=> $1) AS vector_similarity
           FROM document_chunks
           WHERE workspace_id = $2 AND document_id = ANY($3::uuid[])
           ORDER BY embedding <=> $1 ASC
           LIMIT $4`,
          [vectorStr, workspaceId, targetDocIds, topK * 2]
        );

        return res.rows.map((row) => {
          const doc = docMap.get(row.document_id)!;
          const sim = parseFloat(row.vector_similarity) || 0;
          return {
            chunk: {
              id: row.id,
              document_id: row.document_id,
              workspace_id: row.workspace_id,
              chunk_index: row.chunk_index,
              content: row.content,
              token_count: row.token_count,
              embedding: [],
              created_at: new Date().toISOString(),
            },
            document: doc,
            similarity: sim,
            keywordScore: 0.5,
            combinedScore: sim,
          };
        });
      } catch (err) {
        console.warn('pgvector search fallback to local calculation:', err);
      }
    }

    // Local in-memory cosine similarity and BM25-like keyword scoring
    candidateChunks = state.document_chunks.filter(
      (c) => c.workspace_id === workspaceId && targetDocIds.includes(c.document_id)
    );

    const queryTokens = queryText
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);

    const scored = candidateChunks.map((chunk) => {
      const doc = docMap.get(chunk.document_id)!;
      const sim = cosineSimilarity(queryEmbedding, chunk.embedding);

      // Simple keyword matching score
      const contentLower = chunk.content.toLowerCase();
      let matchedCount = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) {
          matchedCount++;
        }
      }
      const keywordScore = queryTokens.length > 0 ? matchedCount / queryTokens.length : 0;

      // Weighted hybrid fusion score: 75% vector, 25% lexical
      const combinedScore = 0.75 * sim + 0.25 * keywordScore;

      return {
        chunk,
        document: doc,
        similarity: sim,
        keywordScore,
        combinedScore,
      };
    });

    return scored.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, topK);
  },

  // EXTRACTIONS
  async getExtractionsByWorkspace(workspaceId: string, userId: string): Promise<Extraction[]> {
    const ws = await this.getWorkspaceById(workspaceId, userId);
    if (!ws) return [];

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `SELECT e.*, d.title as paper_title
         FROM extractions e
         JOIN documents d ON e.document_id = d.id
         WHERE e.workspace_id = $1 ORDER BY e.created_at DESC`,
        [workspaceId]
      );
      return res.rows;
    }

    return state.extractions
      .filter((e) => e.workspace_id === workspaceId)
      .map((e) => {
        const doc = state.documents.find((d) => d.id === e.document_id);
        return {
          ...e,
          paper_title: e.paper_title || doc?.title || 'Unknown Title',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getAllUserExtractions(userId: string): Promise<Extraction[]> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `SELECT e.*, d.title as paper_title
         FROM extractions e
         JOIN workspaces w ON e.workspace_id = w.id
         JOIN documents d ON e.document_id = d.id
         WHERE w.user_id = $1 ORDER BY e.created_at DESC`,
        [userId]
      );
      return res.rows;
    }

    const userWorkspaces = state.workspaces.filter((w) => w.user_id === userId).map((w) => w.id);
    return state.extractions
      .filter((e) => userWorkspaces.includes(e.workspace_id))
      .map((e) => {
        const doc = state.documents.find((d) => d.id === e.document_id);
        return {
          ...e,
          paper_title: e.paper_title || doc?.title || 'Research Document',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createExtraction(data: Omit<Extraction, 'id' | 'created_at'>): Promise<Extraction> {
    const ext: Extraction = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `INSERT INTO extractions (id, document_id, workspace_id, methodology, sample_size, key_findings, limitations, extracted_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          ext.id,
          ext.document_id,
          ext.workspace_id,
          ext.methodology,
          ext.sample_size,
          JSON.stringify(ext.key_findings),
          JSON.stringify(ext.limitations),
          JSON.stringify(ext.extracted_data),
          ext.created_at,
        ]
      );
      return res.rows[0];
    }

    state.extractions.unshift(ext);
    saveStateToDisk();
    return ext;
  },

  // SYNTHESIS SESSIONS & MESSAGES
  async getSessions(workspaceId: string, userId: string): Promise<SynthesisSession[]> {
    const ws = await this.getWorkspaceById(workspaceId, userId);
    if (!ws) return [];

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        'SELECT * FROM synthesis_sessions WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
        [workspaceId, userId]
      );
      return res.rows;
    }

    return state.synthesis_sessions
      .filter((s) => s.workspace_id === workspaceId && s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createSession(workspaceId: string, userId: string, title: string): Promise<SynthesisSession> {
    const sess: SynthesisSession = {
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
    };

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `INSERT INTO synthesis_sessions (id, workspace_id, user_id, title, created_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [sess.id, sess.workspace_id, sess.user_id, sess.title, sess.created_at]
      );
      return res.rows[0];
    }

    state.synthesis_sessions.unshift(sess);
    saveStateToDisk();
    return sess;
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      );
      return res.rows;
    }

    return state.chat_messages
      .filter((m) => m.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async addMessage(msg: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const chatMsg: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isPostgresAvailable && pool) {
      const res = await pool.query(
        `INSERT INTO chat_messages (id, session_id, sender, content, citations, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [chatMsg.id, chatMsg.session_id, chatMsg.sender, chatMsg.content, JSON.stringify(chatMsg.citations), chatMsg.created_at]
      );
      return res.rows[0];
    }

    state.chat_messages.push(chatMsg);
    saveStateToDisk();
    return chatMsg;
  },

  // METRICS FOR DASHBOARD
  async getDashboardAnalytics(userId: string) {
    const workspaces = await this.getWorkspaces(userId);
    const documents = await this.getAllUserDocuments(userId);
    const extractions = await this.getAllUserExtractions(userId);

    const wsIds = workspaces.map((w) => w.id);
    const chunks = state.document_chunks.filter((c) => wsIds.includes(c.workspace_id));
    const citationsCount = state.chat_messages.reduce(
      (acc, m) => acc + (m.citations?.length || 0),
      0
    );

    // Domain distribution
    const domainCounts: Record<string, number> = {
      'Medical & Healthcare': 0,
      'Artificial Intelligence & Computer Science': 0,
      'Climate & Environmental Science': 0,
      'Finance & Macroeconomics': 0,
      'Social Sciences & Humanities': 0,
    };

    for (const ws of workspaces) {
      if (domainCounts[ws.domain] !== undefined) {
        domainCounts[ws.domain]++;
      } else {
        domainCounts['Artificial Intelligence & Computer Science']++;
      }
    }

    const domainData = Object.entries(domainCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    // Methodologies breakdown
    const methodCounts: Record<string, number> = {};
    for (const ext of extractions) {
      const key = ext.methodology?.slice(0, 30) || 'Observational Empirical';
      methodCounts[key] = (methodCounts[key] || 0) + 1;
    }

    return {
      totalWorkspaces: workspaces.length,
      totalDocuments: documents.length,
      totalChunks: chunks.length,
      totalExtractions: extractions.length,
      totalCitations: citationsCount,
      domainDistribution: domainData,
      recentDocuments: documents.slice(0, 5),
      methodologies: Object.entries(methodCounts).map(([name, value]) => ({ name, value })),
    };
  },
};
