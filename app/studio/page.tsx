'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  imageDataUrl: string;
};

type StoryData = {
  title: string;
  intro: string;
  pages: StoryPage[];
};

const THEMES = ['Safari', 'Ocean', 'Space', 'Jungle', 'Castle', 'Rainbow'] as const;
const COLORS = [
  '#2563eb',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#a855f7',
  '#84cc16',
  '#0f172a',
  '#6b7280',
  '#92400e',
  '#fde68a',
  '#ffffff',
] as const;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 620;

export default function StudioPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [name, setName] = useState('Momo');
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('Safari');
  const [selectedColor, setSelectedColor] = useState<(typeof COLORS)[number]>('#2563eb');
  const [peluche, setPeluche] = useState<PelucheData | null>(null);
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
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 10;
    hasDrawingRef.current = false;
  }, [selectedColor]);

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
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + 0.1, point.y + 0.1);
      ctx.stroke();
      hasDrawingRef.current = true;
    },
    [getPoint, selectedColor],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const point = getPoint(event);
      const lastPoint = lastPointRef.current ?? point;
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPointRef.current = point;
      hasDrawingRef.current = true;
    },
    [getPoint, selectedColor],
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
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

      const payload = (await response.json()) as StoryData | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || 'Failed to create the story.');
      }

      const readerPayload = {
        peluche,
        story: payload as StoryData,
      };
      sessionStorage.setItem('peluche-reader-story', JSON.stringify(readerPayload));
      router.push('/reader');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
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
          and build a 4-page themed story.
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

          <div className={styles.colorPickerBlock}>
            <div className={styles.colorLabelRow}>
              <span className={styles.colorLabel}>Drawing color</span>
              <span className={styles.colorPreview} style={{ backgroundColor: selectedColor }} />
            </div>
            <div className={styles.swatchRow}>
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={color === selectedColor ? styles.swatchActive : styles.swatchButton}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Choose color ${color}`}
                  title={color}
                >
                  <span className={styles.swatchInner} style={{ backgroundColor: color }} />
                </button>
              ))}
            </div>
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
                <p className={styles.resultText}>
                  <strong>Personality:</strong> {peluche.personality}
                </p>
                <p className={styles.resultText}>
                  <strong>Catchphrase:</strong> {peluche.catchphrase}
                </p>
              </div>
              <button type="button" className={styles.primaryButton} onClick={handleCreateStory} disabled={isGeneratingStory}>
                {isGeneratingStory ? 'Creating story and page images…' : 'Create 4-page story'}
              </button>
            </div>
          )}
        </div>
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}
    </main>
  );
}
