export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Peluche</span>
        <h1>Draw a peluche. Turn it into a story hero.</h1>
        <p className="hero-copy">
          This is the first live version of Peluche. The next step is adding the drawing canvas,
          peluche generation, and 7-page story flow directly in the app.
        </p>

        <div className="feature-grid">
          <article className="feature-card">
            <h2>1. Draw</h2>
            <p>Kids will draw one peluche on iPad or desktop.</p>
          </article>
          <article className="feature-card">
            <h2>2. Generate</h2>
            <p>The drawing will become a soft virtual peluche character.</p>
          </article>
          <article className="feature-card">
            <h2>3. Story</h2>
            <p>The peluche becomes the main character of a themed 7-page story.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
