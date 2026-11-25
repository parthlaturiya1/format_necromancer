# Privacy

- Files you open stay in your browser. The recovery runs in a Web Worker on your device. Nothing is uploaded.
- No accounts, no cookies, no analytics and no third-party requests.
- The Content Security Policy (in `vercel.json`) sets `connect-src 'self'`, so the page cannot send data to other sites. Fonts, images and scripts also load only from this site.
- The site is static. There is no server code and no database.
- Hosting: the site is served by Vercel. Vercel keeps standard hosting logs, such as IP address and requested page. See [Vercel's privacy policy](https://vercel.com/legal/privacy-policy). We do not read or add to these logs.

Details of the CSP and its two relaxations: [security.md](security.md).
