'use client';
import { useRef } from 'react';

/** A button that opens the file chooser. The file never leaves the browser (R-U6). */
export function FilePick({ label, className, onFile, testId }: { label: string; className: string; onFile: (f: File) => void; testId?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        aria-label={`${label} (file input)`}
        data-testid={testId}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = ''; // the same file can be chosen again
        }}
      />
      <button type="button" className={className} onClick={() => input.current?.click()}>{label}</button>
    </>
  );
}
