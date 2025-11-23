import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
const envConfig = dotenv.config({ path: envPath }).parsed || {};

export const settings = {
  serverUrl: envConfig.SERVER_URL || 'http://localhost:3099',
  selectorElement: envConfig.SELECTOR_ELEMENT || '.submission-result-accepted',
  notifyMethod: envConfig.NOTIFY_METHOD || 'toast', // Notification options: 'alert' to use window.alert, 'toast' to show in-page toast
  toastTimeoutMs: Number(envConfig.TOAST_TIMEOUT_MS) || 4000, // Toast appearance (milliseconds)
  toastPosition: envConfig.TOAST_POSITION || 'bottom-right', // Toast position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
};
