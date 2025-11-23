import { Client } from '@notionhq/client';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3099;

// Middleware
app.use(cors());
app.use(express.json());

// Notion Client
const notion = new Client({ auth: process.env.NOTION_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

interface UpdateProgressRequest {
  problemTitle: string;
  problemUrl: string;
}

// Helper function to search Notion with fuzzy matching
async function findPageInNotion(title: string) {
  if (!DATABASE_ID) return null;

  // Try exact match first
  let response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Name',
      title: {
        equals: title,
      },
    },
  });

  if (response.results.length > 0) {
    console.log(`[Notion Search] Found exact match for: "${title}"`);
    return response.results[0];
  }

  // Try contains match
  response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Name',
      title: {
        contains: title,
      },
    },
  });

  if (response.results.length > 0) {
    console.log(`[Notion Search] Found contains match for: "${title}"`);
    return response.results[0];
  }

  return null;
}

// Helper function to generate title variations
function getTitleVariations(title: string): string[] {
  const variations = new Set<string>([title]);

  // 1. Remove common suffixes
  const suffixesToRemove = [' detection', ' problem', ' solution', ' question'];
  suffixesToRemove.forEach((suffix) => {
    if (title.includes(suffix)) {
      variations.add(title.replace(suffix, ''));
    }
  });

  // 2. Remove articles (a, an, the)
  const withoutArticles = title.replace(/\b(a|an|the)\b\s*/gi, '');
  if (withoutArticles !== title) {
    variations.add(withoutArticles);
  }

  // 3. Try with roman numerals (i, ii, iii, iv, v)
  const romanNumerals = [' i', ' ii', ' iii', ' iv', ' v'];
  romanNumerals.forEach((numeral) => {
    if (!title.includes(numeral)) {
      variations.add(title + numeral);
    }
  });

  // 4. Try Title Case
  const titleCase = title.replace(/\b\w/g, (l) => l.toUpperCase());
  if (titleCase !== title) {
    variations.add(titleCase);
  }

  // 5. Try lowercase
  const lowercase = title.toLowerCase();
  if (lowercase !== title) {
    variations.add(lowercase);
  }

  // 6. Try removing numbers at the start (e.g., "226 invert binary tree" -> "invert binary tree")
  const withoutLeadingNumbers = title.replace(/^\d+\.\s*/, '');
  if (withoutLeadingNumbers !== title) {
    variations.add(withoutLeadingNumbers);
  }

  // 7. Try singular/plural conversions for common words
  if (title.endsWith('s') && title.length > 3) {
    variations.add(title.slice(0, -1)); // Remove trailing 's'
  } else if (!title.endsWith('s')) {
    variations.add(title + 's'); // Add trailing 's'
  }

  // 8. Replace common word variations
  const wordReplacements: Record<string, string[]> = {
    a: ['an', 'the'],
    an: ['a', 'the'],
    the: ['a', 'an'],
    tree: ['trees'],
    trees: ['tree'],
    list: ['lists'],
    lists: ['list'],
  };

  Object.entries(wordReplacements).forEach(([from, toList]) => {
    if (title.includes(` ${from} `)) {
      toList.forEach((to) => {
        variations.add(title.replace(` ${from} `, ` ${to} `));
      });
    }
  });

  const variationsArray = Array.from(variations);
  console.log(`[Title Variations] Generated ${variationsArray.length} variations:`, variationsArray);
  return variationsArray;
}

// Helper function to search Google for LeetCode problem title via Custom Search API
async function searchGoogleForLeetCode(problemTitle: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    console.warn('[Google Search] GOOGLE_API_KEY or GOOGLE_CX not configured; skipping Google search');
    return null;
  }

  try {
    const query = `${problemTitle} leetcode`;
    console.log(`[Google Search] (API) Searching for: "${query}"`);

    const url = 'https://www.googleapis.com/customsearch/v1';
    const { data } = await axios.get(url, {
      params: {
        key: apiKey,
        cx,
        q: query,
      },
    });

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.log('[Google Search] (API) No items in search result');
      return null;
    }

    // 僅取 leetcode.com/problems/... 的結果
    const candidates = (data.items as any[]).filter(
      (item) => typeof item.link === 'string' && item.link.includes('leetcode.com/problems/'),
    );

    if (candidates.length === 0) {
      console.log('[Google Search] (API) No LeetCode problem links found in items');
      return null;
    }

    const normalizedTitle = problemTitle.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 2 && w !== 'linked'); // 過濾太短/雜訊字

    const pickBest = (items: any[]): string | null => {
      for (const item of items) {
        const link: string = item.link;
        const m = link.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
        if (!m) continue;

        const slug = m[1];
        const fromSlug = slug.replace(/-/g, ' ').toLowerCase();

        const hasAllWords = titleWords.every((w) => fromSlug.includes(w));
        if (hasAllWords) {
          console.log(
            `[Google Search] (API) Picked slug "${slug}" for title "${problemTitle}" (matched words: ${titleWords.join(
              ', ',
            )})`,
          );
          return fromSlug;
        }
      }
      return null;
    };

    const preferred = pickBest(candidates);
    if (preferred) {
      return preferred;
    }

    // fallback：第一個符合的 leetcode 結果
    const first = candidates[0];
    const link: string = first.link;
    const m = link.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
    if (m) {
      const slug = m[1];
      const fromSlug = slug.replace(/-/g, ' ');
      console.log(`[Google Search] (API) Fallback slug "${slug}" -> title "${fromSlug}"`);
      return fromSlug;
    }

    console.log('[Google Search] (API) No suitable LeetCode problem found after filtering');
    return null;
  } catch (error) {
    console.error('[Google Search] (API) Error:', error);
    return null;
  }
}

app.post('/update-progress', async (req: Request, res: Response) => {
  const { problemTitle, problemUrl } = req.body as UpdateProgressRequest;

  if (!DATABASE_ID) {
    return res.status(500).json({ error: 'Missing NOTION_DATABASE_ID in environment variables' });
  }

  console.log(`Received update request for: ${problemTitle}`);
  console.log(`Problem URL: ${problemUrl}`);

  try {
    // 1. Try to find the problem with the original title
    let page = await findPageInNotion(problemTitle);
    let finalTitle = problemTitle;

    // // 2. If not found, try variations of the title
    // if (!page) {
    //   console.log(`Title "${problemTitle}" not found in Notion. Trying variations...`);
    //   const variations = getTitleVariations(problemTitle);

    //   for (const variation of variations) {
    //     if (variation === problemTitle) continue; // Skip original, already tried

    //     console.log(`Trying variation: "${variation}"`);
    //     page = await findPageInNotion(variation);

    //     if (page) {
    //       finalTitle = variation;
    //       console.log(`Found in Notion using variation: ${finalTitle}`);
    //       break;
    //     }
    //   }
    // }

    // 3. If still not found, try Google search
    if (!page) {
      console.log(`Variations failed. Trying Google search...`);
      const googleTitle = await searchGoogleForLeetCode(problemTitle);

      if (googleTitle) {
        console.log(`Trying Google result: "${googleTitle}"`);
        page = await findPageInNotion(googleTitle);

        if (page) {
          finalTitle = googleTitle;
          console.log(`Found in Notion using Google search result: ${finalTitle}`);
        }
      }
    }

    if (!page) {
      console.log(`Problem still not found in Notion: ${problemTitle}`);
      return res
        .status(404)
        .json({ message: `Problem "${problemTitle}" (and search result) not found in Notion database.` });
    }

    const pageId = page.id;

    // 3. Get existing completion dates
    let completionDates: string[] = [];
    const properties = (page as any).properties;

    if (properties['Completion Dates'] && properties['Completion Dates'].rich_text) {
      const richTextArray = properties['Completion Dates'].rich_text;
      if (richTextArray.length > 0) {
        const existingText = richTextArray[0].plain_text;
        try {
          completionDates = JSON.parse(existingText);
          console.log(`[Completion Dates] Found ${completionDates.length} existing dates`);
        } catch (e) {
          console.log(`[Completion Dates] Failed to parse existing dates, starting fresh`);
          completionDates = [];
        }
      }
    }

    // 4. Add current date to completion dates
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    // Only add if not already completed today
    if (!completionDates.includes(todayIso)) {
      completionDates.push(todayIso);
      console.log(`[Completion Dates] Added ${todayIso}, total: ${completionDates.length}`);
    } else {
      console.log(`[Completion Dates] Already completed today (${todayIso})`);
    }

    // 5. Calculate Next Review Date (2 days from today)
    const nextReviewDate = new Date();
    nextReviewDate.setDate(today.getDate() + 2);
    const nextReviewDateIso = nextReviewDate.toISOString().split('T')[0];

    console.log(`Updating page ${pageId}...`);

    // 6. Update the Page
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          checkbox: true,
        },
        Reviewed: {
          checkbox: true,
        },
        'Review Date': {
          date: { start: nextReviewDateIso },
        },
        'Completion Dates': {
          rich_text: [
            {
              text: {
                content: JSON.stringify(completionDates),
              },
            },
          ],
        },
      },
    });

    console.log(`Successfully updated: ${finalTitle}`);
    res.json({
      success: true,
      message: 'Notion updated successfully',
      nextReview: nextReviewDateIso,
    });
  } catch (error: any) {
    console.error('Error updating Notion:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
