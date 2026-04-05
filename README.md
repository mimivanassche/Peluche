# Peluche

Peluche is a responsive Next.js app for iPad and desktop where a child can:

1. draw and name a plush character,
2. turn the drawing into a virtual animated peluche,
3. choose a theme like safari or space,
4. generate a 4-page story with the peluche as the main character,
5. optionally illustrate each story page.

## Stack

- Next.js App Router
- OpenAI Node SDK
- Vercel-ready route handlers
- Touch-friendly HTML canvas drawing UI

## Features in this MVP

- Draw or import a plush sketch
- Friendly peluche interpretation from the drawing
- Character portrait generation with a gentle animation effect
- 4-page child-friendly story generation
- Automatic illustration for each story page with a dedicated reader view
- Works well on iPad and desktop browsers

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `OPENAI_API_KEY`: required
- `OPENAI_TEXT_MODEL`: optional, defaults to `gpt-4.1-mini`
- `OPENAI_VISION_MODEL`: optional, defaults to `gpt-4.1-mini`
- `OPENAI_IMAGE_MODEL`: optional, defaults to `gpt-image-1`

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the GitHub repo into Vercel.
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Deploy.

## Suggested next version

- Save peluches per child profile
- Voice narration for each page
- Printable PDF comic export
- Multi-language stories
- Parent dashboard and moderation review
