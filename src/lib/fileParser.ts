import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { compressCvText, countWords } from './textCompression';

export { compressCvText, countWords };

export interface ExtractedDocument {
  text: string;
  wordCount: number;
  format: 'pdf' | 'docx' | 'txt' | 'unknown';
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: string;
}

/**
 * Extract text from an uploaded file Buffer based on MIME type / filename
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedDocument> {
  const lowerName = fileName.toLowerCase();

  let rawText = '';
  let format: ExtractedDocument['format'] = 'unknown';

  // 1. PDF File
  if (mimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      rawText = data.text;
      format = 'pdf';
    } catch (err: any) {
      throw new Error(`Failed to parse PDF document: ${err?.message || 'Invalid or encrypted PDF'}`);
    }
  }
  // 2. DOCX File
  else if (
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('docx') ||
    lowerName.endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
      format = 'docx';
    } catch (err: any) {
      throw new Error(`Failed to parse Word document: ${err?.message || 'Invalid DOCX file'}`);
    }
  }
  // 3. Plain Text / Markdown
  else if (
    mimeType.includes('text') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md')
  ) {
    rawText = buffer.toString('utf-8');
    format = 'txt';
  } else {
    throw new Error(
      `Unsupported file format for "${fileName}". Please upload a PDF, DOCX, or TXT file.`
    );
  }

  const cleaned = compressCvText(rawText);
  const originalSize = Buffer.byteLength(rawText, 'utf-8');
  const compressedSize = Buffer.byteLength(cleaned, 'utf-8');
  const savings = Math.max(0, Math.round((1 - compressedSize / Math.max(1, originalSize)) * 100));

  return {
    text: cleaned,
    wordCount: countWords(cleaned),
    format,
    originalSize,
    compressedSize,
    compressionRatio: `${savings}% compressed`,
  };
}
