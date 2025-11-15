/**
 * Canvas LMS API Client
 * Documentation: https://canvas.instructure.com/doc/api/
 */

const CANVAS_API_URL = 'https://canvas.its.virginia.edu/api/v1';
const CANVAS_API_KEY = process.env.CANVAS_API_KEY;

if (!CANVAS_API_KEY) {
  console.warn('CANVAS_API_KEY is not set. Canvas integration will not work.');
}

interface CanvasPageOptions {
  courseId: string;
  title: string;
  body: string;
  published?: boolean;
}

interface CanvasFileOptions {
  courseId: string;
  fileName: string;
  content: string;
  contentType?: string;
  folderId?: string;
}

interface CanvasAnnouncementOptions {
  courseId: string;
  title: string;
  message: string;
}

/**
 * Create a page in a Canvas course
 */
export async function createCanvasPage(options: CanvasPageOptions): Promise<any> {
  const { courseId, title, body, published = true } = options;

  const response = await fetch(`${CANVAS_API_URL}/courses/${courseId}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CANVAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wiki_page: {
        title,
        body,
        published,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Canvas API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Upload a file to Canvas course files
 */
export async function uploadCanvasFile(options: CanvasFileOptions): Promise<any> {
  const { courseId, fileName, content, contentType = 'text/markdown' } = options;

  // Step 1: Tell Canvas we're uploading a file
  const initResponse = await fetch(`${CANVAS_API_URL}/courses/${courseId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CANVAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      size: Buffer.byteLength(content),
      content_type: contentType,
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`Canvas file init error: ${initResponse.status} - ${error}`);
  }

  const initData = await initResponse.json();

  // Step 2: Upload the actual file to the URL Canvas provided
  const formData = new FormData();
  Object.entries(initData.upload_params).forEach(([key, value]) => {
    formData.append(key, value as string);
  });
  formData.append('file', new Blob([content], { type: contentType }), fileName);

  const uploadResponse = await fetch(initData.upload_url, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Canvas file upload error: ${uploadResponse.status} - ${error}`);
  }

  // Step 3: Confirm the upload
  const location = uploadResponse.headers.get('Location');
  if (location) {
    const confirmResponse = await fetch(location, {
      headers: {
        'Authorization': `Bearer ${CANVAS_API_KEY}`,
      },
    });
    return confirmResponse.json();
  }

  return uploadResponse.json();
}

/**
 * Create an announcement in a Canvas course
 */
export async function createCanvasAnnouncement(options: CanvasAnnouncementOptions): Promise<any> {
  const { courseId, title, message } = options;

  const response = await fetch(`${CANVAS_API_URL}/courses/${courseId}/discussion_topics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CANVAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      message,
      is_announcement: true,
      published: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Canvas announcement error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get list of courses for the authenticated user
 * Fetches all active courses regardless of enrollment type (teacher, student, ta, designer)
 */
export async function getCanvasCourses(): Promise<any[]> {
  const response = await fetch(`${CANVAS_API_URL}/courses?per_page=100&include[]=term`, {
    headers: {
      'Authorization': `Bearer ${CANVAS_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Canvas courses error: ${response.status} - ${error}`);
  }

  const courses = await response.json();

  // Filter out courses without names (templates, etc.)
  return courses.filter((course: any) => course.name && course.name.trim() !== '');
}

/**
 * Convert markdown to Canvas-compatible HTML
 */
export function markdownToCanvasHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  // Canvas supports HTML, so we'll convert common markdown syntax
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Code blocks
  html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  return html;
}
