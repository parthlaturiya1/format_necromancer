// Shared test with optional CPU throttling: PW_CPU_THROTTLE=4 makes Chromium run 4x slower (CDP Emulation.setCPUThrottlingRate),
// the way a 2-core CI runner behaves. Unset = no change.
import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
export const test = base.extend({
  page: async ({ page }, provide) => {
    const rate = Number(process.env.PW_CPU_THROTTLE ?? 1);
    if (rate > 1) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    }
    await provide(page);
  },
});

