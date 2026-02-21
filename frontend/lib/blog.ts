import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    authorUrl?: string;
    readTime: string;
    category: string;
    tags: string[];
    coverImage: string;
    content: string;
}

export interface BlogMeta extends Omit<BlogPost, "content"> { }

/** Read all blog post metadata (no body content) — for listing page */
export function getAllPosts(): BlogMeta[] {
    if (!fs.existsSync(BLOGS_DIR)) return [];

    const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));

    const posts = files.map((filename) => {
        const slug = filename.replace(/\.md$/, "");
        const filePath = path.join(BLOGS_DIR, filename);
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(raw);

        return {
            slug,
            title: data.title ?? "Untitled",
            description: data.description ?? "",
            date: data.date ?? "",
            author: data.author ?? "King Tools",
            authorUrl: data.authorUrl ?? "",
            readTime: data.readTime ?? "5 min read",
            category: data.category ?? "General",
            tags: data.tags ?? [],
            coverImage: data.coverImage ?? "",
        } as BlogMeta;
    });

    // Sort newest first
    return posts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/** Read a single blog post by slug — full content parsed to HTML */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const filePath = path.join(BLOGS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    const htmlContent = await marked(content, { async: true });

    return {
        slug,
        title: data.title ?? "Untitled",
        description: data.description ?? "",
        date: data.date ?? "",
        author: data.author ?? "King Tools",
        authorUrl: data.authorUrl ?? "",
        readTime: data.readTime ?? "5 min read",
        category: data.category ?? "General",
        tags: data.tags ?? [],
        coverImage: data.coverImage ?? "",
        content: htmlContent,
    };
}

/** Format date string nicely */
export function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}
