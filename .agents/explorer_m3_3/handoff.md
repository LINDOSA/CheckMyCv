# Handoff Report: Milestone 3 Explorer 3 — Document Generation, ATS Formatting Guardrails & Automated Unit Testing

**Agent**: Explorer 3 (`explorer_m3_3`)  
**Parent**: Sub-Orchestrator M3 / Parent (`6970f867-7ae2-4688-9a6f-b6e5f8127c97`)  
**Timestamp**: 2026-09-17T12:07:00Z  
**Scope**: Milestone 3 (Automated CV Quality & Professional Standards Engine)  
**Status**: Investigation Complete — Ready for Implementation  

---

## 1. Observation

### 1.1 Existing Document Generation Architecture (`src/lib/docxGenerator.ts`)
Direct inspection of `src/lib/docxGenerator.ts` (lines 1–536) reveals the following concrete structural defects that violate enterprise ATS standards:

1. **Multi-Cell Header Table in Experience Section (Lines 119–154)**:
   ```typescript
   // Lines 120-153 in src/lib/docxGenerator.ts:
   const headerTable = new Table({
     width: { size: 100, type: WidthType.PERCENTAGE },
     borders: borderNone,
     rows: [
       new TableRow({
         children: [
           new TableCell({
             width: { size: 75, type: WidthType.PERCENTAGE },
             borders: borderNone,
             children: [
               new Paragraph({
                 children: [
                   new TextRun({ text: exp.title, bold: true, size: 20, font: 'Arial' }),
                   new TextRun({ text: exp.company ? `, ${exp.company}` : '', size: 20, font: 'Arial', color: '333333' }),
                 ],
               }),
             ],
           }),
           new TableCell({
             width: { size: 25, type: WidthType.PERCENTAGE },
             borders: borderNone,
             children: [
               new Paragraph({
                 alignment: AlignmentType.RIGHT,
                 children: [
                   new TextRun({ text: exp.dates || '', bold: true, size: 18, font: 'Arial', color: '222222' }),
                 ],
               }),
             ],
           }),
         ],
       }),
     ],
   });
   children.push(headerTable);
   ```
   *Defect*: Uses a 2-cell table per experience entry to right-align the date. Enterprise ATS parsers (Taleo, Workday, iCIMS) frequently misread multi-cell tables as column breaks or skip right-hand cells, corrupting employment date attribution.

2. **Multi-Cell Header Table in Education Section (Lines 190–233)**:
   ```typescript
   // Lines 190-233 in src/lib/docxGenerator.ts:
   const eduTable = new Table({
     width: { size: 100, type: WidthType.PERCENTAGE },
     borders: borderNone,
     rows: [
       new TableRow({
         children: [
           new TableCell({
             width: { size: 80, type: WidthType.PERCENTAGE },
             ...
           }),
           new TableCell({
             width: { size: 20, type: WidthType.PERCENTAGE },
             ...
           }),
         ],
       }),
     ],
   });
   children.push(eduTable);
   ```
   *Defect*: Uses an 80%/20% 2-cell table for qualification and graduation year.

3. **Multi-Column Side-by-Side Table in Core Skills (Lines 258–304)**:
   ```typescript
   // Lines 258-303 in src/lib/docxGenerator.ts:
   const skillPairs = [];
   for (let i = 0; i < data.skillsGrid.length; i += 2) {
     skillPairs.push([data.skillsGrid[i], data.skillsGrid[i + 1]]);
   }

   const skillsTable = new Table({
     width: { size: 100, type: WidthType.PERCENTAGE },
     borders: borderNone,
     rows: skillPairs.map(([left, right]) => {
       return new TableRow({
         children: [
           new TableCell({
             width: { size: 50, type: WidthType.PERCENTAGE },
             ...
           }),
           new TableCell({
             width: { size: 50, type: WidthType.PERCENTAGE },
             ...
           }),
         ],
       });
     }),
   });
   children.push(skillsTable);
   ```
   *Defect*: Forces skills into a 2-column side-by-side grid (`Table` with 50%/50% width cells). When ATS systems read across rows horizontally, skills from category A in cell 1 and category B in cell 2 are mashed together into unparseable strings (e.g., "Frontend Systems Engineering React, Next.js Docker, Kubernetes"), degrading keyword matching.

4. **Section Architecture Violation (Lines 72–404)**:
   The current section sequence in `docxGenerator.ts` is:
   - Header (Name, Title, Contact) (Lines 24–70)
   - Professional Summary (Lines 72–98)
   - Professional Experience (Lines 100–167)
   - Education & Certifications (Lines 169–236)
   - Core Skills (Lines 238–304)
   - Additional Information (Lines 306–401)
   - Professional References (Lines 403–505)
   
   *Defect*: Core Skills is positioned **after** Education and Experience. Section 3 of `ORIGINAL_REQUEST.md` (R2) and `PROJECT.md` (lines 22, 59, 143) strictly requires the standard ATS hierarchy:  
   **Summary -> Skills Grid -> Experience -> Education -> References**.

### 1.2 PDF Generation Analysis (`src/components/StandardCvPaperView.tsx` & Missing Server Route)
1. In `src/components/StandardCvPaperView.tsx` (lines 98–149):
   ```typescript
   const html2canvas = (await import('html2canvas')).default;
   const { jsPDF } = await import('jspdf');

   const canvas = await html2canvas(paperRef.current, {
     scale: 2,
     useCORS: true,
     logging: false,
     backgroundColor: '#ffffff',
   });

   const imgData = canvas.toDataURL('image/jpeg', 0.98);
   const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
   ...
   pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
   ```
   *Defect*: The current PDF export does NOT output text. It captures a browser canvas screenshot and converts it into a raster JPEG image inside a PDF envelope.
   *Consequence*: Enterprise ATS parsers cannot extract a single word of text from raster images. The CV score in any automated recruiter funnel becomes 0%.
2. Server-side PDF export route does not exist:
   - `src/app/api/export/docx/route.ts` exists (lines 1–119).
   - `src/app/api/export/pdf/route.ts` is missing completely.
   - `src/lib/pdfGenerator.ts` does not exist.
3. Dependencies present in `package.json`:
   - `"jspdf": "^4.2.1"` (Installed)
   - `"pdf-parse": "^1.1.1"` (Installed, devDependency `@types/pdf-parse: ^1.1.4`)
   - `"mammoth": "^1.8.0"` (Installed)
   - `"docx": "^9.7.1"` (Installed)

---

## 2. Logic Chain

### 2.1 Refactoring `docxGenerator.ts` for Strict Single-Column ATS Standards
From Observation 1.1, `docxGenerator.ts` fails ATS standards due to three multi-cell table implementations and incorrect section ordering.

#### Elimination of Multi-Cell Tables
1. **Experience Section**: Replace `headerTable` (`new Table` with 2 cells) with linear paragraphs:
   - Line A (Job Title & Company):  
     ```typescript
     new Paragraph({
       children: [
         new TextRun({ text: exp.title, bold: true, size: 20, font: 'Arial', color: '000000' }),
         new TextRun({ text: exp.company ? `  |  ${exp.company}` : '', bold: true, size: 19, font: 'Arial', color: '222222' }),
       ],
       spacing: { before: 80, after: 20 },
     })
     ```
   - Line B (Dates & Location):  
     ```typescript
     new Paragraph({
       children: [
         new TextRun({ text: exp.dates || '', italics: true, size: 18, font: 'Arial', color: '555555' }),
       ],
       spacing: { after: 60 },
     })
     ```
   - Bullets follow immediately as standard `Paragraph` with `bullet: { level: 0 }`.

2. **Education Section**: Replace `eduTable` (`new Table` with 2 cells) with linear paragraphs:
   - Line A (Qualification):  
     ```typescript
     new Paragraph({
       children: [
         new TextRun({ text: edu.qualification, bold: true, size: 19, font: 'Arial', color: '000000' }),
       ],
       spacing: { before: 80, after: 20 },
     })
     ```
   - Line B (Institution, Certification, Year):  
     ```typescript
     new Paragraph({
       children: [
         new TextRun({
           text: [edu.institution, edu.certificationCode, edu.year].filter(Boolean).join('  |  '),
           size: 18,
           font: 'Arial',
           color: '444444',
         }),
       ],
       spacing: { after: 60 },
     })
     ```

3. **Core Skills Grid**: Replace `skillsTable` (2-column side-by-side table) with a clean linear category list:
   - Top-to-bottom layout where each skill category is its own paragraph:
     ```typescript
     data.skillsGrid.forEach((item) => {
       children.push(
         new Paragraph({
           children: [
             new TextRun({ text: `${item.category}: `, bold: true, size: 19, font: 'Arial', color: '000000' }),
             new TextRun({ text: item.skills, size: 18, font: 'Arial', color: '333333' }),
           ],
           spacing: { after: 60 },
         })
       );
     });
     ```
   - Result: 0 tables in the entire document, 0 columns, 100% linear top-to-bottom reading stream.

4. **Section Reordering**:
   Move Core Skills block immediately after Professional Summary:
   1. Candidate Header (Name, Title, Contact)
   2. Professional Summary
   3. Core Skills (Skills Grid)
   4. Professional Experience
   5. Education & Certifications
   6. Additional Information (if present)
   7. Professional References

---

### 2.2 Designing `src/lib/pdfGenerator.ts` (Native Text Single-Column ATS Engine)
From Observation 1.2, `html2canvas` produces unselectable images. `jspdf` (v4.2.1) is installed and can generate vector PDF documents in pure Node.js as well as the browser.

#### Architecture of `src/lib/pdfGenerator.ts`
1. **Core Settings**:
   - Page format: A4 (`portrait`, unit `pt`: 595.28 pt width, 841.89 pt height).
   - Standard margins: `leftMargin = 40`, `rightMargin = 40`, `topMargin = 40`, `bottomMargin = 40`.
   - Usable content width: `595.28 - 80 = 515.28 pt`.
   - Fonts: Standard built-in PDF Type 1 font family (`helvetica`, `helvetica-bold`, `helvetica-oblique`). Built-in fonts require zero external network font fetching, load instantaneously in Node.js and browser, and embed standard glyph encodings that all ATS engines parse accurately.

2. **Pagination & Layout Engine**:
   A deterministic cursor `y` maintains current vertical position.
   ```typescript
   function ensureVerticalSpace(doc: jsPDF, neededHeight: number, currentY: number): number {
     const pageHeight = doc.internal.pageSize.getHeight();
     const bottomLimit = pageHeight - 40;
     if (currentY + neededHeight > bottomLimit) {
       doc.addPage();
       return 40; // Reset to topMargin
     }
     return currentY;
   }
   ```

3. **Text Wrapping & Rendering**:
   Use `doc.splitTextToSize(text, maxWidth)` to compute wrapped lines:
   - **Section Headers**: Font size 12pt bold, dark color (`#000000`), with an accent rule drawn via `doc.setDrawColor(200, 200, 200)` and `doc.line(40, y + 2, 555, y + 2)`.
   - **Summary Paragraph**: Font size 9.5pt regular, line height factor 1.35.
   - **Skills Grid**: Font size 9pt; category in bold (`doc.setFont('helvetica', 'bold')`), followed by comma-separated skills in normal font (`doc.setFont('helvetica', 'normal')`).
   - **Experience**:
     - Job title & company on line 1 (10pt bold).
     - Dates on line 2 (8.5pt italic/muted).
     - Bullets rendered with a bullet glyph (`\u2022`) at `leftMargin + 4`, with bullet text wrapped at `leftMargin + 14` with width `515.28 - 14`.
   - **Education**: Degree (9.5pt bold) followed by institution | year (9pt regular).
   - **References**: Referee Name — Relationship (9.5pt bold), Title | Company (9pt), Contact line (8.5pt).

4. **Output Formats**:
   - `generatePdfBuffer(data: StandardCVDocument): Buffer`: For Node.js API routes (`/api/export/pdf`). Uses `doc.output('arraybuffer')` converted to `Buffer.from(...)`.
   - `generatePdfBlob(data: StandardCVDocument): Blob`: For client-side direct downloads in `StandardCvPaperView.tsx`. Uses `new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })`.

5. **Elimination of `html2canvas` in `StandardCvPaperView.tsx`**:
   Replace the canvas screenshot in `handleDownloadPdf` with a direct call to `generatePdfBlob(editableCv)`, producing instantaneous, ultra-sharp vector PDFs with 100% selectable text and zero raster image bloat.

---

### 2.3 Designing Formatting Guardrails Validation in `cvQualityEngine.ts`
The contract required by `PROJECT.md` and `SCOPE.md` is:
```typescript
export interface FormattingGuardrailReport {
  isSingleColumn: boolean;
  hasMultiCellTables: boolean;
  hasTextBoxes: boolean;
  hasGraphics: boolean;
  isCompliant: boolean;
  violations: string[];
}
```

To guarantee robustness, the validation engine should support dual-mode inspection:
1. **Semantic CV Data Validation** (`validateCvDataFormatting(cv: StandardCVDocument | any)`):
   - Inspects `cv.skillsGrid`: validates that each item is structured linearly (category + comma-delimited string), not as two-column pairs.
   - Inspects sections: checks that no embedded tables, HTML tags (`<table>`, `<td>`, `<div style="column-count: 2">`), or multi-column layout flags exist.
   - Inspects image/graphic fields: checks that no base64 images, graphic URLs, or avatar text-boxes exist.

2. **Document AST / OOXML Inspection** (`validateDocxStructure(docOrBuffer: Document | Buffer)`):
   - If passed a `docx.Document` instance:
     - Scans `doc.sections`:
       - Column count check: verifies `section.properties?.page?.columns?.count === 1` or undefined (default single column). If `> 1`, `isSingleColumn = false`.
       - Scans `section.children`:
         - If any child is a `Table`:
           - Inspect each `TableRow`. If any row has `children.length > 1` (more than 1 cell), set `hasMultiCellTables = true`, `isSingleColumn = false`, and push violation: `'Multi-cell table detected (row contains ${row.children.length} cells). ATS requires pure linear single-column layout.'`.
         - Text box check: checks if any element has `txbxContent` or drawing coordinates. If so, `hasTextBoxes = true`.
         - Graphics check: checks for `ImageRun` or drawing shapes. If so, `hasGraphics = true`.
   - If passed a Buffer (DOCX ZIP archive):
     - Inspects `word/document.xml`:
       - Searches for `<w:tbl>` with multiple `<w:tc>` per `<w:tr>`.
       - Searches for `<w:drawing>`, `<w:pict>`, `<a:blip>`.
       - Searches for `<w:txbxContent>`.
       - Searches for `<w:cols w:num="2">`.

3. **PDF Buffer Inspection** (`validatePdfStructure(pdfBuffer: Buffer)`):
   - Verifies magic header `%PDF-`.
   - Selectable text extraction via `pdf-parse`: verifies `text.length > 200` (rejects empty/image-only PDFs).
   - Searches raw PDF stream for `/Subtype /Image` or `Do` image drawing operators. If present without text, sets `hasGraphics = true`.
   - Verifies that `isSingleColumn = true`, `hasMultiCellTables = false`, `hasTextBoxes = false`, `hasGraphics = false`, and `isCompliant = true`.

---

### 2.4 Designing Automated Unit Test Strategy
For Milestone 3.4, automated unit tests should be configured using Vitest (co-located or under `tests/unit/`).

#### Test Suite 1: `tests/unit/docxGenerator.test.ts`
| Test Case | Inputs | Assertions |
|-----------|--------|------------|
| 1. Pure Single-Column Layout | `STANDARD_CV_ALEX` | Document sections have 0 multi-cell tables (`doc.sections[0].children.filter(c => c instanceof Table).length === 0`). |
| 2. Section Order Compliance | `STANDARD_CV_ALEX` | Section headers appear in exact order: "Professional Summary" -> "Core Skills" -> "Professional Experience" -> "Education & Certifications" -> "Professional References". |
| 3. Experience Rendering | `STANDARD_CV_DAVID` | Job titles and dates are rendered as linear paragraphs; bullets use standard bullet properties without table wrapper. |
| 4. Skills Rendering | `STANDARD_CV_MARCUS`| Skills categories are rendered as sequential linear paragraphs; no 2-column table is generated. |
| 5. Buffer Generation & Guardrail Pass | Generated Buffer | Packed DOCX buffer generates valid zip; passing buffer to `validateDocxStructure()` returns `isCompliant: true`, `violations: []`. |

#### Test Suite 2: `tests/unit/pdfGenerator.test.ts`
| Test Case | Inputs | Assertions |
|-----------|--------|------------|
| 1. Valid PDF Buffer Generation | `STANDARD_CV_ALEX` | Returns `Buffer` starting with `%PDF-`, byte length > 2KB. |
| 2. Selectable Text Verification | Generated PDF Buffer | `pdf-parse` extracts candidate name "ALEX MORGAN", "Professional Summary", "Core Skills", "Professional Experience", and verified skills. Text length > 500 characters. |
| 3. Section Sequence in Extracted Text | Generated PDF Buffer | `text.indexOf("Professional Summary") < text.indexOf("Core Skills") < text.indexOf("Professional Experience") < text.indexOf("Education") < text.indexOf("References")`. |
| 4. Multi-Page Pagination | Long CV (Elena Rostova) | Generates valid multi-page PDF (`doc.getNumberOfPages() >= 2`), text does not clip or overlap page boundaries. |
| 5. Zero Graphics / Raster Images | Generated PDF Buffer | Raw PDF content contains zero `/Subtype /Image` or `/DCTDecode` raster streams. |

#### Test Suite 3: `tests/unit/cvQualityEngine.test.ts`
| Test Case | Inputs | Assertions |
|-----------|--------|------------|
| 1. Metric Saturation >= 40% | CV with 5 out of 10 quantified bullets | `metricSaturation: 0.5`, `isMetricSaturationCompliant: true`. |
| 2. Metric Saturation < 40% | CV with 1 out of 10 quantified bullets | `metricSaturation: 0.1`, `isMetricSaturationCompliant: false`, flags critical issue. |
| 3. XYZ Formula Compliance | Bullet: "Spearheaded zero-touch provisioning using Intune, cutting laptop deployment time by 68% and saving $24,000." | `hasActionVerb: true`, `hasQuantifiableMetric: true`, `hasBusinessOutcome: true`, `isXyzCompliant: true`. |
| 4. Incomplete Bullet Evaluation | Bullet: "Responsible for managing helpdesk tickets and assisting users." | `hasActionVerb: false` ("Responsible for"), `hasQuantifiableMetric: false`, `hasBusinessOutcome: false`, `isXyzCompliant: false`, provides actionable rewrite suggestion. |
| 5. Contact Integrity Check | Valid name, phone, email, location | `contactIntegrity.isValid: true`, `issues: []`. |
| 6. Contact Missing Phone / Email | Name only, missing phone | `contactIntegrity.hasPhoneNumber: false`, `isValid: false`, critical issue flagged. |
| 7. Section Architecture Validator | Correct hierarchy vs Out-of-order | Scrambled order returns `isHierarchyCompliant: false`, lists specific misplaced sections. |
| 8. Formatting Guardrail Validator | Single-column doc vs Multi-cell table doc | Multi-cell table triggers `hasMultiCellTables: true`, `isCompliant: false`. |
| 9. References Preservation | Real references vs Hallucinated | Preserves candidate's exact referees and contact info; never injects fake names or numbers. |
| 10. Composite Score Calculation | Executive profile vs Degraded profile | Executive scores 90-100 (`isSubmissionReady: true`); degraded scores < 60 (`isSubmissionReady: false`). |

---

## 3. Caveats
1. **Vitest Package Setup**: `package.json` currently lacks `"test": "vitest"` and `vitest` in `devDependencies`. M1 / E2E-Track is responsible for the root test infrastructure installation, while M3 creates the unit test files. Unit tests designed here are 100% compatible with Vitest or Jest.
2. **Backward Compatibility of `StandardCVDocument`**: The existing frontend paper view (`StandardCvPaperView.tsx`) splits skills into two columns for web presentation (`leftSkills`, `rightSkills`). The frontend display can remain visually balanced for browser viewing, but the exported DOCX and PDF must strictly use single-column layouts for ATS compatibility.
3. **No External Fonts for PDF**: Using custom TrueType fonts in `jspdf` requires embedding base64 binary font files. To maintain deterministic, lightweight, fast generation across Node.js and the browser, the standard Type 1 `helvetica` font family is recommended.

---

## 4. Conclusion
1. **`docxGenerator.ts` Refactoring**:
   - Eliminate all three `Table` instances (Experience header, Education header, and Core Skills 2-column grid).
   - Reorder sections to strictly enforce ATS hierarchy: **Summary -> Core Skills -> Experience -> Education -> References**.
   - Output pure linear single-column OOXML documents that pass all enterprise ATS parsers with 100% fidelity.
2. **`pdfGenerator.ts` Creation**:
   - Build a standalone native text PDF generator using `jspdf` with built-in Helvetica font, coordinate calculation, and automatic page splitting.
   - Replace the `html2canvas` raster image hack in `StandardCvPaperView.tsx`.
   - Wire `generatePdfBuffer` into the future `/api/export/pdf` route for server-verified native text PDF exports.
3. **Formatting Guardrails in `cvQualityEngine.ts`**:
   - Implement `FormattingGuardrailReport` checking `isSingleColumn`, `hasMultiCellTables`, `hasTextBoxes`, `hasGraphics`, and `isCompliant`.
   - Provide dual inspection for both CV data models and rendered document structures/buffers.
4. **Automated Unit Testing**:
   - Deliver 3 comprehensive test suites covering all XYZ formula rules, contact integrity, section architecture, references preservation, DOCX structure, and PDF text extractability.

---

## 5. Verification Method

### 5.1 Codebase Inspection Verification
1. Inspect `src/lib/docxGenerator.ts`:
   - Search for `new Table` or `TableCell`. If refactored correctly, count should be **0**.
   - Search for section titles: confirm `Professional Summary` is followed by `Core Skills`, followed by `Professional Experience`.
2. Inspect `src/lib/pdfGenerator.ts`:
   - Confirm file exists and exports `generatePdfBuffer` and `generatePdfBlob`.
   - Confirm `html2canvas` is **not** imported.
3. Inspect `src/lib/cvQualityEngine.ts`:
   - Confirm `auditCvQuality` implements all six interface reports including `FormattingGuardrailReport`.

### 5.2 Test Execution Verification
Once Vitest is installed in the project:
```bash
# Run all M3 unit tests
npx vitest run tests/unit/cvQualityEngine.test.ts tests/unit/docxGenerator.test.ts tests/unit/pdfGenerator.test.ts
```
Expected output:
- All bullet evaluation and metric saturation tests pass.
- DOCX generation produces valid buffer with 0 tables and compliant hierarchy.
- PDF generation produces valid buffer with extractable text matching candidate details.
- Guardrail validation returns `isCompliant: true` for generated outputs.

### 5.3 Invalidation Conditions
- Any occurrence of `new Table(` with multiple cells in `src/lib/docxGenerator.ts`.
- Any raster image or canvas capture in `src/lib/pdfGenerator.ts`.
- Skills Grid appearing after Experience or Education in exported documents.
- `auditCvQuality()` returning `hasMultiCellTables: true` on generated output.
