import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Clock, ChevronRight, Search, Crown, CheckCircle2, Filter, Zap } from 'lucide-react';

const CATEGORY_STYLE = {
    fat_loss: { gradient: 'from-orange-500/30 to-red-500/10', badge: 'bg-orange-500/10 text-orange-400' },
    muscle_gain: { gradient: 'from-purple-500/30 to-blue-500/10', badge: 'bg-purple-500/10 text-purple-400' },
    transformation: { gradient: 'from-yellow-500/30 to-orange-500/10', badge: 'bg-yellow-500/10 text-yellow-400' },
    home_workout: { gradient: 'from-blue-500/30 to-cyan-500/10', badge: 'bg-blue-500/10 text-blue-400' },
    athletic: { gradient: 'from-emerald-500/30 to-teal-500/10', badge: 'bg-emerald-500/10 text-emerald-400' },
    beginner: { gradient: 'from-teal-500/30 to-green-500/10', badge: 'bg-teal-500/10 text-teal-400' },
};

export default function ProgramsPage() {
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [selected, setSelected] = useState(null);

    const { data: programs = [], isLoading } = useQuery({
        queryKey: ['programs-customer'],
        queryFn: () => entities.Program.filter({ is_published: true }, 'is_featured'),
    });

    const featured = programs.filter(p => p.is_featured);
    const filtered = programs.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === 'all' || p.category === catFilter;
        return matchSearch && matchCat;
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <Crown className="w-7 h-7 text-yellow-400" /> Programs
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Complete transformation programs to reach your goals</p>
            </div>

            {/* Featured */}
            {featured.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" /> Featured Programs
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {featured.map((prog, i) => {
                            const style = CATEGORY_STYLE[prog.category] || CATEGORY_STYLE.beginner;
                            return (
                                <motion.button key={prog.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                    onClick={() => setSelected(prog)}
                                    className="text-left glass rounded-2xl overflow-hidden border border-yellow-500/20 hover:border-yellow-500/40 transition-all group w-full">
                                    {prog.banner_image_url ? (
                                        <div className="h-44 overflow-hidden relative">
                                            <img src={prog.banner_image_url} alt={prog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-3 left-4"><span className="text-xs px-2 py-1 rounded-full bg-yellow-500/80 text-black font-semibold">⭐ Featured</span></div>
                                        </div>
                                    ) : (
                                        <div className={`h-44 bg-gradient-to-br ${style.gradient} flex items-center justify-center relative`}>
                                            <Crown className="w-12 h-12 text-yellow-400 opacity-40" />
                                            <div className="absolute bottom-3 left-4"><span className="text-xs px-2 py-1 rounded-full bg-yellow-500/80 text-black font-semibold">⭐ Featured</span></div>
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-bold group-hover:text-yellow-400 transition-colors">{prog.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prog.description}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {prog.duration_weeks && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{prog.duration_weeks}w</span>}
                                                <span className={`px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{prog.difficulty}</span>
                                            </div>
                                            {prog.price != null && <div className="text-sm font-bold text-yellow-400">{prog.price === 0 ? 'Free' : `$${prog.price}`}</div>}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filters + all */}
            <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..." className="pl-9 bg-white/5 border-white/10" />
                    </div>
                    <Select value={catFilter} onValueChange={setCatFilter}>
                        <SelectTrigger className="w-44 bg-white/5 border-white/10"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.keys(CATEGORY_STYLE).map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading programs...</div>
                ) : filtered.length === 0 ? (
                    <GlassCard animate={false} className="text-center py-12 text-muted-foreground">No programs found.</GlassCard>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((prog, i) => {
                            const style = CATEGORY_STYLE[prog.category] || CATEGORY_STYLE.beginner;
                            return (
                                <motion.button key={prog.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelected(prog)}
                                    className="text-left glass rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 transition-all group w-full">
                                    <div className={`h-28 bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                                        <Crown className="w-8 h-8 text-yellow-400 opacity-30" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold text-sm group-hover:text-white transition-colors">{prog.name}</h3>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>{prog.category?.replace('_', ' ')}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{prog.difficulty}</span>
                                        </div>
                                        {prog.price != null && (
                                            <div className="mt-2 text-sm font-bold text-yellow-400">{prog.price === 0 ? 'Free' : `$${prog.price}`}</div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="glass border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold">{selected.name}</DialogTitle>
                            </DialogHeader>
                            {selected.banner_image_url && (
                                <img src={selected.banner_image_url} alt={selected.name} className="w-full h-48 object-cover rounded-xl" />
                            )}
                            <p className="text-sm text-muted-foreground">{selected.description}</p>
                            {selected.target_audience && (
                                <div className="glass rounded-xl p-3 text-sm">
                                    <span className="text-muted-foreground">For: </span>{selected.target_audience}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Duration', value: selected.duration_weeks ? `${selected.duration_weeks} weeks` : '—' },
                                    { label: 'Level', value: selected.difficulty || '—' },
                                    { label: 'Category', value: selected.category?.replace('_', ' ') || '—' },
                                    { label: 'Price', value: selected.price != null ? (selected.price === 0 ? 'Free' : `$${selected.price}`) : '—' },
                                ].map(s => (
                                    <div key={s.label} className="glass rounded-xl p-3">
                                        <div className="text-xs text-muted-foreground">{s.label}</div>
                                        <div className="font-semibold text-sm mt-0.5">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                            {selected.included_features?.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 text-sm">What's Included</h4>
                                    <div className="space-y-2">
                                        {selected.included_features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selected.price > 0 && (
                                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                    <Zap className="w-4 h-4 mr-2" /> Enroll — ${selected.price}
                                </Button>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}