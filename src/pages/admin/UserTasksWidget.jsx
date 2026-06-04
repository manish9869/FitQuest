import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Zap, Plus, Check, Trash2, Clock, AlertTriangle,
    User, Dumbbell, MessageSquare, Eye, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { entities } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ── Constants (mirrors AdminTasks) ───────────────────────────────────────────
const TASK_ICONS = {
    followup: User,
    review: Eye,
    plan: Dumbbell,
    message: MessageSquare,
    urgent: AlertTriangle,
};
const TASK_COLORS = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-white/10 bg-white/5',
};
const PRIORITY_BADGE = {
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-muted-foreground bg-white/5',
};
const COLUMNS = [
    { key: 'todo', label: 'To Do', color: 'text-red-400', bg: 'bg-red-500/10' },
    { key: 'in_progress', label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { key: 'done', label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function UserTasksWidget({ userEmail, showAddTask = true }) {
    const qc = useQueryClient();
    const queryKey = ['user-tasks', userEmail];

    // Form state
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [newType, setNewType] = useState('followup');
    const [newDue, setNewDue] = useState('This week');
    const [adding, setAdding] = useState(false);
    const [movingId, setMovingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Fetch only tasks for this user
    const { data: allTasks = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => entities.AdminTask.filter({ user_email: userEmail }),
        enabled: !!userEmail,
    });

    const tasksByStatus = {
        todo: allTasks.filter(t => t.status === 'todo'),
        in_progress: allTasks.filter(t => t.status === 'in_progress'),
        done: allTasks.filter(t => t.status === 'done'),
    };

    const total = allTasks.length;
    const done = tasksByStatus.done.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    // ── Actions ───────────────────────────────────────────────────────────────
    const moveTask = async (id, to) => {
        setMovingId(id);
        try {
            await entities.AdminTask.update(id, { status: to });
            qc.invalidateQueries({ queryKey });
            toast.success(`Moved to ${to.replace('_', ' ')}`);
        } catch {
            toast.error('Failed to move task');
        } finally {
            setMovingId(null);
        }
    };

    const deleteTask = async (id) => {
        setDeletingId(id);
        try {
            await entities.AdminTask.delete(id);
            qc.invalidateQueries({ queryKey });
            toast.success('Task deleted');
        } catch {
            toast.error('Failed to delete task');
        } finally {
            setDeletingId(null);
        }
    };

    const addTask = async () => {
        if (!newTask.trim() || !userEmail) return;
        setAdding(true);
        try {
            await entities.AdminTask.create({
                title: newTask.trim(),
                description: '',
                priority: newPriority,
                type: newType,
                status: 'todo',
                due: newDue,
                is_user_specific: true,
                user_email: userEmail,
                sort_order: Date.now(),
            });
            qc.invalidateQueries({ queryKey });
            setNewTask('');
            setNewDue('This week');
            setNewPriority('medium');
            setNewType('followup');
            toast.success('Task added');
        } catch {
            toast.error('Failed to add task');
        } finally {
            setAdding(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-space font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" /> User Task Board
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Tasks assigned to this user</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass px-3 py-1.5 rounded-xl border border-white/5 text-sm">
                        <span className="text-emerald-400 font-bold">{done}/{total}</span>
                        <span className="text-muted-foreground ml-1">done</span>
                    </div>
                    <div className="glass px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500 rounded-full"
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-emerald-400 font-bold">{progress}%</span>
                    </div>
                </div>
            </div>

            {/* Add Task Form */}
            {showAddTask && (
                <div className="glass rounded-2xl p-4 border border-white/5 space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">Add Task for User</h4>

                    <Input
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        placeholder="Task title..."
                        className="bg-white/5 border-white/10"
                        onKeyDown={e => e.key === 'Enter' && addTask()}
                    />

                    <div className="flex gap-2 flex-wrap">
                        <Select value={newPriority} onValueChange={setNewPriority}>
                            <SelectTrigger className="bg-white/5 border-white/10 w-32">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">🔴 High</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="low">⚪ Low</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={newType} onValueChange={setNewType}>
                            <SelectTrigger className="bg-white/5 border-white/10 w-36">
                                <SelectValue placeholder="Type" />
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
                            <SelectTrigger className="bg-white/5 border-white/10 w-36">
                                <SelectValue placeholder="Due" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Today">Today</SelectItem>
                                <SelectItem value="Tomorrow">Tomorrow</SelectItem>
                                <SelectItem value="This week">This week</SelectItem>
                                <SelectItem value="Next week">Next week</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={addTask}
                            disabled={adding || !newTask.trim()}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold ml-auto"
                        >
                            {adding
                                ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                : <Plus className="w-4 h-4 mr-1" />}
                            Add Task
                        </Button>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            {isLoading ? (
                <div className="grid lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-3">
                            {[1, 2].map(j => (
                                <div key={j} className="h-28 glass rounded-xl animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-5">
                    {COLUMNS.map(col => (
                        <div key={col.key}>
                            {/* Column header */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`w-6 h-6 rounded-full ${col.bg} ${col.color} flex items-center justify-center text-xs font-bold`}>
                                    {tasksByStatus[col.key].length}
                                </span>
                                <h4 className="font-semibold text-sm">{col.label}</h4>
                            </div>

                            {/* Cards */}
                            <div className="space-y-3 min-h-32">
                                <AnimatePresence>
                                    {tasksByStatus[col.key].length === 0 && (
                                        <div className="h-24 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground/50">No tasks</span>
                                        </div>
                                    )}

                                    {tasksByStatus[col.key].map((task, i) => {
                                        const Icon = TASK_ICONS[task.type] || Zap;
                                        const isMoving = movingId === task.id;
                                        const isDeleting = deletingId === task.id;

                                        return (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: isMoving || isDeleting ? 0.5 : 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <div className={`glass rounded-xl p-4 border ${TASK_COLORS[task.priority]} hover:border-white/15 transition-all group`}>
                                                    {/* Title row */}
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                            <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                                                        </div>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ml-1 ${PRIORITY_BADGE[task.priority]}`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>

                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mb-2 ml-6">{task.description}</p>
                                                    )}

                                                    {/* Meta */}
                                                    <div className="flex items-center gap-2 ml-6 flex-wrap">
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" />{task.due}
                                                        </span>
                                                    </div>

                                                    {/* Actions — visible on hover */}
                                                    <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                                                        {col.key !== 'todo' && (
                                                            <button
                                                                onClick={() => moveTask(task.id, 'todo')}
                                                                disabled={isMoving}
                                                                className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                                                            >
                                                                ← To Do
                                                            </button>
                                                        )}
                                                        {col.key !== 'in_progress' && (
                                                            <button
                                                                onClick={() => moveTask(task.id, 'in_progress')}
                                                                disabled={isMoving}
                                                                className="text-[10px] px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all"
                                                            >
                                                                In Progress
                                                            </button>
                                                        )}
                                                        {col.key !== 'done' && (
                                                            <button
                                                                onClick={() => moveTask(task.id, 'done')}
                                                                disabled={isMoving}
                                                                className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
                                                            >
                                                                <Check className="w-3 h-3 inline" /> Done
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteTask(task.id)}
                                                            disabled={isDeleting}
                                                            className="text-[10px] px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all ml-auto"
                                                        >
                                                            {isDeleting
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <Trash2 className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}