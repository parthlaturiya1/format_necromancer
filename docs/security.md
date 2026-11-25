# Security notes

## CSP relaxations (D-07)
- `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`: the Next.js static export inlines small hydration scripts and styles. Replace with hashes if the export can emit them (revisit at T-22).
- `worker-src blob:`: reserved for Web Workers. Remove if workers load from `'self'` only.

Everything else is `'self'`: no remote origins, no framing (`frame-ancestors 'none'`).
