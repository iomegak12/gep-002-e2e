require('dotenv/config');

const env = {
  webUrl: process.env.WEB_URL || 'http://localhost:8080',
  userEmail: process.env.USER_EMAIL || 'admin@demo.local',
  userPassword: process.env.USER_PASSWORD || 'Passw0rd!',
  stepDelayMin: Number(process.env.STEP_DELAY_MIN_MS || '200'),
  stepDelayMax: Number(process.env.STEP_DELAY_MAX_MS || '300'),
};

module.exports = { env };
