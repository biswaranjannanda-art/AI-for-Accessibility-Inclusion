import { ai, GEMINI_MODELS } from '../config/gemini.ts';

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: number[];
}

/**
 * Clean and normalize text from documents
 */
export function cleanDocumentText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Recursively chunk text respecting paragraph and sentence boundaries
 */
export function chunkText(
  fullText: string,
  targetChunkChars = 800,
  overlapChars = 150
): string[] {
  const cleaned = cleanDocumentText(fullText);
  if (!cleaned) return [];

  if (cleaned.length <= targetChunkChars) {
    return [cleaned];
  }

  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // If paragraph itself is too large, split into sentences
    if (trimmedPara.length > targetChunkChars) {
      const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmedPara];
      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).length > targetChunkChars) {
          if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
            // Carry over overlap from the end of currentChunk
            const overlapPart = currentChunk.slice(-overlapChars);
            currentChunk = overlapPart + ' ' + sentence;
          } else {
            chunks.push(sentence.trim());
            currentChunk = '';
          }
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        }
      }
    } else {
      if ((currentChunk + '\n\n' + trimmedPara).length > targetChunkChars) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
          const overlapPart = currentChunk.slice(-overlapChars);
          currentChunk = overlapPart + '\n\n' + trimmedPara;
        } else {
          currentChunk = trimmedPara;
        }
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate 768-dim embeddings via Google GenAI SDK (text-embedding-004 or gemini-embedding-2-preview)
 * Includes graceful pseudo-semantic fallback vector if Gemini embedding fails or API key is not configured.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const truncatedText = text.slice(0, 2048);

  if (process.env.GEMINI_API_KEY) {
    try {
      const res: any = await ai.models.embedContent({
        model: GEMINI_MODELS.EMBEDDINGS,
        contents: truncatedText,
      });

      const values = res.embedding?.values || (res.embeddings && res.embeddings[0]?.values);
      if (values && values.length > 0) {
        return values;
      }
    } catch (err) {
      console.warn('Gemini embedding call failed, trying fallback embedding model...', err);
      try {
        const fallbackRes: any = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: truncatedText,
        });
        const fbValues = fallbackRes.embedding?.values || (fallbackRes.embeddings && fallbackRes.embeddings[0]?.values);
        if (fbValues && fbValues.length > 0) {
          return fbValues.slice(0, 768);
        }
      } catch (err2) {
        console.warn('Fallback embedding model also failed, generating pseudo-deterministic vector:', err2);
      }
    }
  }

  // Deterministic 768-dim vector for fallback/offline resilience
  return generateDeterministicVector(text, 768);
}

/**
 * Compute batch embeddings with concurrency control
 */
export async function batchGenerateEmbeddings(
  textChunks: string[],
  concurrency = 3
): Promise<TextChunk[]> {
  const results: TextChunk[] = [];

  for (let i = 0; i < textChunks.length; i += concurrency) {
    const slice = textChunks.slice(i, i + concurrency);
    const promises = slice.map(async (chunk, index) => {
      const chunkIndex = i + index;
      const embedding = await generateEmbedding(chunk);
      // Rough token estimation (~4 chars per token)
      const tokenCount = Math.max(1, Math.round(chunk.length / 4));
      return {
        chunkIndex,
        content: chunk,
        tokenCount,
        embedding,
      };
    });

    const resolved = await Promise.all(promises);
    results.push(...resolved);
  }

  return results;
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate a deterministic high-dimensional embedding for resilience
 */
function generateDeterministicVector(text: string, dimensions = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vec[idx] += sign * (1 / (1 + w * 0.1));

    // Also distribute to neighbor bucket
    const neighbor = (idx + 31) % dimensions;
    vec[neighbor] += sign * 0.5;
  }

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = vec[i] / norm;
    }
  } else {
    vec[0] = 1.0;
  }
  return vec;
}
