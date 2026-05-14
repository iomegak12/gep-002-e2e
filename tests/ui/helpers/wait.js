const { env } = require('./env');

// Random pause in [stepDelayMin, stepDelayMax] inclusive.  Call between
// every user-visible action in a test so the page has time to settle and
// the run looks like a human is driving the browser.
async function pause(page) {
  const min = env.stepDelayMin;
  const max = env.stepDelayMax;
  const ms = min + Math.floor(Math.random() * (max - min + 1));
  await page.waitForTimeout(ms);
}

module.exports = { pause };
