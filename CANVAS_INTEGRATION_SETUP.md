# Canvas Integration Setup Guide

Canvas integration has been implemented! Follow these steps to complete the setup:

## 1. Run Database Migration

You need to add the `canvas_course_id` column to your classrooms table.

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `canvas-integration-migration.sql`
4. Click "Run"

The migration will:
- Add a `canvas_course_id` column to the `classrooms` table
- Create an index for better performance
- Add documentation for the new field

## 2. Verify Your Canvas API Key

Your Canvas API key is already configured in `.env.local`:
```
CANVAS_API_KEY=22119~kUkULrcHHH3w2TBULUJvvc6XV9HY4taLJCtyW6FRTRGCJkaVtQTZuer3tVffzNcT
```

The Canvas instance URL is set to: `https://canvas.its.virginia.edu/`

## 3. How to Use Canvas Integration

### Linking a Classroom to Canvas

1. Navigate to any classroom detail page
2. You'll see a new "Canvas Integration" section
3. Click the dropdown to see all your Canvas courses
4. Select the Canvas course you want to link
5. Click "Link"

### Pushing Study Materials to Canvas

1. Go to the classroom's "Insights & Study Materials" page
2. Generate study materials (slides, practice problems, study guide, or lesson plan)
3. After materials are generated, you'll see a "Push to Canvas" button
4. Click it to automatically:
   - Create a Canvas Page with the materials (HTML formatted)
   - Upload the materials as a downloadable Markdown file
   - Both will appear in the linked Canvas course

### What Students Will See

When you push materials to Canvas, students will see:
- **Canvas Page**: A nicely formatted page they can read directly in Canvas
- **Markdown File**: A downloadable file in the course Files section

## 4. Features Implemented

### API Routes Created:
- `/api/canvas/courses` - Get list of Canvas courses
- `/api/canvas/link-classroom` - Link/unlink classroom to Canvas course
- `/api/canvas/push-materials` - Push generated materials to Canvas

### Canvas API Helper (`lib/canvas.ts`):
- `getCanvasCourses()` - Fetch your Canvas courses
- `createCanvasPage()` - Create a Canvas page with content
- `uploadCanvasFile()` - Upload files to Canvas
- `createCanvasAnnouncement()` - Post announcements (available for future use)
- `markdownToCanvasHtml()` - Convert markdown to Canvas-compatible HTML

### UI Components:
- Canvas course linker dropdown (on classroom detail page)
- "Push to Canvas" button (on insights page)
- Link status indicator
- Error handling and user feedback

## 5. Permissions Required

Your Canvas API key needs these permissions:
- Read courses (to list your courses)
- Create/update pages (to push materials as pages)
- Upload files (to push materials as files)

If you encounter permission errors, you may need to regenerate your Canvas API token with the required scopes.

## 6. Troubleshooting

### "Canvas API error: 401"
- Your Canvas API key may be invalid or expired
- Regenerate a new token from Canvas: Account → Settings → New Access Token

### "Classroom is not linked to a Canvas course"
- You need to link the classroom first from the classroom detail page
- The "Push to Canvas" button will only work after linking

### "Failed to load Canvas courses"
- Check that your Canvas API key is correct in `.env.local`
- Verify you have teacher/instructor access to Canvas courses
- Ensure the Canvas instance URL is correct

## 7. Next Steps

Once the database migration is complete, you can:
1. Visit any classroom detail page
2. Link it to a Canvas course
3. Generate study materials from student questions
4. Push those materials directly to Canvas with one click!

Your students will see the materials in Canvas without any manual file uploading or copying.
