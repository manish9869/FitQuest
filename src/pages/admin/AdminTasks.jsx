import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Plus, Check, Trash2, Clock, AlertTriangle, User, Dumbbell, MessageSquare, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';

const TASK_ICONS = { followup: User, review: Eye, plan: Dumbbell, message: MessageSquare, urgent: AlertTriangle };
const TASK_COLORS = { high: 'border-red-500/30 bg-red-500/5', medium: 'border-yellow-500/30 bg-yellow-500/5', low: 'border-white/10 bg-white/2' };
const PRIORITY_BADGE = { high: 'text-red-400 bg-red-500/10', medium: 'text-yellow-400 bg-yellow-500/10', low: 'text-muted-foreground bg-white/5' };

const INITIAL_TASKS = {
    todo: [
        { id: 1, title: 'Follow up with Sarah K.', desc: '5 days inactive — needs intervention', priority: 'high', type: 'followup', due: 'Today', user: 'Sarah K.' },
        { id: 2, title: 'Review Mike\'s progress photos', desc: 'Submitted 3 days ago, pending review', priority: 'medium', type: 'review', due: 'Today', user: 'Mike R.' },
        { id: 3, title: 'Update John\'s workout plan', desc: 'Week 4 progression ready', priority: 'medium', type: 'plan', due: 'Tomorrow', user: 'John D.' },
        { id: 4, title: 'Send hydration reminders', desc: 'Water tracking down 6% this week', priority: 'low', type: 'message', due: 'This week', user: 'All Users' },
    ],
    in_progress: [
        { id: 5, title: 'Create monthly progress reports', desc: 'Due by end of week', priority: 'medium', type: 'review', due: 'Friday', user: 'All Clients' },
        { id: 6, title: 'Respond to nutrition questions', desc: '3 unanswered queries in chat', priority: 'high', type: 'message', due: 'Today', user: 'Multiple' },
    ],
    done: [
        { id: 7, title: 'Assigned new training plan to Priya', desc: 'Completed', priority: 'low', type: 'plan', due: 'Done', user: 'Priya S.' },
        { id: 8, title: 'Sent weekly check-in messages', desc: 'Sent to 12 clients', priority: 'low', type: 'message', due: 'Done', user: 'All Users' },
    ],
};

export default function AdminTasks() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [newTask, setNewTask] = useState('');
    const [dragId, setDragId] = useState(null);

    const total = Object.values(tasks).flat().length;
    const done = tasks.done.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    const moveTask = (id, from, to) => {
        const task = tasks[from].find(t => t.id === id);
        if (!task) return;
        setTasks(prev => ({
            ...prev,
            [from]: prev[from].filter(t => t.id !== id),
            [to]: [...prev[to], task],
        }));
        toast.success(`Moved to ${to.replace('_', ' ')}`);
    };

    const deleteTask = (id, col) => {
        setTasks(prev => ({ ...prev, [col]: prev[col].filter(t => t.id !== id) }));
    };

    const addTask = () => {
        if (!newTask.trim()) return;
        const task = { id: Date.now(), title: newTask, desc: '', priority: 'medium', type: 'followup', due: 'This week', user: '' };
        setTasks(prev => ({ ...prev, todo: [task, ...prev.todo] }));
        setNewTask('');
    };

    const COLUMNS = [
        { key: 'todo', label: 'To Do', color: 'text-red-400', bg: 'bg-red-500/10', count: tasks.todo.length },
        { key: 'in_progress', label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10', count: tasks.in_progress.length },
        { key: 'done', label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/10', count: tasks.done.length },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2"><Zap className="w-7 h-7 text-yellow-400" /> Coach Task Board</h1>
                    <p className="text-sm text-muted-foreground mt-1">Trainer workflow management</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass px-4 py-2 rounded-xl border border-white/5 text-sm">
                        <span className="text-emerald-400 font-bold">{done}/{total}</span> tasks done
                    </div>
                    <div className="glass px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-emerald-400 font-bold">{progress}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Task */}
            <div className="flex gap-2">
                <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..."
                    className="bg-white/5 border-white/10 flex-1" onKeyDown={e => e.key === 'Enter' && addTask()} />
                <Button onClick={addTask} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
            </div>

            {/* Kanban */}
            <div className="grid lg:grid-cols-3 gap-5">
                {COLUMNS.map(col => (
                    <div key={col.key}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full ${col.bg} ${col.color} flex items-center justify-center text-xs font-bold`}>{col.count}</span>
                                <h3 className="font-semibold text-sm">{col.label}</h3>
                            </div>
                        </div>
                        <div className="space-y-3 min-h-32">
                            <AnimatePresence>
                                {tasks[col.key].map((task, i) => {
                                    const Icon = TASK_ICONS[task.type] || Zap;
                                    return (
                                        <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                                            <div className={`glass rounded-xl p-4 border ${TASK_COLORS[task.priority]} hover:border-white/15 transition-all group`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                                                    </div>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ml-1 ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                                                </div>
                                                {task.desc && <p className="text-xs text-muted-foreground mb-2 ml-6">{task.desc}</p>}
                                                <div className="flex items-center gap-2 ml-6">
                                                    {task.user && <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{task.user}</span>}
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{task.due}</span>
                                                </div>
                                                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {col.key !== 'todo' && <button onClick={() => moveTask(task.id, col.key, 'todo')} className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground transition-all">← To Do</button>}
                                                    {col.key !== 'in_progress' && <button onClick={() => moveTask(task.id, col.key, 'in_progress')} className="text-[10px] px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all">In Progress</button>}
                                                    {col.key !== 'done' && <button onClick={() => moveTask(task.id, col.key, 'done')} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"><Check className="w-3 h-3 inline" /> Done</button>}
                                                    <button onClick={() => deleteTask(task.id, col.key)} className="text-[10px] px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all ml-auto"><Trash2 className="w-3 h-3" /></button>
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
        </div>
    );
}


