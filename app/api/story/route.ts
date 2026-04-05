import { NextResponse } from 'next/server';
import {
  extractResponseText,
  getImageModel,
  getTextModel,
  openaiRequest,
  parseJsonFromModelText,
} from '../../../lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 120;

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

type StoryPageWithImage = StoryPage & {
  imageDataUrl: string;
};

function normalizeStory(parsed: StoryResponse): StoryResponse {
  const pages = Array.isArray(parsed.pages) ? parsed.pages.slice(0, 4) : [];

  while (pages.length < 4) {
    pages.push({
      pageNumber: pages.length + 1,
      title: `Page ${pages.length + 1}`,
      text: 'A cozy adventure continues.',
    });
  }

  const normalizedPages = pages.map((page, index) => ({
    pageNumber: index + 1,
    title: page.title?.trim() || `Page ${index + 1}`,
    text: page.text?.trim() || 'A cozy adventure continues.',
  }));

  const lastPage = normalizedPages[normalizedPages.length - 1];
  if (!lastPage.text.includes('Thank you & sleep tight!')) {
    lastPage.text = `${lastPage.text.replace(/[.!?\s]*$/, '')}. Thank you & sleep tight!`;
  }

  return {
    title: parsed.title?.trim() || 'A Peluche Adventure',
    intro: parsed.intro?.trim() || 'A warm bedtime tale begins.',
    pages: normalizedPages,
  };
}

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
                'You write child-friendly stories. Return only valid JSON with keys title, intro, and pages. Pages must be an array of exactly 4 items, each with pageNumber, title, and text. Keep the language simple, warm, and imaginative. No scary or violent elements. The final page text must end with: Thank you & sleep tight!',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Create a 4-page story for a peluche named ${name}. Theme: ${theme}. Peluche description: ${pelucheDescription}. Personality: ${personality}. Each page should feel like one comic-strip page.`,
            },
          ],
        },
      ],
    });

    const storyText = extractResponseText(storyResponse);
    const parsed = parseJsonFromModelText<StoryResponse>(storyText);
    const normalizedStory = normalizeStory(parsed);

    const consistencyAnchor = `Same plush toy in every page: ${name}. ${pelucheDescription}. Personality: ${personality}. Keep identical colors, shape, face, and outfit details across all illustrations.`;

    const pagesWithImages: StoryPageWithImage[] = [];

    for (const page of normalizedStory.pages) {
      const imageResponse = await openaiRequest('/images/generations', {
        model: getImageModel(),
        prompt: `${consistencyAnchor} Story page ${page.pageNumber} title: ${page.title}. Scene text: ${page.text}. Create a warm, child-friendly bedtime illustration. No text in the image.`,
        size: '1024x1024',
      });

      const imageBase64 = imageResponse?.data?.[0]?.b64_json;
      if (!imageBase64) {
        throw new Error(`Could not generate image for page ${page.pageNumber}.`);
      }

      pagesWithImages.push({
        ...page,
        imageDataUrl: `data:image/png;base64,${imageBase64}`,
      });
    }

    return NextResponse.json({
      ...normalizedStory,
      pages: pagesWithImages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create the story.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
