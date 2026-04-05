'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './reader.module.css';

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

type ReaderPayload = {
  peluche: {
    name: string;
  };
  story: StoryData;
};

export default function ReaderPage() {
  const [payload] = useState<ReaderPayload | null>(() => {
    if (typeof window === 'undefined') return null;

    const raw = sessionStorage.getItem('peluche-reader-story');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as ReaderPayload;
    } catch {
      return null;
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  const pages = useMemo(() => payload?.story.pages?.slice(0, 4) ?? [], [payload]);
  const currentPage = pages[currentIndex];

  function goPrevious() {
    setCurrentIndex((value) => Math.max(value - 1, 0));
  }

  function goNext() {
    setCurrentIndex((value) => Math.min(value + 1, Math.max(pages.length - 1, 0)));
  }

  if (!payload || pages.length === 0 || !currentPage) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <h1 className={styles.title}>Story reader</h1>
          <p className={styles.copy}>No story is loaded yet. Create one from the studio first.</p>
          <Link href="/studio" className={styles.linkButton}>
            Back to studio
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <p className={styles.kicker}>{payload.peluche.name}&apos;s Bedtime Story</p>
        <h1 className={styles.title}>{payload.story.title}</h1>
        <p className={styles.copy}>{payload.story.intro}</p>

        <article className={styles.pageCard}>
          <div className={styles.pageMeta}>Page {currentPage.pageNumber} of 4</div>
          <h2 className={styles.pageTitle}>{currentPage.title}</h2>
          <img src={currentPage.imageDataUrl} alt={currentPage.title} className={styles.pageImage} />
          <p className={styles.pageText}>{currentPage.text}</p>
        </article>

        <div className={styles.controls}>
          <button type="button" onClick={goPrevious} disabled={currentIndex === 0} className={styles.navButton}>
            Previous page
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex >= pages.length - 1}
            className={styles.navButton}
          >
            Next page
          </button>
        </div>

        <Link href="/studio" className={styles.linkButton}>
          Create another story
        </Link>
      </section>
    </main>
  );
}
