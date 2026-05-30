import React from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Clock, ArrowLeft, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/lib/AuthContext';

const CATEGORY_COLORS = {
    nutrition: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fat_loss: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    recovery: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    supplements: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    training_tips: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    mindset: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

export default function BlogPostPage() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['blog-post', id],
        queryFn: () => entities.BlogPost.filter({ id }),
    });

    const post = posts[0];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <p>Article not found.</p>
                <Link to="/blog" className="text-emerald-400 hover:underline">Back to Blog</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="font-space font-bold text-lg">FitElite</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/blog" className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> All Articles
                        </Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg px-4 py-2 transition-all">
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
                {/* Cover Image */}
                {post.cover_image_url && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-2xl overflow-hidden">
                        <img src={post.cover_image_url} alt={post.title} className="w-full h-72 object-cover" />
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {post.category && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-white/10 text-white border-white/20'}`}>
                                {post.category.replace('_', ' ')}
                            </span>
                        )}
                        {post.tags?.map(tag => (
                            <span key={tag} className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" />{tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-space font-bold mb-4">{post.title}</h1>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-white/10">
                        {post.author_name && <span className="font-medium text-white/70">{post.author_name}</span>}
                        {post.published_at && <span>{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        {post.read_time_min && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />{post.read_time_min} min read
                            </span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-emerald max-w-none
            prose-headings:font-space prose-headings:font-bold
            prose-p:text-white/80 prose-p:leading-relaxed
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-code:text-emerald-300
            prose-li:text-white/80 prose-blockquote:border-emerald-500 prose-blockquote:text-white/60">
                        {post.content ? (
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        ) : (
                            <p className="text-muted-foreground">{post.excerpt}</p>
                        )}
                    </div>

                    {/* Back link */}
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <Link to="/blog" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to all articles
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}


