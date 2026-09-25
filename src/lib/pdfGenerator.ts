import { jsPDF } from 'jspdf';
import { StandardCVDocument } from './cvStandardData';

/**
 * Native text-based single-column ATS PDF generator.
 * Employs clean linear flow, built-in vector fonts (Helvetica), selectable text,
 * zero raster images, and strict canonical ATS section hierarchy:
 * 1. Header (Name, Title, Contact)
 * 2. Professional Summary
 * 3. Core Skills (Skills Grid)
 * 4. Professional Experience
 * 5. Education & Certifications
 * 6. Additional Information
 * 7. Professional References
 */
export function createPdfFromStandardCV(data: StandardCVDocument): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 40;
  const rightMargin = 40;
  const topMargin = 40;
  const bottomMargin = 40;
  const contentWidth = pageWidth - leftMargin - rightMargin; // ~515 pt

  let y = topMargin;

  function ensureSpace(neededHeight: number) {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = topMargin;
    }
  }

  function drawSectionHeader(title: string) {
    ensureSpace(35);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(title, leftMargin, y);
    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.75);
    doc.line(leftMargin, y, leftMargin + contentWidth, y);
    y += 14;
  }

  // ==========================================================================
  // 1. CANDIDATE HEADER
  // ==========================================================================
  ensureSpace(70);

  // Candidate Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(data.name.toUpperCase(), leftMargin, y);
  y += 18;

  // Professional Title
  if (data.title) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(data.title, leftMargin, y);
    y += 16;
  }

  // Contact Info Line
  const contactParts = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    data.contact.nationality,
    data.contact.linkedin,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const contactLine = contactParts.join('  •  ');
    const wrappedContact = doc.splitTextToSize(contactLine, contentWidth);
    doc.text(wrappedContact, leftMargin, y);
    y += wrappedContact.length * 12 + 6;
  }

  // ==========================================================================
  // 2. PROFESSIONAL SUMMARY
  // ==========================================================================
  if (data.summary) {
    drawSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
    ensureSpace(summaryLines.length * 13);
    doc.text(summaryLines, leftMargin, y);
    y += summaryLines.length * 13 + 6;
  }

  // ==========================================================================
  // 3. CORE SKILLS (Preceding Experience per canonical ATS hierarchy)
  // ==========================================================================
  if (data.skillsGrid && data.skillsGrid.length > 0) {
    drawSectionHeader('Core Skills');
    data.skillsGrid.forEach((item) => {
      ensureSpace(18);
      doc.setFontSize(9);

      const categoryText = `${item.category}: `;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const catWidth = doc.getTextWidth(categoryText);

      // Render category prefix in bold, then wrap remaining skills
      const fullText = `${item.category}: ${item.skills}`;
      const wrappedLines = doc.splitTextToSize(fullText, contentWidth);

      ensureSpace(wrappedLines.length * 13);
      // Print first line with bold prefix
      doc.setFont('helvetica', 'bold');
      doc.text(categoryText, leftMargin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      const remainingFirstLine = doc.splitTextToSize(item.skills, contentWidth - catWidth);
      if (remainingFirstLine.length > 0) {
        doc.text(remainingFirstLine[0], leftMargin + catWidth, y);
      }

      // If text spans additional lines, print them indented
      if (remainingFirstLine.length > 1) {
        for (let i = 1; i < remainingFirstLine.length; i++) {
          y += 12;
          ensureSpace(12);
          doc.text(remainingFirstLine[i], leftMargin, y);
        }
      }
      y += 14;
    });
    y += 4;
  }

  // ==========================================================================
  // 4. PROFESSIONAL EXPERIENCE
  // ==========================================================================
  if (data.experience && data.experience.length > 0) {
    drawSectionHeader('Professional Experience');

    data.experience.forEach((exp) => {
      ensureSpace(40);

      // Line 1: Job Title & Company
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const titleLine = exp.company ? `${exp.title}  |  ${exp.company}` : exp.title;
      doc.text(titleLine, leftMargin, y);
      y += 13;

      // Line 2: Employment Dates
      if (exp.dates) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(exp.dates, leftMargin, y);
        y += 12;
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);

        exp.bullets.forEach((bullet) => {
          const bulletLines = doc.splitTextToSize(bullet, contentWidth - 14);
          ensureSpace(bulletLines.length * 12 + 4);

          // Draw bullet dot
          doc.text('•', leftMargin + 2, y);
          // Draw wrapped text
          doc.text(bulletLines, leftMargin + 12, y);
          y += bulletLines.length * 12 + 3;
        });
      }
      y += 8;
    });
  }

  // ==========================================================================
  // 5. EDUCATION & CERTIFICATIONS
  // ==========================================================================
  if (data.education && data.education.length > 0) {
    drawSectionHeader('Education & Certifications');

    data.education.forEach((edu) => {
      ensureSpace(28);

      // Qualification
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(edu.qualification, leftMargin, y);
      y += 12;

      // Institution & Year
      const details = [edu.institution, edu.certificationCode, edu.year]
        .filter(Boolean)
        .join('  |  ');
      if (details) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 70);
        doc.text(details, leftMargin, y);
        y += 14;
      }
    });
    y += 4;
  }

  // ==========================================================================
  // 6. ADDITIONAL INFORMATION
  // ==========================================================================
  if (data.additionalInfo) {
    const hasLanguages = Boolean(
      data.additionalInfo.languages && data.additionalInfo.languages.length > 0
    );
    const hasDriversLicense = Boolean(data.additionalInfo.driversLicense);
    const hasNoticePeriod = Boolean(data.additionalInfo.noticePeriod);
    const hasWorkEligibility = Boolean(data.additionalInfo.workEligibility);

    if (hasLanguages || hasDriversLicense || hasNoticePeriod || hasWorkEligibility) {
      drawSectionHeader('Additional Information');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      if (hasLanguages) {
        ensureSpace(14);
        doc.text(`Languages: ${data.additionalInfo.languages?.join(', ')}`, leftMargin, y);
        y += 13;
      }
      if (hasDriversLicense) {
        ensureSpace(14);
        doc.text(`Driver's License: ${data.additionalInfo.driversLicense}`, leftMargin, y);
        y += 13;
      }
      if (hasNoticePeriod) {
        ensureSpace(14);
        doc.text(`Availability & Notice: ${data.additionalInfo.noticePeriod}`, leftMargin, y);
        y += 13;
      }
      if (hasWorkEligibility) {
        ensureSpace(14);
        doc.text(`Work Authorization: ${data.additionalInfo.workEligibility}`, leftMargin, y);
        y += 13;
      }
      y += 4;
    }
  }

  // ==========================================================================
  // 7. PROFESSIONAL REFERENCES
  // ==========================================================================
  drawSectionHeader('Professional References');

  const referencesList = data.references && data.references.length > 0 ? data.references : null;

  if (referencesList && referencesList.length > 0) {
    referencesList.forEach((ref) => {
      ensureSpace(36);

      // Line 1: Name & Relationship
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      const nameLine = ref.relationship ? `${ref.name}  —  ${ref.relationship}` : ref.name;
      doc.text(nameLine, leftMargin, y);
      y += 12;

      // Line 2: Title & Company
      const roleLine = [ref.title, ref.company].filter(Boolean).join('  |  ');
      if (roleLine) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        doc.text(roleLine, leftMargin, y);
        y += 12;
      }

      // Line 3: Contact Line
      const contactArr = [
        ref.phone ? `Tel: ${ref.phone}` : null,
        ref.email ? `Email: ${ref.email}` : null,
        ref.location ? `Location: ${ref.location}` : null,
      ].filter(Boolean);

      if (contactArr.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(contactArr.join('  •  '), leftMargin, y);
        y += 14;
      }
    });
  } else {
    ensureSpace(16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    doc.text('References available upon request.', leftMargin, y);
    y += 16;
  }

  return doc;
}

/**
 * Generates a Node.js Buffer containing the binary PDF data.
 * Ideal for server-side Next.js route handlers (/api/export/pdf).
 */
export function generatePdfBuffer(data: StandardCVDocument): Buffer {
  const doc = createPdfFromStandardCV(data);
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a client-side Blob containing the binary PDF data.
 * Ideal for direct browser downloads.
 */
export function generatePdfBlob(data: StandardCVDocument): Blob {
  const doc = createPdfFromStandardCV(data);
  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}
