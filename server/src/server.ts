import { Client } from '@notionhq/client';
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
  const variations = [title];

  // Remove "detection" suffix if present (e.g., "linked list cycle detection" -> "linked list cycle")
  if (title.includes(' detection')) {
    variations.push(title.replace(' detection', ''));
  }

  // Try with roman numerals (e.g., "two sum" -> "two sum ii")
  const romanNumerals = [' ii', ' iii', ' iv'];
  romanNumerals.forEach((numeral) => {
    if (!title.includes(numeral)) {
      variations.push(title + numeral);
    }
  });

  // Try title case
  const titleCase = title.replace(/\b\w/g, (l) => l.toUpperCase());
  if (titleCase !== title) {
    variations.push(titleCase);
  }

  console.log(`[Title Variations] Generated ${variations.length} variations:`, variations);
  return variations;
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

    // 2. If not found, try variations of the title
    if (!page) {
      console.log(`Title "${problemTitle}" not found in Notion. Trying variations...`);
      const variations = getTitleVariations(problemTitle);

      for (const variation of variations) {
        if (variation === problemTitle) continue; // Skip original, already tried

        console.log(`Trying variation: "${variation}"`);
        page = await findPageInNotion(variation);

        if (page) {
          finalTitle = variation;
          console.log(`Found in Notion using variation: ${finalTitle}`);
          break;
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
