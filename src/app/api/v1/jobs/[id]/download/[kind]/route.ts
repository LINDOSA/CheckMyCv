import { NextRequest, NextResponse } from 'next/server';
import { jobStore } from '@/lib/workforce/jobStore';
import { parseUserCvToStandardDocument } from '@/lib/cvStandardData';
import { createDocxFromStandardCV } from '@/lib/docxGenerator';
import { generatePdfBuffer } from '@/lib/pdfGenerator';
import { Packer } from 'docx';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; kind: string } }
) {
  const { id: jobId, kind } = params;
  const ctx = jobStore.getJob(jobId);

  if (!ctx) {
    return NextResponse.json(
      { error: `Job with ID '${jobId}' was not found.` },
      { status: 404 }
    );
  }

  const cvText = ctx.revised_cv || ctx.resume_text;
  const safeCompany = (ctx.company || 'Enterprise').replace(/[^a-zA-Z0-9]/g, '_');
  const safeRole = (ctx.role_title || 'Role').replace(/[^a-zA-Z0-9]/g, '_');

  try {
    // 1. DOCX EXPORT
    if (kind === 'cv_docx') {
      const standardDoc = parseUserCvToStandardDocument(cvText, ctx.role_title);
      const docxDoc = createDocxFromStandardCV(standardDoc);
      const buffer = await Packer.toBuffer(docxDoc);

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="CheckMyCV_${safeRole}_${safeCompany}.docx"`,
        },
      });
    }

    // 2. PDF EXPORT
    if (kind === 'cv_pdf') {
      const standardDoc = parseUserCvToStandardDocument(cvText, ctx.role_title);
      const buffer = await generatePdfBuffer(standardDoc);

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="CheckMyCV_${safeRole}_${safeCompany}.pdf"`,
        },
      });
    }

    // 3. SHORTLIST STRATEGY KIT
    if (kind === 'strategy_kit') {
      const content = ctx.strategy_pack || '# Shortlist Strategy Kit\n\nProcessing in progress...';
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="CheckMyCV_Shortlist_Kit_${safeCompany}.md"`,
        },
      });
    }

    // 4. INTERVIEW PREP PACK
    if (kind === 'interview_pack') {
      const content = ctx.interview_pack || '# Interview Prep Pack\n\nProcessing in progress...';
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="CheckMyCV_Interview_Pack_${safeCompany}.md"`,
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported download kind '${kind}'. Supported: cv_docx, cv_pdf, strategy_kit, interview_pack.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error(`[API /download/${kind}] Export error:`, err);
    return NextResponse.json(
      { error: `Failed to generate download: ${err?.message}` },
      { status: 500 }
    );
  }
}
