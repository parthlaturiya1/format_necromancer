'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="status-page">
      <section className="panel status-card fail" role="alert" aria-labelledby="h-500">
        <p className="status-code mono" aria-hidden="true">500</p>
        <h1 id="h-500">The app stopped</h1>
        <p>Something broke inside this page. Your file stayed in your browser and was not sent anywhere.</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => reset()}>Try again</button>
          <Link className="btn ghost-btn" href="/">Start over</Link>
        </div>
      </section>
    </main>
  );
}
