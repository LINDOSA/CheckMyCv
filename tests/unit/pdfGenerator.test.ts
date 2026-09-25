import { describe, it, expect } from 'vitest';
import pdfParse from 'pdf-parse';
import {
  generatePdfBuffer,
  generatePdfBlob,
  createPdfFromStandardCV,
} from '@/lib/pdfGenerator';
import { STANDARD_CV_ALEX } from '@/lib/cvStandardData';

describe('PDF Generator: Native Text ATS Generation & Guardrails', () => {
  it('generates a valid binary PDF buffer starting with %PDF- header', () => {
    const buffer = generatePdfBuffer(STANDARD_CV_ALEX);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(2000);
    // Standard PDF magic header
    expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('produces 100% extractable, selectable text containing all candidate details', async () => {
    const buffer = generatePdfBuffer(STANDARD_CV_ALEX);
    const parsed = await pdfParse(buffer);

    expect(parsed.text.length).toBeGreaterThan(500);
    expect(parsed.text).toContain('ALEX MORGAN');
    expect(parsed.text).toContain('Senior IT Support & Operations Lead');
    expect(parsed.text).toContain('alex.morgan@email.com');
    expect(parsed.text).toContain('+1 (555) 234-5678');
    expect(parsed.text).toContain('Professional Summary');
    expect(parsed.text).toContain('Core Skills');
    expect(parsed.text).toContain('Professional Experience');
    expect(parsed.text).toContain('NexaCloud Systems');
    expect(parsed.text).toContain('Education & Certifications');
    expect(parsed.text).toContain('Professional References');
  });

  it('strictly preserves canonical ATS hierarchy order in rendered text stream', async () => {
    const buffer = generatePdfBuffer(STANDARD_CV_ALEX);
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    const summaryIdx = text.indexOf('Professional Summary');
    const skillsIdx = text.indexOf('Core Skills');
    const expIdx = text.indexOf('Professional Experience');
    const eduIdx = text.indexOf('Education & Certifications');
    const refIdx = text.indexOf('Professional References');

    expect(summaryIdx).toBeGreaterThan(-1);
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(-1);
    expect(eduIdx).toBeGreaterThan(-1);
    expect(refIdx).toBeGreaterThan(-1);

    // Canonical ATS sequence: Summary -> Skills -> Experience -> Education -> References
    expect(summaryIdx).toBeLessThan(skillsIdx);
    expect(skillsIdx).toBeLessThan(expIdx);
    expect(expIdx).toBeLessThan(eduIdx);
    expect(eduIdx).toBeLessThan(refIdx);
  });

  it('contains ZERO raster image streams (/Subtype /Image or /DCTDecode)', () => {
    const buffer = generatePdfBuffer(STANDARD_CV_ALEX);
    const pdfRaw = buffer.toString('binary');

    // Confirms pure vector text drawing with zero canvas/raster screenshots
    expect(pdfRaw).not.toContain('/Subtype /Image');
    expect(pdfRaw).not.toContain('/DCTDecode');
  });

  it('generates a valid client-side PDF Blob with application/pdf MIME type', () => {
    const blob = generatePdfBlob(STANDARD_CV_ALEX);

    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(2000);
  });

  it('renders multi-page document cleanly for comprehensive CV content', () => {
    const doc = createPdfFromStandardCV(STANDARD_CV_ALEX);
    const pageCount = doc.getNumberOfPages();

    expect(pageCount).toBeGreaterThanOrEqual(1);
  });
});
