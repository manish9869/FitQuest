import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { CheckCircle, Clock, AlertTriangle, User, Dumbbell, MessageSquare, Eye, Zap, Loader2, Check, Plus, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TASK_ICONS = { followup: User, review: Eye, plan: Dumbbell, message: MessageSquare, urgent: AlertTriangle };
const PRIORITY_COLORS = {
    high: { badge: 'text-red-400 bg-red-500/10', border: 'border-red-500/25' },
    medium: { badge: 'text-yellow-400 bg-yellow-500/10', border: 'border-yellow-500/25' },
    low: { badge: 'text-muted-foreground bg-white/5', border: 'border-white/10' },
};
const STATUS_CONFIG = {
    todo: { label: 'To Do', color: 'text-red-400', bg: 'bg-red-500/10' },
    in_progress: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    done: { label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export default function UserTasksWidget({ userEmail, showAddTask = false }) {
    const qc = useQueryClient();
    const [movingId, setMovingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [adding, setAdding] = useState(false);
    const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'done'

    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [newType, setNewType] = useState('followup');
    const [newDue, setNewDue] = useState('This week');

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['user-tasks', userEmail],
        queryFn: () => entities.AdminTask.filter({ user_email: userEmail, is_user_specific: true }),
        enabled: !!userEmail,
    });

    const filtered = tasks.filter(t => {
        if (filter === 'pending') return t.status !== 'done';
        if (filter === 'done') return t.status === 'done';
        return true;
    });

    const pendingCount = tasks.filter(t => t.status !== 'done').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;

    const updateTask = async (id, data) => {
        setMovingId(id);
        try {
            await entities.AdminTask.update(id, data);
            qc.invalidateQueries({ queryKey: ['user-tasks', userEmail] });
            qc.invalidateQueries({ queryKey: ['admin-tasks'] });
            toast.success('Task updated');
        } catch {
            toast.error('Failed to update');
        } finally {
            setMovingId(null);
        }
    };

    const deleteTask = async (id) => {
        setDeletingId(id);
        try {
            await entities.AdminTask.delete(id);
            qc.invalidateQueries({ queryKey: ['user-tasks', userEmail] });
            qc.invalidateQueries({ queryKey: ['admin-tasks'] });
            toast.success('Task deleted');
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    };

    const addTask = async () => {
        if (!newTitle.trim()) return;
        setAdding(true);
        try {
            await entities.AdminTask.create({
                title: newTitle.trim(),
                description: '',
                priority: newPriority,
                type: newType,
                status: 'todo',
                due: newDue,
                is_user_specific: true,
                user_email: userEmail,
                sort_order: Date.now(),
            });
            qc.invalidateQueries({ queryKey: ['user-tasks', userEmail] });
            qc.invalidateQueries({ queryKey: ['admin-tasks'] });
            setNewTitle('');
            setShowAdd(false);
            toast.success('Task added');
        } catch {
            toast.error('Failed to add task');
        } finally {
            setAdding(false);
        }
    };

    if (isLoading) return (
        <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 glass rounded-xl animate-pulse border border-white/5" />)}
        </div>
    );

    return (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-sm">Coach Tasks</span>
                    <div className="flex items-center gap-1.5">
                        {pendingCount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                                {pendingCount} pending
                            </span>
                        )}
                        {doneCount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                                {doneCount} done
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filter pills */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                        {['pending', 'done', 'all'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`text-[11px] px-2.5 py-1 rounded-md font-medium capitalize transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    {showAddTask && (
                        <button onClick={() => setShowAdd(v => !v)}
                            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-semibold transition-all border border-yellow-500/20">
                            <Plus className="w-3 h-3" /> Add Task
                        </button>
                    )}
                </div>
            </div>

            {/* Add task inline form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-b border-white/5 overflow-hidden">
                        <div className="px-5 py-4 space-y-3 bg-yellow-500/3">
                            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                placeholder="Task title..." className="bg-white/5 border-white/10 text-sm h-9"
                                onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus />
                            <div className="flex items-center gap-2 flex-wrap">
                                <Select value={newPriority} onValueChange={setNewPriority}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">🔴 High</SelectItem>
                                        <SelectItem value="medium">🟡 Medium</SelectItem>
                                        <SelectItem value="low">⚪ Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={newType} onValueChange={setNewType}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="followup">👤 Follow Up</SelectItem>
                                        <SelectItem value="review">👁 Review</SelectItem>
                                        <SelectItem value="plan">🏋️ Plan</SelectItem>
                                        <SelectItem value="message">💬 Message</SelectItem>
                                        <SelectItem value="urgent">⚠️ Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={newDue} onValueChange={setNewDue}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Today">Today</SelectItem>
                                        <SelectItem value="Tomorrow">Tomorrow</SelectItem>
                                        <SelectItem value="This week">This week</SelectItem>
                                        <SelectItem value="Next week">Next week</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-1.5 ml-auto">
                                    <Button onClick={() => setShowAdd(false)} variant="ghost" className="h-8 px-3 text-xs text-muted-foreground">
                                        Cancel
                                    </Button>
                                    <Button onClick={addTask} disabled={adding || !newTitle.trim()}
                                        className="h-8 px-3 text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                                        {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task list */}
            <div className="divide-y divide-white/5">
                {filtered.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground/50 italic">
                        {filter === 'pending' ? 'No pending tasks' : filter === 'done' ? 'No completed tasks' : 'No tasks yet'}
                    </div>
                )}
                <AnimatePresence>
                    {filtered.map((task, i) => {
                        const Icon = TASK_ICONS[task.type] || Zap;
                        const isDone = task.status === 'done';
                        const isMoving = movingId === task.id;
                        const isDeleting = deletingId === task.id;
                        const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
                        const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

                        return (
                            <motion.div key={task.id}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: isMoving || isDeleting ? 0.4 : 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.03 }}
                                className={`flex items-center gap-4 px-5 py-3.5 group hover:bg-white/2 transition-colors ${isDone ? 'opacity-60' : ''}`}>

                                {/* Status toggle button */}
                                <button onClick={() => updateTask(task.id, { status: isDone ? 'todo' : 'done' })}
                                    disabled={isMoving}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-emerald-500/60'}`}>
                                    {isDone && <Check className="w-3 h-3 text-white" />}
                                </button>

                                {/* Icon */}
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-white/5' : 'bg-white/5'}`}>
                                    <Icon className={`w-3.5 h-3.5 ${isDone ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${pc.badge}`}>
                                            {task.priority}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${sc.bg} ${sc.color}`}>
                                            {sc.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />{task.due}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions — visible on hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    {task.status !== 'in_progress' && !isDone && (
                                        <button onClick={() => updateTask(task.id, { status: 'in_progress' })}
                                            className="text-[10px] px-2 py-1 rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all font-medium">
                                            In Progress
                                        </button>
                                    )}
                                    {isDone && (
                                        <button onClick={() => updateTask(task.id, { status: 'todo' })}
                                            className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground transition-all">
                                            Reopen
                                        </button>
                                    )}
                                    <button onClick={() => deleteTask(task.id)} disabled={isDeleting}
                                        className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all">
                                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : '×'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}