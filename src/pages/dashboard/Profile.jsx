import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Camera, Save, Loader2, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
    const { user } = useAuth();
    const qc = useQueryClient();

    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatar_url || '');
        }
        if (user) setFullName(user.user_metadata?.full_name || '');
    }, [profile, user]);

    const updateProfile = useMutation({
        mutationFn: (data) => profile
            ? entities.UserProfile.update(profile.id, data)
            : entities.UserProfile.create({ user_email: user.email, ...data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['userProfile'] });
            toast.success('Profile updated!');
        },
    });

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarUploading(true);
        const { file_url } = await entities.UserProfile.uploadFile(file);
        setAvatarUrl(file_url);
        setAvatarUploading(false);
        updateProfile.mutate({ phone, avatar_url: file_url });
    };

    const handleSave = async () => {
        updateProfile.mutate({ phone, avatar_url: avatarUrl });
        // Update display name in Supabase auth
        if (fullName !== user?.user_metadata?.full_name) {
            await supabase.auth.updateUser({ data: { full_name: fullName } });
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
    );

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <User className="w-7 h-7 text-emerald-400" /> My Profile
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your personal details</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-white/5 p-6 flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-500/20 flex items-center justify-center text-3xl font-bold text-emerald-400 border-2 border-emerald-500/30">
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            : (user?.user_metadata?.full_name || user?.email || 'A')[0].toUpperCase()}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-400 transition-colors shadow-lg">
                        {avatarUploading ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Camera className="w-4 h-4 text-black" />}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                    </label>
                </div>
                <div className="text-center">
                    <div className="font-semibold">{user?.user_metadata?.full_name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass rounded-2xl border border-white/5 p-6 space-y-5">
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Full Name
                    </label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)}
                        placeholder="Your name" className="bg-white/5 border-white/10" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> Email
                        <span className="ml-1 flex items-center gap-0.5 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" /> Login credential
                        </span>
                    </label>
                    <Input value={user?.email || ''} disabled className="bg-white/5 border-white/10 opacity-60 cursor-not-allowed" />
                    <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed as it's used to log in.</p>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> Phone Number
                    </label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/10" />
                </div>
                <Button onClick={handleSave} disabled={updateProfile.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                    {updateProfile.isPending
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Account Status
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/3 rounded-xl p-3">
                        <div className="text-muted-foreground">Role</div>
                        <div className="font-semibold capitalize mt-0.5 text-emerald-400">{user?.role || 'user'}</div>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3">
                        <div className="text-muted-foreground">Member since</div>
                        <div className="font-semibold mt-0.5">
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                        </div>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3">
                        <div className="text-muted-foreground">Login streak</div>
                        <div className="font-semibold mt-0.5 text-orange-400">{profile?.login_streak || 0} days 🔥</div>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3">
                        <div className="text-muted-foreground">Total XP</div>
                        <div className="font-semibold mt-0.5 text-yellow-400">{(profile?.total_xp || 0).toLocaleString()} XP</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}


