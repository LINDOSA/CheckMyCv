import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/fileParser';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was uploaded. Please select a PDF, DOCX, or TXT file.' },
        { status: 400 }
      );
    }

    const fileName = file.name || 'document';
    const mimeType = file.type || '';
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The uploaded file is empty.' },
        { status: 400 }
      );
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File exceeds 10MB limit. Please upload a smaller document.' },
        { status: 400 }
      );
    }

    console.log(`[API /api/parse] Extracting text from ${fileName} (${mimeType}, ${buffer.length} bytes)...`);
    const extracted = await extractTextFromFile(buffer, fileName, mimeType);

    if (!extracted.text || extracted.text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Could not extract text from this document. It may be scanned as an image or password protected. Please paste your CV text directly.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extracted.text,
      wordCount: extracted.wordCount,
      fileName,
      format: extracted.format,
      compressionRatio: extracted.compressionRatio,
    });
  } catch (error: any) {
    console.error('[API /api/parse] Error parsing uploaded file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to parse file. Please try pasting your CV text directly.',
      },
      { status: 500 }
    );
  }
}
