import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import {
    Camera, Upload, ChevronLeft, ChevronRight, Plus, X, Flame, Trophy,
    TrendingDown, Ruler, Scale, Heart, Zap, Star, Calendar, ArrowLeftRight,
    CheckCircle, Image, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const MOOD_OPTIONS = [
    { value: 'terrible', emoji: '😞', label: 'Terrible' },
    { value: 'bad', emoji: '😕', label: 'Bad' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'amazing', emoji: '🤩', label: 'Amazing' },
];

const MILESTONES = [
    'First check-in', 'Lost 5kg', 'Gained muscle', 'Hit PR', 'Visible abs',
    '30-day streak', 'Goal weight', 'New measurements', 'Best shape ever'
];

// Before/After comparison slider
function ComparisonSlider({ before, after }) {
    const [pos, setPos] = useState(50);
    const ref = useRef(null);

    const onMove = useCallback((e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setPos(pct);
    }, []);

    return (
        <div ref={ref} className="relative rounded-2xl overflow-hidden cursor-ew-resize select-none"
            style={{ height: 320 }}
            onMouseMove={e => e.buttons === 1 && onMove(e)}
            onTouchMove={onMove}>
            <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
                <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (pos / 100)}%` }} />
            </div>
            {/* Divider */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-gray-800" />
                </div>
            </div>
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-semibold">BEFORE</div>
            <div className="absolute top-3 right-3 bg-emerald-500/80 text-white text-xs px-2 py-1 rounded-lg font-semibold">AFTER</div>
        </div>
    );
}

// Photo upload dropzone
function PhotoUpload({ label, value, onChange, loading }) {
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;
        onChange('loading');
        const { file_url } = await entities.BodyProgress.uploadFile(file); // remove the { } wrapper
        onChange(file_url);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer ${value && value !== 'loading' ? 'border-emerald-500/50' : 'border-white/15 hover:border-white/30'}`}
            style={{ height: 160 }}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
        >
            {value === 'loading' ? (
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            ) : value ? (
                <>
                    <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                </>
            ) : (
                <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Tap or drag</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => handleFile(e.target.files?.[0])} />
        </div>
    );
}

// Upload form modal
function UploadModal({ onClose, onSave, userEmail }) {
    const [form, setForm] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        period: 'weekly',
        front_photo_url: '',
        side_photo_url: '',
        back_photo_url: '',
        weight_kg: '',
        chest_cm: '', waist_cm: '', hips_cm: '', arms_cm: '', thighs_cm: '',
        body_fat_pct: '',
        notes: '',
        mood: 'good',
        energy_level: 7,
        milestone_tags: [],
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const toggleMilestone = (t) => set('milestone_tags',
        form.milestone_tags.includes(t) ? form.milestone_tags.filter(x => x !== t) : [...form.milestone_tags, t]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative glass rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-space font-bold">New Progress Entry</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>

                {/* Date & Period */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                        <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Period</label>
                        <div className="flex gap-1">
                            {['daily', 'weekly', 'monthly'].map(p => (
                                <button key={p} onClick={() => set('period', p)}
                                    className={`flex-1 text-xs py-2 rounded-xl capitalize border transition-all ${form.period === p ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Photos */}
                <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Progress Photos</label>
                    <div className="grid grid-cols-3 gap-3">
                        <PhotoUpload label="Front" value={form.front_photo_url} onChange={v => set('front_photo_url', v)} />
                        <PhotoUpload label="Side" value={form.side_photo_url} onChange={v => set('side_photo_url', v)} />
                        <PhotoUpload label="Back" value={form.back_photo_url} onChange={v => set('back_photo_url', v)} />
                    </div>
                </div>

                {/* Weight & Body Fat */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</label>
                        <Input type="number" placeholder="75.5" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Body Fat %</label>
                        <Input type="number" placeholder="18" value={form.body_fat_pct} onChange={e => set('body_fat_pct', e.target.value)} className="bg-white/5 border-white/10" />
                    </div>
                </div>

                {/* Measurements */}
                <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Measurements (cm)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[['chest_cm', 'Chest'], ['waist_cm', 'Waist'], ['hips_cm', 'Hips'], ['arms_cm', 'Arms'], ['thighs_cm', 'Thighs']].map(([k, l]) => (
                            <div key={k}>
                                <label className="text-xs text-muted-foreground mb-1 block">{l}</label>
                                <Input type="number" placeholder="—" value={form[k]} onChange={e => set(k, e.target.value)} className="bg-white/5 border-white/10 h-9" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mood */}
                <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">How are you feeling?</label>
                    <div className="flex gap-2">
                        {MOOD_OPTIONS.map(m => (
                            <button key={m.value} onClick={() => set('mood', m.value)}
                                className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-all text-xl ${form.mood === m.value ? 'bg-white/10 border-white/20' : 'border-white/5 hover:border-white/10'}`}>
                                {m.emoji}
                                <span className="text-[9px] text-muted-foreground mt-0.5">{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Energy */}
                <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Energy Level: <span className="text-white">{form.energy_level}/10</span></label>
                    <input type="range" min="1" max="10" value={form.energy_level} onChange={e => set('energy_level', +e.target.value)}
                        className="w-full accent-emerald-500" />
                </div>

                {/* Milestones */}
                <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Milestone Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {MILESTONES.map(t => (
                            <button key={t} onClick={() => toggleMilestone(t)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.milestone_tags.includes(t) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-semibold uppercase tracking-wider">Notes / Journal</label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                        placeholder="How did this week feel? Any wins or challenges..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">Cancel</Button>
                    <Button onClick={() => onSave(form)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                        <CheckCircle className="w-4 h-4 mr-2" /> Save Entry
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// Single progress card in timeline
function ProgressCard({ entry, index, isFirst, onClick }) {
    const photos = [entry.front_photo_url, entry.side_photo_url, entry.back_photo_url].filter(Boolean);
    const mood = MOOD_OPTIONS.find(m => m.value === entry.mood);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            onClick={() => onClick(entry)}
            className="glass rounded-2xl border border-white/5 hover:border-white/15 transition-all cursor-pointer overflow-hidden group">
            {/* Photos strip with gradient overlay for text readability */}
            {photos.length > 0 ? (
                <div className="relative grid grid-cols-3 gap-0.5 h-44">
                    {photos.slice(0, 3).map((p, i) => (
                        <div key={i} className="relative overflow-hidden">
                            <img src={p} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                    ))}
                    {photos.length < 3 && Array.from({ length: 3 - photos.length }).map((_, i) => (
                        <div key={i} className="bg-white/3 flex items-center justify-center">
                            <Image className="w-6 h-6 text-muted-foreground/20" />
                        </div>
                    ))}
                    {/* Gradient overlay from bottom for text */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    {/* Text overlaid on gradient */}
                    <div className="absolute bottom-0 inset-x-0 p-3 space-y-1.5">
                        <div className="flex items-end justify-between gap-2">
                            <div>
                                <div className="font-semibold text-sm text-white drop-shadow">{format(parseISO(entry.date), 'MMM d, yyyy')}</div>
                                <div className="text-[10px] text-white/70 capitalize">{entry.period} check-in</div>
                            </div>
                            <div className="text-xl leading-none">{mood?.emoji || '😊'}</div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                            {entry.weight_kg && (
                                <div className="flex items-center gap-1 text-white/80">
                                    <Scale className="w-3 h-3" />{entry.weight_kg} kg
                                </div>
                            )}
                            {entry.waist_cm && (
                                <div className="flex items-center gap-1 text-white/80">
                                    <Ruler className="w-3 h-3" />Waist {entry.waist_cm}cm
                                </div>
                            )}
                            {entry.energy_level && (
                                <div className="flex items-center gap-1 text-white/80">
                                    <Zap className="w-3 h-3 text-yellow-300" />{entry.energy_level}/10
                                </div>
                            )}
                            {isFirst && (
                                <div className="flex items-center gap-1 text-emerald-300 font-semibold">
                                    <Star className="w-3 h-3" />Latest
                                </div>
                            )}
                        </div>
                        {entry.milestone_tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {entry.milestone_tags.map(t => (
                                    <span key={t} className="text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full backdrop-blur-sm">{t}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="h-24 bg-gradient-to-br from-white/3 to-white/0 flex items-center justify-center border-b border-white/5">
                        <Camera className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="font-semibold text-sm">{format(parseISO(entry.date), 'MMM d, yyyy')}</div>
                                <div className="text-[10px] text-muted-foreground capitalize">{entry.period} check-in</div>
                            </div>
                            <div className="text-lg">{mood?.emoji || '😊'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {entry.weight_kg && <div className="flex items-center gap-1.5 text-muted-foreground"><Scale className="w-3 h-3" />{entry.weight_kg} kg</div>}
                            {entry.waist_cm && <div className="flex items-center gap-1.5 text-muted-foreground"><Ruler className="w-3 h-3" />Waist {entry.waist_cm}cm</div>}
                            {entry.energy_level && <div className="flex items-center gap-1.5 text-muted-foreground"><Zap className="w-3 h-3 text-yellow-400" />Energy {entry.energy_level}/10</div>}
                            {isFirst && <div className="flex items-center gap-1.5 text-emerald-400 font-medium"><Star className="w-3 h-3" />Latest</div>}
                        </div>
                        {entry.milestone_tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {entry.milestone_tags.map(t => (
                                    <span key={t} className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">{t}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}

// Detail modal
function DetailModal({ entry, allEntries, onClose }) {
    const [compareWith, setCompareWith] = useState(null);
    const mood = MOOD_OPTIONS.find(m => m.value === entry.mood);
    const idx = allEntries.findIndex(e => e.id === entry.id);
    const older = allEntries.filter((_, i) => i > idx);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative glass rounded-3xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-space font-bold">{format(parseISO(entry.date), 'MMMM d, yyyy')}</h2>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{entry.period} check-in · {mood?.emoji} {mood?.label}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
                </div>

                {/* Photos */}
                {[entry.front_photo_url, entry.side_photo_url, entry.back_photo_url].some(Boolean) && (
                    <div className="grid grid-cols-3 gap-3">
                        {[['Front', entry.front_photo_url], ['Side', entry.side_photo_url], ['Back', entry.back_photo_url]].map(([label, url]) => (
                            <div key={label} className="space-y-1">
                                <p className="text-xs text-muted-foreground text-center">{label}</p>
                                {url ? (
                                    <img src={url} alt={label} className="w-full rounded-xl object-cover" style={{ height: 200 }} />
                                ) : (
                                    <div className="rounded-xl bg-white/5 flex items-center justify-center" style={{ height: 200 }}>
                                        <Camera className="w-8 h-8 text-muted-foreground/20" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Comparison slider */}
                {older.length > 0 && (entry.front_photo_url || entry.side_photo_url) && (
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Before vs After Comparison</label>
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {older.filter(e => e.front_photo_url || e.side_photo_url).slice(0, 5).map(e => (
                                <button key={e.id} onClick={() => setCompareWith(compareWith?.id === e.id ? null : e)}
                                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${compareWith?.id === e.id ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                    {format(parseISO(e.date), 'MMM d')}
                                </button>
                            ))}
                        </div>
                        {compareWith && (compareWith.front_photo_url || compareWith.side_photo_url) && (entry.front_photo_url || entry.side_photo_url) && (
                            <ComparisonSlider
                                before={compareWith.front_photo_url || compareWith.side_photo_url}
                                after={entry.front_photo_url || entry.side_photo_url}
                            />
                        )}
                    </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: Scale, label: 'Weight', value: entry.weight_kg ? `${entry.weight_kg} kg` : '—', color: 'text-emerald-400' },
                        { icon: Flame, label: 'Body Fat', value: entry.body_fat_pct ? `${entry.body_fat_pct}%` : '—', color: 'text-orange-400' },
                        { icon: Zap, label: 'Energy', value: entry.energy_level ? `${entry.energy_level}/10` : '—', color: 'text-yellow-400' },
                        { icon: Heart, label: 'Mood', value: mood?.label || '—', color: 'text-pink-400' },
                    ].map(s => (
                        <div key={s.label} className="glass rounded-xl p-3 border border-white/5 text-center">
                            <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                            <div className="text-sm font-semibold mt-0.5">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Measurements */}
                {(entry.chest_cm || entry.waist_cm || entry.hips_cm || entry.arms_cm || entry.thighs_cm) && (
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Measurements</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[['Chest', entry.chest_cm], ['Waist', entry.waist_cm], ['Hips', entry.hips_cm], ['Arms', entry.arms_cm], ['Thighs', entry.thighs_cm]].filter(([, v]) => v).map(([l, v]) => (
                                <div key={l} className="glass rounded-xl p-3 text-center border border-white/5">
                                    <div className="text-xs text-muted-foreground">{l}</div>
                                    <div className="text-sm font-semibold">{v} cm</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {entry.milestone_tags?.length > 0 && (
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wider">Milestones</label>
                        <div className="flex flex-wrap gap-2">
                            {entry.milestone_tags.map(t => (
                                <span key={t} className="text-sm bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full">🏆 {t}</span>
                            ))}
                        </div>
                    </div>
                )}

                {entry.notes && (
                    <div className="glass rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Journal Entry</p>
                        <p className="text-sm leading-relaxed">{entry.notes}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function BodyProgressTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [showUpload, setShowUpload] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [filter, setFilter] = useState('all');

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['body-progress', user?.email],
        queryFn: () => entities.BodyProgress.filter({ user_email: user?.email }, 'date', 100),
        enabled: !!user?.email,
    });

    const createEntry = useMutation({
        mutationFn: (data) => entities.BodyProgress.create({
            ...data,
            user_email: user.email,
            weight_kg: data.weight_kg ? +data.weight_kg : undefined,
            chest_cm: data.chest_cm ? +data.chest_cm : undefined,
            waist_cm: data.waist_cm ? +data.waist_cm : undefined,
            hips_cm: data.hips_cm ? +data.hips_cm : undefined,
            arms_cm: data.arms_cm ? +data.arms_cm : undefined,
            thighs_cm: data.thighs_cm ? +data.thighs_cm : undefined,
            body_fat_pct: data.body_fat_pct ? +data.body_fat_pct : undefined,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['body-progress'] });
            setShowUpload(false);
            toast.success('Progress entry saved! 🎉');
        },
    });

    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const filtered = filter === 'all' ? sorted : sorted.filter(e => e.period === filter);

    // Stats
    const latest = sorted[0];
    const oldest = sorted[sorted.length - 1];
    const weightChange = latest?.weight_kg && oldest?.weight_kg ? (latest.weight_kg - oldest.weight_kg).toFixed(1) : null;
    const streak = entries.length;
    const withPhotos = entries.filter(e => e.front_photo_url || e.side_photo_url || e.back_photo_url).length;

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Camera className="w-7 h-7 text-emerald-400" /> Body Progress Tracker
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Track your transformation journey with photos & measurements</p>
                </div>
                <Button onClick={() => setShowUpload(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl px-5">
                    <Plus className="w-4 h-4 mr-2" /> New Entry
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { icon: Calendar, label: 'Total Check-ins', value: entries.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { icon: Image, label: 'With Photos', value: withPhotos, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { icon: TrendingDown, label: 'Weight Change', value: weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '—', color: weightChange < 0 ? 'text-emerald-400' : 'text-orange-400', bg: 'bg-white/5' },
                    { icon: Trophy, label: 'Milestones', value: entries.filter(e => e.milestone_tags?.length > 0).length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                ].map(s => (
                    <div key={s.label} className="glass rounded-2xl p-4 border border-white/5">
                        <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div className="text-lg font-bold font-space">{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['all', 'daily', 'weekly', 'monthly'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`text-sm px-4 py-2 rounded-xl border capitalize transition-all ${filter === f ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Gallery */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-emerald-400/50" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-lg">Start Your Transformation</p>
                        <p className="text-sm text-muted-foreground mt-1">Upload your first progress photo to begin tracking your journey</p>
                    </div>
                    <Button onClick={() => setShowUpload(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl">
                        <Upload className="w-4 h-4 mr-2" /> Upload First Photo
                    </Button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((e, i) => (
                        <ProgressCard key={e.id} entry={e} index={i} isFirst={i === 0} onClick={setSelectedEntry} />
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showUpload && (
                    <UploadModal
                        onClose={() => setShowUpload(false)}
                        onSave={(data) => createEntry.mutate(data)}
                        userEmail={user?.email}
                    />
                )}
                {selectedEntry && (
                    <DetailModal entry={selectedEntry} allEntries={sorted} onClose={() => setSelectedEntry(null)} />
                )}
            </AnimatePresence>

            {/* Sticky FAB */}
            <button onClick={() => setShowUpload(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 lg:hidden">
                <Plus className="w-6 h-6" />
            </button>
        </div>
    );
}


