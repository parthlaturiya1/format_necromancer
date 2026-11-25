# Privacy

- Files you open stay in your browser. The recovery runs in a Web Worker on your device. Nothing is uploaded.
- No accounts, no cookies, no analytics and no third-party requests.
- The Content Security Policy (in `vercel.json`) sets `connect-src 'self'`, so the page cannot send data to other sites. Fonts, images and scripts also load only from this site.
- Your browser's sessionStorage keeps two interface settings, in this tab only: `fn.speed` (animation speed) and `fn.reduced` (Reduce motion, `1` or `0`). Nothing else is stored. It is cleared when the tab closes. No file or file bytes go into it.
- The site is static. There is no server code and no database.
- Hosting: the site is served by Vercel. Vercel keeps standard hosting logs, such as IP address and requested page. See [Vercel's privacy policy](https://vercel.com/legal/privacy-policy). We do not read or add to these logs.

Details of the CSP and its two relaxations: [security.md](security.md).
