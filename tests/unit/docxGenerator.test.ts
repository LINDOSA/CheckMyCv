import { describe, it, expect } from 'vitest';
import { Table, Paragraph } from 'docx';
import {
  createDocxFromStandardCV,
  generateDocxBuffer,
  generateDocxBlob,
} from '@/lib/docxGenerator';
import { STANDARD_CV_ALEX } from '@/lib/cvStandardData';

function extractStringsFromNode(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string') return [node];
  if (typeof node.text === 'string') return [node.text];
  let res: string[] = [];
  if (Array.isArray(node)) {
    for (const item of node) {
      res = res.concat(extractStringsFromNode(item));
    }
  } else if (typeof node === 'object') {
    if (node.root) res = res.concat(extractStringsFromNode(node.root));
    if (node.children) res = res.concat(extractStringsFromNode(node.children));
    if (node.value) res = res.concat(extractStringsFromNode(node.value));
  }
  return res;
}

describe('DOCX Generator: Single-Column ATS Standards & Guardrails', () => {
  it('contains ZERO multi-cell tables or table elements throughout the document', () => {
    const doc = createDocxFromStandardCV(STANDARD_CV_ALEX);
    const children = (doc as any).sections[0].children;

    // Filter for any Table instances
    const tables = children.filter(
      (child: any) => child instanceof Table || child.constructor.name === 'Table'
    );

    expect(tables).toHaveLength(0);
  });

  it('strictly enforces canonical ATS section hierarchy: Summary -> Core Skills -> Experience -> Education -> References', () => {
    const doc = createDocxFromStandardCV(STANDARD_CV_ALEX);
    const children = (doc as any).sections[0].children;

    // Extract text content from each paragraph
    const paragraphTexts: string[] = children.map((child: any) => {
      return extractStringsFromNode(child).join(' ').trim();
    });

    const summaryIdx = paragraphTexts.findIndex((t) => t.includes('Professional Summary'));
    const skillsIdx = paragraphTexts.findIndex((t) => t.includes('Core Skills'));
    const expIdx = paragraphTexts.findIndex((t) => t.includes('Professional Experience'));
    const eduIdx = paragraphTexts.findIndex((t) => t.includes('Education & Certifications'));
    const refIdx = paragraphTexts.findIndex((t) => t.includes('Professional References'));

    // All section headings must exist
    expect(summaryIdx).toBeGreaterThan(-1);
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(-1);
    expect(eduIdx).toBeGreaterThan(-1);
    expect(refIdx).toBeGreaterThan(-1);

    // Assert strict canonical ordering
    expect(summaryIdx).toBeLessThan(skillsIdx);
    expect(skillsIdx).toBeLessThan(expIdx);
    expect(expIdx).toBeLessThan(eduIdx);
    expect(eduIdx).toBeLessThan(refIdx);
  });

  it('renders experience entries with linear paragraphs instead of tables', () => {
    const doc = createDocxFromStandardCV(STANDARD_CV_ALEX);
    const children = (doc as any).sections[0].children;

    const allText = extractStringsFromNode(children).join(' ');

    // Contains job title and company in linear stream
    expect(allText).toContain('Senior IT Operations Lead');
    expect(allText).toContain('NexaCloud Systems');
    // Contains experience dates
    expect(allText).toContain('03/2021 – Present');
  });

  it('renders skills grid entries as sequential linear category items', () => {
    const doc = createDocxFromStandardCV(STANDARD_CV_ALEX);
    const children = (doc as any).sections[0].children;

    const allText = extractStringsFromNode(children).join(' ');

    expect(allText).toContain('Cloud & Virtualization');
    expect(allText).toContain('Identity & Access');
  });

  it('generates a valid binary DOCX buffer with non-zero length', async () => {
    const buffer = await generateDocxBuffer(STANDARD_CV_ALEX);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);

    // DOCX files are ZIP archives starting with PK (0x50, 0x4B)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('generates a valid DOCX Blob for client-side download', async () => {
    const blob = await generateDocxBlob(STANDARD_CV_ALEX);

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });
});
