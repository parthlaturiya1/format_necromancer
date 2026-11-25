import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="status-page">
      <section className="panel status-card" aria-labelledby="h-404">
        <p className="status-code mono" aria-hidden="true">404</p>
        <h1 id="h-404">Nothing is buried here</h1>
        <p>This page is not in the archive. Nothing was uploaded or lost.</p>
        <div className="actions"><Link className="btn" href="/">Back to the app</Link></div>
      </section>
    </main>
  );
}
