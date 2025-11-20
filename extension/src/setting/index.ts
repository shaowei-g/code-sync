import dotenv from 'dotenv';

dotenv.config();

export const settings = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3099',
  selectorElement: process.env.SELECTOR_ELEMENT || '.submission-result-accepted',
};
