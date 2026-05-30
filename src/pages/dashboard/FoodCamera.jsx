import React, { useState, useRef } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, CheckCircle, Zap, Utensils, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { today } from '@/lib/fitnessUtils';
import { invokeLLM } from '@/api/llm';
function ScanOverlay() {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative w-48 h-48">
                {/* Corner brackets */}
                {[['top-0 left-0 border-t-2 border-l-2', 'rounded-tl-lg'], ['top-0 right-0 border-t-2 border-r-2', 'rounded-tr-lg'],
                ['bottom-0 left-0 border-b-2 border-l-2', 'rounded-bl-lg'], ['bottom-0 right-0 border-b-2 border-r-2', 'rounded-br-lg']].map(([cls], i) => (
                    <div key={i} className={`absolute w-8 h-8 border-emerald-400 ${cls}`} />
                ))}
                {/* Scan line */}
                <motion.div className="absolute left-0 right-0 h-0.5 bg-emerald-400"
                    style={{ boxShadow: '0 0 10px rgba(34,197,94,0.8)' }}
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-emerald-400 animate-pulse font-medium">
                AI Scanning...
            </div>
        </div>
    );
}

function NutrientBar({ label, value, unit, color, max }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold" style={{ color }}>{value}{unit}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
            </div>
        </div>
    );
}

export default function FoodCamera() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [imageUrl, setImageUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileRef = useRef();

    const handleFile = async (file) => {
        setResult(null); setSaved(false);
        setUploading(true);
        const { file_url } = await entities.MealLog.uploadFile({ file });
        setImageUrl(file_url);
        setUploading(false);
        setScanning(true);

        const res = await invokeLLM({
            prompt: `Analyze this food image and estimate the nutritional content. Be specific about portion sizes. If multiple items, sum them up.`,
            file_urls: [file_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    food_name: { type: 'string' },
                    description: { type: 'string' },
                    calories: { type: 'number' },
                    protein_g: { type: 'number' },
                    carbs_g: { type: 'number' },
                    fat_g: { type: 'number' },
                    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                    suggestions: { type: 'array', items: { type: 'string' } },
                }
            }
        });
        setResult(res);
        setScanning(false);
    };

    const saveToLog = async () => {
        if (!result) return;
        setSaving(true);
        await entities.MealLog.create({
            user_email: user.email,
            date: today(),
            meal_type: new Date().getHours() < 11 ? 'breakfast' : new Date().getHours() < 15 ? 'lunch' : new Date().getHours() < 20 ? 'dinner' : 'snack',
            food_name: result.food_name,
            calories: result.calories,
            protein: result.protein_g,
            carbs: result.carbs_g,
            fats: result.fat_g,
        });
        qc.invalidateQueries({ queryKey: ['meals'] });
        setSaving(false); setSaved(true);
        toast.success(`${result.food_name} logged to your meal diary!`);
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <Camera className="w-7 h-7 text-emerald-400" /> AI Food Scanner
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Snap a photo — AI estimates the nutrition instantly</p>
            </div>

            {/* Upload Zone */}
            <div className="relative glass rounded-3xl border-2 border-dashed border-white/10 overflow-hidden"
                style={{ minHeight: 280 }}
                onClick={() => !uploading && !scanning && fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt="Meal" className="w-full h-72 object-cover" />
                        {scanning && <ScanOverlay />}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-72 gap-4 cursor-pointer hover:bg-white/3 transition-all">
                        {uploading ? (
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold">Take a photo or upload</div>
                                    <div className="text-sm text-muted-foreground mt-1">AI will analyze the nutrition</div>
                                </div>
                                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                                    <Upload className="w-4 h-4 mr-2" /> Choose Image
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {scanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 border border-emerald-500/20 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                    <div className="font-semibold text-emerald-400">AI is analyzing your meal...</div>
                    <div className="text-xs text-muted-foreground mt-1">Detecting ingredients & estimating macros</div>
                </motion.div>
            )}

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        {/* AI Badge */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs text-emerald-400 font-semibold">AI Detected</span>
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded-full ${result.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-400' : result.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                {result.confidence} confidence
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-5 border border-white/10">
                            <h3 className="font-bold text-lg mb-1">{result.food_name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{result.description}</p>

                            {/* Calorie Hero */}
                            <div className="flex items-center justify-center py-4 mb-4">
                                <div className="text-center">
                                    <div className="text-5xl font-bold font-space text-orange-400">{result.calories}</div>
                                    <div className="text-sm text-muted-foreground mt-1">kcal estimated</div>
                                </div>
                            </div>

                            {/* Macros */}
                            <div className="space-y-3">
                                <NutrientBar label="Protein" value={result.protein_g} unit="g" color="#22c55e" max={60} />
                                <NutrientBar label="Carbohydrates" value={result.carbs_g} unit="g" color="#3b82f6" max={100} />
                                <NutrientBar label="Fat" value={result.fat_g} unit="g" color="#a855f7" max={50} />
                            </div>
                        </div>

                        {/* Suggestions */}
                        {result.suggestions?.length > 0 && (
                            <div className="glass rounded-xl p-4 border border-white/5">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Tips</div>
                                <ul className="space-y-1.5">
                                    {result.suggestions.map((s, i) => (
                                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                            <span className="text-emerald-400 mt-0.5">•</span>{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {saved ? (
                            <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
                                <CheckCircle className="w-5 h-5" /><span className="font-semibold">Logged to Meal Diary!</span>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Button onClick={saveToLog} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-12">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Utensils className="w-4 h-4 mr-2" /> Log to Diary</>}
                                </Button>
                                <Button variant="outline" className="border-white/10" onClick={() => { setImageUrl(null); setResult(null); setSaved(false); }}>
                                    Retake
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


