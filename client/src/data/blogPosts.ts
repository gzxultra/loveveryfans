/**
 * Blog posts data module
 *
 * Imports all Markdown blog posts from client/src/blog/ and parses their
 * frontmatter + content using gray-matter and marked.
 *
 * Each post exports:
 *   slug        — URL-safe identifier
 *   title       — Chinese title
 *   titleEn     — English title
 *   date        — ISO date string
 *   author      — Author name
 *   excerpt     — Chinese excerpt
 *   excerptEn   — English excerpt
 *   tags        — Chinese tags array
 *   tagsEn      — English tags array
 *   readingTime — Estimated reading time in minutes
 *   content     — Raw markdown content (without frontmatter)
 *   contentHtml — Rendered HTML content
 */

export interface BlogPost {
  slug: string;
  title: string;
  titleEn: string;
  date: string;
  author: string;
  excerpt: string;
  excerptEn: string;
  tags: string[];
  tagsEn: string[];
  readingTime: number;
  content: string;
  contentHtml: string;
}

// Import raw markdown files as strings via Vite's ?raw query
import post1Raw from "../blog/lovevery-worth-it-2026.md?raw";
import post2Raw from "../blog/baby-milestones-toy-guide.md?raw";
import post3Raw from "../blog/save-money-lovevery-alternatives.md?raw";

/**
 * Parse frontmatter from a markdown string.
 * Returns { data, content } where data is the frontmatter object.
 *
 * We implement a lightweight parser here to avoid bundling gray-matter
 * (which is a Node.js library) in the browser bundle.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return { data: {}, content: raw };
  }

  const yamlStr = fmMatch[1];
  const content = fmMatch[2];
  const data: Record<string, unknown> = {};

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // Parse arrays: ["a", "b"] or [a, b]
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1);
      value = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }

    // Parse numbers
    if (typeof value === "string" && /^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

    data[key] = value;
  }

  return { data, content };
}

/**
 * Convert markdown to HTML using a simple regex-based renderer.
 * We avoid importing marked at runtime to keep the bundle lean.
 */
function markdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#5a9e65] hover:underline">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, "<hr />")
    // Tables (simple pipe tables)
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").slice(1, -1).map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    })
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Paragraphs (double newline)
    .replace(/\n\n/g, "</p><p>")
    // Clean up
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    // Fix nested tags
    .replace(/<p><h([1-6])>/g, "<h$1>")
    .replace(/<\/h([1-6])><\/p>/g, "</h$1>")
    .replace(/<p><li>/g, "<li>")
    .replace(/<\/li><\/p>/g, "</li>")
    .replace(/<p><hr \/><\/p>/g, "<hr />")
    .replace(/<p><blockquote>/g, "<blockquote>")
    .replace(/<\/blockquote><\/p>/g, "</blockquote>")
    .replace(/<p><tr>/g, "<tr>")
    .replace(/<\/tr><\/p>/g, "</tr>");
}

function parsePost(raw: string): BlogPost {
  const { data, content } = parseFrontmatter(raw);

  const slug = (data.slug as string) || "";
  const title = (data.title as string) || "";
  const titleEn = (data.titleEn as string) || title;
  const date = (data.date as string) || "";
  const author = (data.author as string) || "Lovevery Fans";
  const excerpt = (data.excerpt as string) || "";
  const excerptEn = (data.excerptEn as string) || excerpt;
  const tags = (data.tags as string[]) || [];
  const tagsEn = (data.tagsEn as string[]) || [];
  const readingTime = (data.readingTime as number) || Math.ceil(content.split(/\s+/).length / 200);

  return {
    slug,
    title,
    titleEn,
    date,
    author,
    excerpt,
    excerptEn,
    tags,
    tagsEn,
    readingTime,
    content,
    contentHtml: markdownToHtml(content),
  };
}

// Parse all posts
const allPosts: BlogPost[] = [
  parsePost(post1Raw),
  parsePost(post2Raw),
  parsePost(post3Raw),
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const blogPosts = allPosts;

export function getBlogPost(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getLatestPosts(count = 3): BlogPost[] {
  return allPosts.slice(0, count);
}
