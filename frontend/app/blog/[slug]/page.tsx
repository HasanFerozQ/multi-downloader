import { getPostBySlug, getAllPosts, formatDate } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Tag, ArrowLeft, ExternalLink } from "lucide-react";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) return { title: "Post Not Found — King Tools" };

    return {
        title: `${post.title} — King Tools Blog`,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            images: post.coverImage ? [{ url: post.coverImage }] : [],
            type: "article",
            publishedTime: post.date,
            authors: [post.author],
        },
    };
}

export async function generateStaticParams() {
    const posts = getAllPosts();
    return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) notFound();

    return (
        <main className="min-h-screen bg-[#020617] pb-20">
            {/* Cover Image Hero */}
            {post.coverImage && (
                <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />
                </div>
            )}

            <div className="max-w-3xl mx-auto px-4">
                {/* Back button */}
                <div className="py-6">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                </div>

                {/* Post Header */}
                <header className="mb-10">
                    {/* Category & Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-5">
                        <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {formatDate(post.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {post.readTime}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-5">
                        {post.title}
                    </h1>

                    {/* Description */}
                    <p className="text-slate-300 text-lg leading-relaxed mb-6 border-l-4 border-purple-500 pl-5">
                        {post.description}
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 py-4 border-y border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {post.author[0]}
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm flex items-center gap-2">
                                {post.authorUrl ? (
                                    <a
                                        href={post.authorUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-purple-400 transition-colors flex items-center gap-1"
                                    >
                                        {post.author}
                                        <ExternalLink size={12} />
                                    </a>
                                ) : (
                                    post.author
                                )}
                            </p>
                            <p className="text-slate-500 text-xs">Author</p>
                        </div>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full"
                                >
                                    <Tag size={10} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* Article Body — prose styles via globals */}
                <article
                    className="blog-prose"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-slate-500 text-sm">Published by</p>
                            {post.authorUrl ? (
                                <a
                                    href={post.authorUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 font-bold hover:text-purple-300 transition-colors flex items-center gap-1"
                                >
                                    {post.author} <ExternalLink size={13} />
                                </a>
                            ) : (
                                <p className="text-white font-bold">{post.author}</p>
                            )}
                        </div>
                        <Link
                            href="/blog"
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                        >
                            <ArrowLeft size={14} />
                            More Articles
                        </Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
