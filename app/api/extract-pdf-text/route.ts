import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Use Claude to extract text from PDF
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Please extract all the text content from this PDF document. This is an answer key for an assignment. Provide the complete text exactly as it appears, maintaining the structure and formatting as much as possible.',
            },
          ],
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    const extractedText = textContent && textContent.type === 'text' ? textContent.text : '';

    if (!extractedText) {
      return NextResponse.json(
        { error: 'Failed to extract text from PDF' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
    });
  } catch (error: any) {
    console.error('Error extracting PDF text:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract text from PDF' },
      { status: 500 }
    );
  }
}
