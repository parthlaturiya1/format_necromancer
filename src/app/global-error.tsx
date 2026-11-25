'use client';
import '../ui/tokens.css';
import '../ui/shell.css';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="status-page">
          <section className="panel status-card fail" role="alert" aria-labelledby="h-500g">
            <p className="status-code mono" aria-hidden="true">500</p>
            <h1 id="h-500g">The app stopped</h1>
            <p>Something broke at the root of the page. Your file stayed in your browser and was not sent anywhere.</p>
            <div className="actions">
              <button type="button" className="btn" onClick={() => reset()}>Try again</button>
              {/* Full reload on purpose: the root layout failed, so the client router cannot be trusted. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="btn ghost-btn" href="/">Start over</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
