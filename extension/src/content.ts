import { settings } from './settings';

// Prevent duplicate submissions
let hasSubmitted = false;

console.log('LeetCode Notion Sync: Content script loaded.');

const observer = new MutationObserver((mutations) => {
  // Strategy 1: Look for the specific class for submission result
  const successElement = document.querySelector(settings.selectorElement);

  // Strategy 2: Fallback to checking text content (more brittle but useful as backup)
  // Note: Be careful not to match "Accepted" in other contexts (like discussion)
  // We check if it's likely a submission result area.
  const successText = document.body.innerText.includes('Accepted');

  // Refined check: Ensure we are on a problem page and likely just submitted

  if ((successElement || (successText && window.location.href.includes('/submissions/'))) && !hasSubmitted) {
    // Double check if it's actually "Accepted"
    if (successElement && !successElement.textContent?.includes('Accepted')) {
      return;
    }

    console.log('LeetCode Notion Sync: Accepted status detected!');

    // Extract Title from URL (more reliable)
    // URL format: https://neetcode.io/problems/linked-list-cycle-detection/question
    // or https://leetcode.com/problems/two-sum/
    const urlMatch = window.location.pathname.match(/\/problems\/([^/]+)/);
    let cleanTitle = '';

    if (urlMatch && urlMatch[1]) {
      cleanTitle = urlMatch[1].replace(/-/g, ' ');
      // Optional: Title Case (e.g. "two sum" -> "Two Sum")
      // cleanTitle = cleanTitle.replace(/\b\w/g, l => l.toUpperCase());
    } else {
      // Fallback to DOM scraping
      const titleElement = document.querySelector('div[data-cy="question-title"]');
      let rawTitle = titleElement ? (titleElement as HTMLElement).innerText : document.title;
      cleanTitle = rawTitle
        .replace(/^\d+\.\s*/, '')
        .replace(' - LeetCode', '')
        .replace(' - NeetCode', '')
        .trim();
    }

    console.log(`LeetCode Notion Sync: Detected Problem - ${cleanTitle}`);

    hasSubmitted = true;

    // Send to Node.js Server
    fetch(`${settings.serverUrl}/update-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemTitle: cleanTitle,
        problemUrl: window.location.href,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('LeetCode Notion Sync: Server response', data);
        if (data.success) {
          alert(`Notion Updated! Next review: ${data.nextReview}`);
        } else {
          console.warn('LeetCode Notion Sync: Update failed', data);
        }
      })
      .catch((err) => {
        console.error('LeetCode Notion Sync: Network error', err);
      });

    // Reset lock after 10 seconds to allow re-submission if needed
    setTimeout(() => {
      hasSubmitted = false;
    }, 10000);
  }
});

// Start observing
observer.observe(document.body, { childList: true, subtree: true });
