// Static settings for the content script (no Node imports here)
export const settings = {
  serverUrl: 'http://localhost:3099',
  selectorElement: '.submission-result-accepted',
  // Notification options: 'alert' to use window.alert, 'toast' to show in-page toast
  notifyMethod: 'toast',
  // Toast appearance (milliseconds)
  toastTimeoutMs: 4000,
  // Toast position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  toastPosition: 'bottom-right',
};
