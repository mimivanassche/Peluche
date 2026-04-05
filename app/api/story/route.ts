import { NextResponse } from 'next/server';
import {
  extractResponseText,
  getTextModel,
  openaiRequest,
  parseJsonFromModelText,
} from '../../../lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

type StoryPage = {
  pageNumber: number;
  title: string;
  text: string;
};

type StoryResponse = {
  title: string;
  intro: string;
  pages: StoryPage[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const theme = typeof body?.theme === 'string' ? body.theme.trim() : '';
    const pelucheDescription = typeof body?.pelucheDescription === 'string' ? body.pelucheDescription.trim() : '';
    const personality = typeof body?.personality === 'string' ? body.personality.trim() : '';

    if (!name || !theme || !pelucheDescription) {
      return NextResponse.json({ error: 'Missing story information.' }, { status: 400 });
    }

    const storyResponse = await openaiRequest('/responses', {
      model: getTextModel(),
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You write child-friendly stories. Return only valid JSON with keys title, intro, and pages. Pages must be an array of exactly 7 items, each with pageNumber, title, and text. Keep the language simple, warm, and imaginative. No scary or violent elements.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Create a 7-page story for a peluche named ${name}. Theme: ${theme}. Peluche description: ${pelucheDescription}. Personality: ${personality}. Each page should feel like one comic-strip page.`,
            },
          ],
        },
      ],
    });

    const storyText = extractResponseText(storyResponse);
    const parsed = parseJsonFromModelText<StoryResponse>(storyText);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create the story.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
