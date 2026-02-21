import { getAllPosts, formatDate } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, Tag, ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
    title: "Blog & Tutorials — King Tools",
    description:
        "Latest updates, guides, and deep-dives on AI, video tools, content creation, and technology from King Tools.",
    keywords: ["blog", "tutorials", "AI", "video tools", "content creation"],
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <main className="min-h-screen bg-[#020617] pb-16">
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-slate-900 to-[#020617] py-20 px-4 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="relative max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-300 text-xs font-bold uppercase tracking-widest mb-5">
                        <BookOpen size={14} />
                        King Tools Blog
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4 leading-tight">
                        Blog &amp; Tutorials
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Deep dives on AI, content creation, and the tools that actually work in the real world.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-12">
                {posts.length === 0 ? (
                    <div className="text-center py-24 text-slate-500">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No posts yet — check back soon.</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {/* Featured first post */}
                        {posts[0] && <FeaturedCard post={posts[0]} />}

                        {/* Rest of posts */}
                        {posts.length > 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                {posts.slice(1).map((post) => (
                                    <SmallCard key={post.slug} post={post} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

function FeaturedCard({ post }: { post: ReturnType<typeof getAllPosts>[0] }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group block bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300"
        >
            {post.coverImage && (
                <div className="relative h-72 md:h-96 overflow-hidden">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <div className="absolute top-4 left-4">
                        <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                            Featured
                        </span>
                    </div>
                </div>
            )}
            <div className="p-8">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
                        {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime}
                    </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white mb-3 group-hover:text-purple-300 transition-colors leading-tight">
                    {post.title}
                </h2>
                <p className="text-slate-400 text-base leading-relaxed mb-6 line-clamp-2">
                    {post.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                            {post.author[0]}
                        </div>
                        <span className="text-slate-400">{post.author}</span>
                    </div>
                    <span className="flex items-center gap-2 text-purple-400 text-sm font-bold group-hover:gap-3 transition-all">
                        Read Article <ArrowRight size={16} />
                    </span>
                </div>
            </div>
        </Link>
    );
}

function SmallCard({ post }: { post: ReturnType<typeof getAllPosts>[0] }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex flex-col bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-900/10 transition-all duration-300"
        >
            {post.coverImage && (
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                </div>
            )}
            <div className="flex flex-col flex-1 p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                        {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {post.readTime}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors leading-snug line-clamp-2">
                    {post.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                    {post.description}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1 text-purple-400 font-bold group-hover:gap-2 transition-all">
                        Read <ArrowRight size={13} />
                    </span>
                </div>
            </div>
        </Link>
    );
}
