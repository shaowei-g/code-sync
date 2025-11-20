import { Client } from '@notionhq/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

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

app.post('/update-progress', async (req: Request, res: Response) => {
  const { problemTitle, problemUrl } = req.body as UpdateProgressRequest;

  if (!DATABASE_ID) {
    return res.status(500).json({ error: 'Missing NOTION_DATABASE_ID in environment variables' });
  }

  console.log(`Received update request for: ${problemTitle}`);

  try {
    // 1. Search for the problem in the Notion Database
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: problemTitle,
        },
      },
    });

    if (response.results.length === 0) {
      console.log(`Problem not found in Notion: ${problemTitle}`);
      return res.status(404).json({ message: 'Problem not found in Notion database.' });
    }

    const page = response.results[0];
    const pageId = page.id;

    // 2. Calculate Next Review Date (Fixed 2 days later as per plan)
    const today = new Date();
    const nextReviewDate = new Date();
    nextReviewDate.setDate(today.getDate() + 2);
    const nextReviewDateIso = nextReviewDate.toISOString().split('T')[0];

    console.log(`Updating page ${pageId}...`);

    // 3. Update the Page
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          select: { name: 'Completed' },
        },
        Reviewed: {
          checkbox: true,
        },
        'Review Date': {
          date: { start: nextReviewDateIso },
        },
      },
    });

    console.log(`Successfully updated: ${problemTitle}`);
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
