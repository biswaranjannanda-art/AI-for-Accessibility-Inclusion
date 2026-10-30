import fs from 'fs/promises';
import path from 'path';

export interface ParsedDocument {
  text: string;
  title: string;
  authors: string;
  publicationDate: string;
  metadata: Record<string, any>;
}

/**
 * Extracts raw text and basic metadata from PDF, DOCX, TXT, or MD files
 */
export async function parseDocumentFile(
  filePath: string,
  originalFilename: string,
  mimeType: string
): Promise<ParsedDocument> {
  const ext = path.extname(originalFilename).toLowerCase();
  let extractedText = '';
  let metadata: Record<string, any> = {
    originalFilename,
    mimeType,
  };

  const buffer = await fs.readFile(filePath);

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      // Dynamic import to handle any module issues safely
      const pdfModule: any = await import('pdf-parse');
      const pdfParser = pdfModule.default || pdfModule;
      const pdfData = await pdfParser(buffer);
      extractedText = pdfData.text || '';
      metadata.pageCount = pdfData.numpages || 1;
      if (pdfData.info) {
        metadata.pdfInfo = pdfData.info;
      }
    } catch (err: any) {
      console.warn('PDF parsing error, extracting text as string buffer fallback:', err.message);
      // Clean readable ASCII extraction fallback
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
    }
  } else if (
    ext === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const mammothModule = await import('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
      metadata.warnings = result.messages;
    } catch (err: any) {
      console.warn('DOCX parsing error, falling back:', err.message);
      extractedText = buffer.toString('utf-8');
    }
  } else {
    // Plain text, markdown
    extractedText = buffer.toString('utf-8');
  }

  // Derive title from filename or first non-empty header line
  const lines = extractedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let title = originalFilename.replace(/\.[^/.]+$/, '');
  let authors = 'Research Working Group';
  let publicationDate = new Date().toISOString().split('T')[0];

  if (lines.length > 0) {
    const candidateTitle = lines[0].replace(/^#+\s*/, '').trim();
    if (candidateTitle.length > 5 && candidateTitle.length < 180) {
      title = candidateTitle;
    }

    if (lines.length > 1) {
      const candidateAuthors = lines[1].replace(/^(by|authors?|written by):\s*/i, '').trim();
      if (
        candidateAuthors.length < 120 &&
        !candidateAuthors.includes('Abstract') &&
        !candidateAuthors.includes('Introduction')
      ) {
        authors = candidateAuthors;
      }
    }
  }

  // Look for potential year
  const yearMatch = extractedText.match(/\b(20[12][0-9]|199[0-9])\b/);
  if (yearMatch) {
    publicationDate = `${yearMatch[0]}-01-15`;
  }

  return {
    text: extractedText,
    title,
    authors,
    publicationDate,
    metadata,
  };
}
