import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Clock, ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';

const CATEGORY_COLORS = {
    nutrition: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fat_loss: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    recovery: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    supplements: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    training_tips: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    mindset: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

export default function Blog() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { isAuthenticated } = useAuth();

    const { data: posts = [] } = useQuery({
        queryKey: ['blog-posts-public'],
        queryFn: () => entities.BlogPost.filter({ is_published: true }),
    });

    const categories = ['all', ...new Set(posts.map(p => p.category))];

    const filtered = posts.filter(p => {
        const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
        return matchSearch && matchCat;
    });

    const featured = filtered.find(p => p.is_featured);
    const rest = filtered.filter(p => !p.is_featured || filtered.indexOf(p) > 0);

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
                        <Link to="/" className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg px-4 py-2 transition-all">
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-space font-bold mb-4">
                        FitElite <span className="text-gradient-green">Blog</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Expert tips, nutrition guides, and fitness insights to fuel your transformation.
                    </p>
                </motion.div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search articles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedCategory === cat
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Post */}
                {featured && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <Link to={`/blog/${featured.id}`}>
                            <div className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all group">
                                <div className="grid md:grid-cols-2 gap-0">
                                    {featured.cover_image_url && (
                                        <div className="h-64 md:h-full min-h-[260px] overflow-hidden">
                                            <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}
                                    <div className="p-8 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Featured</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[featured.category] || 'bg-white/10 text-white border-white/20'}`}>
                                                {featured.category?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-space font-bold mb-3 group-hover:text-emerald-400 transition-colors">{featured.title}</h2>
                                        <p className="text-muted-foreground mb-4 line-clamp-3">{featured.excerpt}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {featured.author_name && <span>{featured.author_name}</span>}
                                            {featured.read_time_min && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_min} min read</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Post Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No articles found.</div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(featured ? rest : filtered).map((post, i) => (
                            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Link to={`/blog/${post.id}`}>
                                    <div className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all group h-full flex flex-col">
                                        {post.cover_image_url && (
                                            <div className="h-44 overflow-hidden">
                                                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-white/10 text-white border-white/20'}`}>
                                                    {post.category?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-space font-semibold text-base mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{post.title}</h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                                            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                                                {post.author_name && <span>{post.author_name}</span>}
                                                {post.read_time_min && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_min} min</span>}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


