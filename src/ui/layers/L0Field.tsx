'use client';
import { useEffect, useRef } from 'react';

const GLYPHS = '0123456789ABCDEF';
const MAX_DPR = 2;
const STEP_MS = 33; // about 30 fps; this layer is decoration

type Drift = { x: number; y: number; speed: number; text: string; depth: number };

/** L0: faint drifting bytes behind everything. Canvas 2D. Paused when the tab is hidden; static under reduced motion. */
export function L0Field() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--muted').trim();
    const mono = css.getPropertyValue('--font-mono').trim();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let drifts: Drift[] = [];
    let raf = 0;
    let last = 0;
    let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const byte = () => GLYPHS[Math.floor(rnd() * 16)]! + GLYPHS[Math.floor(rnd() * 16)]!;

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const count = Math.min(70, Math.round((w * h) / 22000));
      drifts = Array.from({ length: count }, () => {
        const depth = rnd();
        return { x: rnd() * w, y: rnd() * h, depth, speed: 2 + depth * 9, text: Array.from({ length: 2 + Math.floor(rnd() * 4) }, byte).join('  ') };
      });
    };

    const draw = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      for (const d of drifts) {
        d.y -= d.speed * dt;
        if (d.y < -20) { d.y = h + 20; d.x = rnd() * w; }
        ctx.globalAlpha = 0.05 + d.depth * 0.09;
        ctx.font = `${10 + Math.round(d.depth * 6)}px ${mono}`;
        ctx.fillText(d.text, d.x, d.y);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < STEP_MS) return;
      draw(Math.min((t - last) / 1000, 0.1));
      last = t;
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const start = () => {
      stop();
      if (reduce.matches || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const onVisible = () => (document.hidden ? stop() : start());
    const onResize = () => { layout(); draw(0); start(); };

    layout();
    draw(0);
    start();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('resize', onResize);
    reduce.addEventListener('change', start);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('resize', onResize);
      reduce.removeEventListener('change', start);
    };
  }, []);

  return <canvas ref={ref} className="l0" aria-hidden="true" data-layer="L0" />;
}
