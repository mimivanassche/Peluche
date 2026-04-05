'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './studio.module.css';

type PelucheData = {
  name: string;
  description: string;
  personality: string;
  catchphrase: string;
  imageDataUrl: string;
};

type StoryPage = {
  pageNumber: number;
  title: string;
  text: string;
};

type StoryData = {
  title: string;
  intro: string;
  pages: StoryPage[];
};

const THEMES = ['Safari', 'Ocean', 'Space', 'Jungle', 'Castle', 'Rainbow'] as const;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 620;

export default function StudioPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [name, setName] = useState('Momo');
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('Safari');
  const [peluche, setPeluche] = useState<PelucheData | null>(null);
  const [story, setStory] = useState<StoryData | null>(null);
  const [error, setError] = useState<string>('');
  const [isGeneratingPeluche, setIsGeneratingPeluche] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 10;
    hasDrawingRef.current = false;
  }, []);

  useEffect(() => {
    prepareCanvas();
  }, [prepareCanvas]);

  const getPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      canvas.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      const point = getPoint(event);
      lastPointRef.current = point;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + 0.1, point.y + 0.1);
      ctx.stroke();
      hasDrawingRef.current = true;
    },
    [getPoint],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const point = getPoint(event);
      const lastPoint = lastPointRef.current ?? point;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPointRef.current = point;
      hasDrawingRef.current = true;
    },
    [getPoint],
  );

  const stopDrawing = useCallback((event?: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (event && canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  async function handleCreatePeluche() {
    setError('');
    setStory(null);

    if (!hasDrawingRef.current || !canvasRef.current) {
      setError('Please draw a peluche first.');
      return;
    }

    setIsGeneratingPeluche(true);

    try {
      const drawingDataUrl = canvasRef.current.toDataURL('image/png');
      const response = await fetch('/api/peluche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, drawingDataUrl }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create the peluche.');
      }

      setPeluche(payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsGeneratingPeluche(false);
    }
  }

  async function handleCreateStory() {
    if (!peluche) return;
    setError('');
    setIsGeneratingStory(true);

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: peluche.name,
          theme,
          pelucheDescription: peluche.description,
          personality: peluche.personality,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create the story.');
      }

      setStory(payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsGeneratingStory(false);
    }
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.heroCard}>
        <span className={styles.eyebrow}>Peluche Studio</span>
        <h1 className={styles.heroTitle}>Draw your peluche and turn it into a story hero.</h1>
        <p className={styles.heroCopy}>
          This is the working studio: draw one peluche, give it a name, generate the character,
          and build a 7-page themed story.
        </p>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>1. Draw your peluche</h2>

          <label className={styles.label}>
            Name
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>

          <div className={styles.themeRow}>
            {THEMES.map((item) => (
              <button
                key={item}
                type="button"
                className={item === theme ? styles.themeButtonActive : styles.themeButton}
                onClick={() => setTheme(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              onPointerCancel={stopDrawing}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={prepareCanvas}>
              Clear drawing
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleCreatePeluche} disabled={isGeneratingPeluche}>
              {isGeneratingPeluche ? 'Creating peluche…' : 'Create peluche'}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>2. Generated peluche</h2>

          {!peluche ? (
            <div className={styles.emptyState}>Your peluche will appear here after generation.</div>
          ) : (
            <div className={styles.resultBlock}>
              <img src={peluche.imageDataUrl} alt={peluche.name} className={styles.pelucheImage} />
              <div className={styles.textBlock}>
                <h3 className={styles.resultTitle}>{peluche.name}</h3>
                <p className={styles.resultText}>{peluche.description}</p>
                <p className={styles.resultText}><strong>Personality:</strong> {peluche.personality}</p>
                <p className={styles.resultText}><strong>Catchphrase:</strong> {peluche.catchphrase}</p>
              </div>
              <button type="button" className={styles.primaryButton} onClick={handleCreateStory} disabled={isGeneratingStory}>
                {isGeneratingStory ? 'Creating story…' : 'Create 7-page story'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>3. Story pages</h2>

        {!story ? (
          <div className={styles.emptyState}>Generate your peluche first, then create the story.</div>
        ) : (
          <div className={styles.storyBlock}>
            <div className={styles.storyHeader}>
              <h3 className={styles.storyTitle}>{story.title}</h3>
              <p className={styles.storyIntro}>{story.intro}</p>
            </div>
            <div className={styles.storyGrid}>
              {story.pages.map((page) => (
                <article key={page.pageNumber} className={styles.storyCard}>
                  <span className={styles.pageBadge}>Page {page.pageNumber}</span>
                  <h4 className={styles.storyCardTitle}>{page.title}</h4>
                  <p className={styles.storyCardText}>{page.text}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}
    </main>
  );
}
