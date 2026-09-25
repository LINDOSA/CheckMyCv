import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx';
import { StandardCVDocument } from './cvStandardData';

/**
 * Creates a strictly single-column, ATS-compliant DOCX document.
 * Follows the canonical ATS hierarchy:
 * 1. Header (Name, Title, Contact)
 * 2. Professional Summary
 * 3. Core Skills (Skills Grid)
 * 4. Professional Experience
 * 5. Education & Certifications
 * 6. Additional Information (if any)
 * 7. Professional References
 *
 * Guaranteed 0 multi-cell tables, 0 text boxes, 0 sidebars, 0 graphics.
 */
export function createDocxFromStandardCV(data: StandardCVDocument): Document {
  const children: any[] = [
    // 1. CANDIDATE NAME
    new Paragraph({
      children: [
        new TextRun({
          text: data.name.toUpperCase(),
          bold: true,
          size: 30, // 15pt
          font: 'Arial',
          color: '000000',
        }),
      ],
      spacing: { after: 60 },
    }),

    // 2. PROFESSIONAL TITLE
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          size: 22, // 11pt
          font: 'Arial',
          color: '222222',
        }),
      ],
      spacing: { after: 100 },
    }),

    // 3. CONTACT INFO LINE (Linear single-column)
    new Paragraph({
      children: [
        new TextRun({
          text: [
            data.contact.email,
            data.contact.phone,
            data.contact.location,
            data.contact.nationality,
            data.contact.linkedin,
          ]
            .filter(Boolean)
            .join('    •    '),
          size: 18, // 9pt
          font: 'Arial',
          color: '444444',
        }),
      ],
      spacing: { after: 220 },
    }),

    // 4. PROFESSIONAL SUMMARY
    new Paragraph({
      children: [
        new TextRun({
          text: 'Professional Summary',
          bold: true,
          size: 22,
          font: 'Arial',
          color: '000000',
        }),
      ],
      border: {
        bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 8 },
      },
      spacing: { before: 180, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.summary,
          size: 19,
          font: 'Arial',
          color: '111111',
        }),
      ],
      spacing: { after: 180 },
    }),
  ];

  // 5. CORE SKILLS (Linear single-column category list - Preceding Experience per ATS standard)
  if (data.skillsGrid && data.skillsGrid.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Core Skills',
            bold: true,
            size: 22,
            font: 'Arial',
            color: '000000',
          }),
        ],
        border: {
          bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        spacing: { before: 180, after: 120 },
      })
    );

    data.skillsGrid.forEach((item) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.category}: `,
              bold: true,
              size: 19,
              font: 'Arial',
              color: '000000',
            }),
            new TextRun({
              text: item.skills,
              size: 18,
              font: 'Arial',
              color: '333333',
            }),
          ],
          spacing: { after: 60 },
        })
      );
    });
  }

  // 6. PROFESSIONAL EXPERIENCE (Linear single-column format - No tables)
  if (data.experience && data.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Professional Experience',
            bold: true,
            size: 22,
            font: 'Arial',
            color: '000000',
          }),
        ],
        border: {
          bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        spacing: { before: 180, after: 120 },
      })
    );

    data.experience.forEach((exp) => {
      // Line 1: Job Title and Company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title,
              bold: true,
              size: 20,
              font: 'Arial',
              color: '000000',
            }),
            new TextRun({
              text: exp.company ? `  |  ${exp.company}` : '',
              bold: true,
              size: 19,
              font: 'Arial',
              color: '222222',
            }),
          ],
          spacing: { before: 80, after: 20 },
        })
      );

      // Line 2: Employment Dates
      if (exp.dates) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.dates,
                italics: true,
                size: 18,
                font: 'Arial',
                color: '555555',
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }

      // Experience Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: bullet,
                  size: 18,
                  font: 'Arial',
                  color: '222222',
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        });
      }

      children.push(new Paragraph({ spacing: { after: 100 } }));
    });
  }

  // 7. EDUCATION & CERTIFICATIONS (Linear single-column format - No tables)
  if (data.education && data.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Education & Certifications',
            bold: true,
            size: 22,
            font: 'Arial',
            color: '000000',
          }),
        ],
        border: {
          bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        spacing: { before: 180, after: 120 },
      })
    );

    data.education.forEach((edu) => {
      // Line 1: Qualification Degree
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.qualification,
              bold: true,
              size: 19,
              font: 'Arial',
              color: '000000',
            }),
          ],
          spacing: { before: 80, after: 20 },
        })
      );

      // Line 2: Institution, Certification, and Graduation Year
      const eduDetails = [edu.institution, edu.certificationCode, edu.year]
        .filter(Boolean)
        .join('  |  ');

      if (eduDetails) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: eduDetails,
                size: 18,
                font: 'Arial',
                color: '444444',
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    });
  }

  // 8. ADDITIONAL INFORMATION (Languages & Work Eligibility)
  if (data.additionalInfo) {
    const hasLanguages = Boolean(
      data.additionalInfo.languages && data.additionalInfo.languages.length > 0
    );
    const hasDriversLicense = Boolean(data.additionalInfo.driversLicense);
    const hasNoticePeriod = Boolean(data.additionalInfo.noticePeriod);
    const hasWorkEligibility = Boolean(data.additionalInfo.workEligibility);
    const hasLegacyRefOnly = Boolean(
      data.additionalInfo.references && (!data.references || data.references.length === 0)
    );

    if (
      hasLanguages ||
      hasDriversLicense ||
      hasNoticePeriod ||
      hasWorkEligibility ||
      hasLegacyRefOnly
    ) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Additional Information',
              bold: true,
              size: 22,
              font: 'Arial',
              color: '000000',
            }),
          ],
          border: {
            bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 8 },
          },
          spacing: { before: 180, after: 120 },
        })
      );

      if (data.additionalInfo.languages && data.additionalInfo.languages.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Languages: ${data.additionalInfo.languages.join(', ')}`,
                size: 18,
                font: 'Arial',
                color: '222222',
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }

      if (data.additionalInfo.driversLicense) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Driver's License: ${data.additionalInfo.driversLicense}`,
                size: 18,
                font: 'Arial',
                color: '222222',
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }

      if (data.additionalInfo.noticePeriod) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Availability & Notice: ${data.additionalInfo.noticePeriod}`,
                size: 18,
                font: 'Arial',
                color: '222222',
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }

      if (data.additionalInfo.workEligibility) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Work Authorization: ${data.additionalInfo.workEligibility}`,
                size: 18,
                font: 'Arial',
                color: '222222',
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  // 9. PROFESSIONAL REFERENCES (Canonical ATS Closing Section)
  const referencesList = data.references && data.references.length > 0 ? data.references : null;
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Professional References',
          bold: true,
          size: 22,
          font: 'Arial',
          color: '000000',
        }),
      ],
      border: {
        bottom: { color: '000000', space: 2, style: BorderStyle.SINGLE, size: 8 },
      },
      spacing: { before: 200, after: 120 },
    })
  );

  if (referencesList && referencesList.length > 0) {
    referencesList.forEach((ref) => {
      // Line 1: Referee Name & Relationship
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ref.name,
              bold: true,
              size: 20,
              font: 'Arial',
              color: '000000',
            }),
            ref.relationship
              ? new TextRun({
                  text: `  —  ${ref.relationship}`,
                  size: 18,
                  font: 'Arial',
                  italics: true,
                  color: '444444',
                })
              : new TextRun({ text: '' }),
          ],
          spacing: { before: 80, after: 20 },
        })
      );

      // Line 2: Title & Company
      if (ref.title || ref.company) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: [ref.title, ref.company].filter(Boolean).join('  |  '),
                size: 18,
                font: 'Arial',
                bold: true,
                color: '222222',
              }),
            ],
            spacing: { after: 20 },
          })
        );
      }

      // Line 3: Direct Phone & Professional Email
      if (ref.phone || ref.email) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: [
                  ref.phone ? `Tel: ${ref.phone}` : null,
                  ref.email ? `Email: ${ref.email}` : null,
                  ref.location ? `Location: ${ref.location}` : null,
                ]
                  .filter(Boolean)
                  .join('    •    '),
                size: 17,
                font: 'Arial',
                color: '555555',
              }),
            ],
            spacing: { after: 140 },
          })
        );
      }
    });
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'References available upon request.',
            size: 18,
            font: 'Arial',
            color: '222222',
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 in margins
          },
        },
        children,
      },
    ],
  });
}

export async function generateDocxBlob(data: StandardCVDocument): Promise<Blob> {
  const doc = createDocxFromStandardCV(data);
  return await Packer.toBlob(doc);
}

export async function generateDocxBuffer(data: StandardCVDocument): Promise<Buffer> {
  const doc = createDocxFromStandardCV(data);
  return await Packer.toBuffer(doc);
}

export function downloadBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
