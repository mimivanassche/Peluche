import { NextResponse } from 'next/server';
import {
  extractResponseText,
  getImageModel,
  getVisionModel,
  openaiRequest,
  parseJsonFromModelText,
} from '../../../lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

type PelucheModelResponse = {
  shortDescription: string;
  imagePrompt: string;
  personality: string;
  catchphrase: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const drawingDataUrl = typeof body?.drawingDataUrl === 'string' ? body.drawingDataUrl : '';

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter a name for the peluche.' }, { status: 400 });
    }

    if (!drawingDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Please draw a peluche first.' }, { status: 400 });
    }

    const descriptionResponse = await openaiRequest('/responses', {
      model: getVisionModel(),
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You turn a child drawing into a safe plush character profile. Return only valid JSON with keys shortDescription, imagePrompt, personality, and catchphrase. Keep everything warm, playful, simple, and child-friendly.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `The peluche is named ${name}. Look at the drawing and turn it into a lovable plush toy hero. Preserve its main colors and shape.`,
            },
            {
              type: 'input_image',
              image_url: drawingDataUrl,
            },
          ],
        },
      ],
    });

    const descriptionText = extractResponseText(descriptionResponse);
    const parsed = parseJsonFromModelText<PelucheModelResponse>(descriptionText);

    const imageResponse = await openaiRequest('/images/generations', {
      model: getImageModel(),
      prompt: `Create a polished plush toy character portrait named ${name}. ${parsed.imagePrompt}. Keep it child-safe, soft, adorable, centered, and on a clean background.`,
      size: '1024x1024',
    });

    const imageBase64 = imageResponse?.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error('The peluche image was not returned.');
    }

    return NextResponse.json({
      name,
      description: parsed.shortDescription,
      personality: parsed.personality,
      catchphrase: parsed.catchphrase,
      imageDataUrl: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create the peluche.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
