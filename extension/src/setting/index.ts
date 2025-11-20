import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const settings = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3099',
  selectorElement: process.env.SELECTOR_ELEMENT || '.submission-result-accepted',
};
