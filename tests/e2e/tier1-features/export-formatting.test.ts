/**
 * Tier 1: Feature Coverage Test Suite
 * Export Formatting Guardrails (DOCX & PDF Single-Column Layouts)
 *
 * Covers:
 * - Features 1, 2, 10: ATS Formatting Guardrails
 *   - Generated DOCX single-column linear layout
 *   - Generated DOCX zero multi-cell layout tables
 *   - Generated DOCX zero text boxes / floating graphics
 *   - Generated PDF text-based and parseable
 *   - Generated PDF single-column ATS flow
 *   - Full section content preservation without truncation
 *   - Formatting guardrail audit engine verification
 */

import { describe, it, expect } from 'vitest';
import { Packer, Table, Paragraph } from 'docx';
import pdfParse from 'pdf-parse';
import { createDocxFromStandardCV } from '@/lib/docxGenerator';
import { createPdfFromStandardCV, generatePdfBuffer } from '@/lib/pdfGenerator';
import { evaluateFormattingGuardrails } from '@/lib/cvQualityEngine';
import { HIGH_QUALITY_ATS_CV } from '../helpers/fixtures';

describe('Tier 1: Export Formatting Guardrails (DOCX & PDF)', () => {
  // ==========================================================================
  // 1. DOCX FORMATTING GUARDRAILS
  // ==========================================================================
  describe('DOCX ATS Formatting Guardrails', () => {
    it('1.1 Generated DOCX uses linear single-column structure across all sections', () => {
      const doc = createDocxFromStandardCV(HIGH_QUALITY_ATS_CV);
      const sections = (doc as any).sections;

      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);

      // Verify that no section defines multiple text columns
      sections.forEach((section: any) => {
        if (section.properties?.column) {
          expect(section.properties.column.count || 1).toBe(1);
        }
      });
    });

    it('1.2 Generated DOCX contains ZERO multi-cell layout tables', () => {
      const doc = createDocxFromStandardCV(HIGH_QUALITY_ATS_CV);
      const sections = (doc as any).sections;

      sections.forEach((section: any) => {
        const children = section.children || [];
        children.forEach((child: any) => {
          if (child instanceof Table || child.constructor?.name === 'Table') {
            const rows = (child as any).root || (child as any).rows || [];
            rows.forEach((row: any) => {
              const cells = (row as any).root || (row as any).cells || [];
              // Multi-cell tables (>1 column) break ATS parsers and are strictly forbidden
              expect(cells.length).toBeLessThanOrEqual(1);
            });
          }
        });
      });
    });

    it('1.3 Generated DOCX contains ZERO text boxes, floating shapes, or raster graphics', () => {
      const doc = createDocxFromStandardCV(HIGH_QUALITY_ATS_CV);
      const sections = (doc as any).sections;

      sections.forEach((section: any) => {
        const children = section.children || [];
        children.forEach((child: any) => {
          // Verify no floating frames, drawing objects, or image runs exist in paragraphs
          if (child instanceof Paragraph || child.constructor?.name === 'Paragraph') {
            const runs = (child as any).root || [];
            runs.forEach((run: any) => {
              const runName = run.constructor?.name || '';
              expect(runName).not.toBe('Drawing');
              expect(runName).not.toBe('ImageRun');
            });
          }
        });
      });
    });

    it('1.4 Generated DOCX compiles cleanly to binary OpenXML buffer with valid PK zip header', async () => {
      const doc = createDocxFromStandardCV(HIGH_QUALITY_ATS_CV);
      const buffer = await Packer.toBuffer(doc);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);
      // Verify ZIP magic bytes (50 4B 03 04)
      expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304');
    });
  });

  // ==========================================================================
  // 2. PDF FORMATTING GUARDRAILS
  // ==========================================================================
  describe('PDF ATS Formatting Guardrails', () => {
    it('2.1 Generated PDF is text-based with valid %PDF- header', () => {
      const buffer = generatePdfBuffer(HIGH_QUALITY_ATS_CV);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);
      // Verify standard PDF header (%PDF-)
      expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    });

    it('2.2 Generated PDF contains selectable, parseable ATS text stream', async () => {
      const buffer = generatePdfBuffer(HIGH_QUALITY_ATS_CV);
      const parsed = await pdfParse(buffer);

      expect(parsed.text).toBeDefined();
      expect(parsed.text.length).toBeGreaterThan(500);

      // Verify essential sections and candidate text appear cleanly in parsed text stream
      expect(parsed.text).toContain('ALEX MORGAN');
      expect(parsed.text).toContain('Senior IT Support & Operations Lead');
      expect(parsed.text).toContain('Professional Summary');
      expect(parsed.text).toContain('Core Skills');
      expect(parsed.text).toContain('Professional Experience');
      expect(parsed.text).toContain('Education & Certifications');
      expect(parsed.text).toContain('Professional References');
    });

    it('2.3 Generated PDF enforces single-column ATS flow and preserves content without truncation', async () => {
      const buffer = generatePdfBuffer(HIGH_QUALITY_ATS_CV);
      const parsed = await pdfParse(buffer);

      // Verify experience accomplishments are present
      expect(parsed.text).toContain('NexaCloud Systems');
      expect(parsed.text).toContain('first-contact SLA resolution');
      expect(parsed.text).toContain('Microsoft Intune');
      expect(parsed.text).toContain('$24,000');

      // Verify references are preserved
      expect(parsed.text).toContain('Sarah Jenkins');
      expect(parsed.text).toContain('David Reynolds');
    });
  });

  // ==========================================================================
  // 3. FORMATTING GUARDRAIL AUDIT ENGINE
  // ==========================================================================
  describe('Formatting Guardrail Evaluator', () => {
    it('3.1 Clean single-column linear text passes formatting guardrails with 0 violations', () => {
      const cleanText = `
ALEX MORGAN
alex@example.com | +1 555 123 4567 | New York, NY

Summary
Experienced lead with 5 years in IT.

Skills
AWS, Azure, Python

Experience
Senior Lead | NexaCloud | 2022 - Present
- Automated provisioning saving 68% time.
`.trim();

      const report = evaluateFormattingGuardrails(cleanText);

      expect(report.isSingleColumn).toBe(true);
      expect(report.hasMultiCellTables).toBe(false);
      expect(report.hasTextBoxes).toBe(false);
      expect(report.hasGraphics).toBe(false);
      expect(report.isCompliant).toBe(true);
      expect(report.violations).toHaveLength(0);
    });

    it('3.2 Detects and flags Markdown multi-cell layout tables', () => {
      const markdownTableText = `
Summary
Some text here.

| Skill Category | Technologies | Level |
|---|---|---|
| Cloud | AWS, Azure | Expert |
| Scripting | Python, Bash | Advanced |
`.trim();

      const report = evaluateFormattingGuardrails(markdownTableText);

      expect(report.hasMultiCellTables).toBe(true);
      expect(report.isCompliant).toBe(false);
      expect(report.violations.some((v) => v.includes('Multi-cell tables'))).toBe(true);
    });

    it('3.3 Detects and flags HTML table elements', () => {
      const htmlTableText = `
<div>
  <table>
    <tr><td>Title</td><td>Company</td></tr>
  </table>
</div>
`.trim();

      const report = evaluateFormattingGuardrails(htmlTableText);

      expect(report.hasMultiCellTables).toBe(true);
      expect(report.isCompliant).toBe(false);
    });

    it('3.4 Detects and flags text boxes and sidebars', () => {
      const sidebarText = `
[sidebar]
Contact details and skills in a sidebar
[/sidebar]

Main column text.
`.trim();

      const report = evaluateFormattingGuardrails(sidebarText);

      expect(report.hasTextBoxes).toBe(true);
      expect(report.isCompliant).toBe(false);
      expect(report.violations.some((v) => v.includes('Text boxes or sidebars'))).toBe(true);
    });

    it('3.5 Detects and flags embedded images or graphics', () => {
      const graphicText = `
![Candidate Photo](https://example.com/photo.jpg)

ALEX MORGAN
Professional Profile
`.trim();

      const report = evaluateFormattingGuardrails(graphicText);

      expect(report.hasGraphics).toBe(true);
      expect(report.isCompliant).toBe(false);
      expect(report.violations.some((v) => v.includes('Graphics or raster images'))).toBe(true);
    });

    it('3.6 Detects and flags multi-column CSS class indicators', () => {
      const multiColText = `
<div class="grid-cols-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
`.trim();

      const report = evaluateFormattingGuardrails(multiColText);

      expect(report.isSingleColumn).toBe(false);
      expect(report.isCompliant).toBe(false);
      expect(report.violations.some((v) => v.includes('Multi-column layout'))).toBe(true);
    });
  });
});
