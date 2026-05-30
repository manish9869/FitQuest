import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
    Flame,
    Activity,
    Moon,
    Droplets,
    Target,
    TrendingUp,
    Calendar,
    Award,
} from "lucide-react"

const dashboardData = {
    calories: { burned: 2450, goal: 2500, label: "Calories Burned" },
    workouts: { completed: 5, goal: 6, label: "Weekly Workouts" },
    water: { consumed: 2.8, goal: 3.5, label: "Water (L)" },
    sleep: { hours: 7.2, goal: 8, label: "Sleep Hours" },
    streak: 23,
    weeklyProgress: [65, 72, 68, 80, 75, 85, 78],
    activities: [
        { day: "Mon", type: "Chest", duration: "45 min", calories: 380 },
        { day: "Tue", type: "Back", duration: "50 min", calories: 420 },
        { day: "Wed", type: "Rest", duration: "-", calories: 0 },
        { day: "Thu", type: "Legs", duration: "55 min", calories: 520 },
        { day: "Fri", type: "Shoulders", duration: "40 min", calories: 350 },
        { day: "Sat", type: "Arms", duration: "35 min", calories: 280 },
        { day: "Sun", type: "Cardio", duration: "30 min", calories: 400 },
    ],
    achievements: [
        { name: "First Week", icon: Award, unlocked: true },
        { name: "10 Workouts", icon: Target, unlocked: true },
        { name: "30 Day Streak", icon: Flame, unlocked: false },
        { name: "Goal Crusher", icon: TrendingUp, unlocked: true },
    ],
}
function CircularProgress({
    value,
    max,
    size = 120,
    strokeWidth = 8,
    color = "text-primary",
}) {
    const percentage = Math.min((value / max) * 100, 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-muted"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className={color}
                    strokeLinecap="round"
                    initial={{
                        strokeDasharray: circumference,
                        strokeDashoffset: circumference,
                    }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">
                    {Math.round(percentage)}%
                </span>
            </div>
        </div>
    )
}


export default function DashboardSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">
                        Track Progress
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Smart Fitness <span className="text-primary">Dashboard</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Get a glimpse of our comprehensive tracking dashboard. Monitor your progress,
                        track habits, and stay motivated with real-time insights.
                    </p>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="glass-card rounded-3xl p-6 md:p-8 border-primary/20">
                        {/* Dashboard Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold">Welcome back, Champion!</h3>
                                <p className="text-muted-foreground text-sm">Here&apos;s your weekly progress</p>
                            </div>
                            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                                <Flame className="h-5 w-5 text-orange-400" />
                                <span className="font-bold">{dashboardData.streak} Day Streak</span>
                            </div>
                        </div>

                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {/* Calories */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="glass-card rounded-2xl p-4 text-center"
                            >
                                <Flame className="h-6 w-6 text-orange-400 mx-auto mb-3" />
                                <CircularProgress
                                    value={dashboardData.calories.burned}
                                    max={dashboardData.calories.goal}
                                    size={100}
                                    color="text-orange-400"
                                />
                                <p className="text-sm text-muted-foreground mt-3">{dashboardData.calories.label}</p>
                                <p className="font-semibold">{dashboardData.calories.burned} / {dashboardData.calories.goal}</p>
                            </motion.div>

                            {/* Workouts */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="glass-card rounded-2xl p-4 text-center"
                            >
                                <Activity className="h-6 w-6 text-primary mx-auto mb-3" />
                                <CircularProgress
                                    value={dashboardData.workouts.completed}
                                    max={dashboardData.workouts.goal}
                                    size={100}
                                    color="text-primary"
                                />
                                <p className="text-sm text-muted-foreground mt-3">{dashboardData.workouts.label}</p>
                                <p className="font-semibold">{dashboardData.workouts.completed} / {dashboardData.workouts.goal}</p>
                            </motion.div>

                            {/* Water */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.4, delay: 0.5 }}
                                className="glass-card rounded-2xl p-4 text-center"
                            >
                                <Droplets className="h-6 w-6 text-blue-400 mx-auto mb-3" />
                                <CircularProgress
                                    value={dashboardData.water.consumed}
                                    max={dashboardData.water.goal}
                                    size={100}
                                    color="text-blue-400"
                                />
                                <p className="text-sm text-muted-foreground mt-3">{dashboardData.water.label}</p>
                                <p className="font-semibold">{dashboardData.water.consumed} / {dashboardData.water.goal}</p>
                            </motion.div>

                            {/* Sleep */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.4, delay: 0.6 }}
                                className="glass-card rounded-2xl p-4 text-center"
                            >
                                <Moon className="h-6 w-6 text-indigo-400 mx-auto mb-3" />
                                <CircularProgress
                                    value={dashboardData.sleep.hours}
                                    max={dashboardData.sleep.goal}
                                    size={100}
                                    color="text-indigo-400"
                                />
                                <p className="text-sm text-muted-foreground mt-3">{dashboardData.sleep.label}</p>
                                <p className="font-semibold">{dashboardData.sleep.hours} / {dashboardData.sleep.goal}</p>
                            </motion.div>
                        </div>

                        {/* Weekly Activity & Achievements */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Weekly Activity */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.7 }}
                                className="lg:col-span-2 glass-card rounded-2xl p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">This Week&apos;s Workouts</h4>
                                </div>
                                <div className="space-y-2">
                                    {dashboardData.activities.map((activity, index) => (
                                        <motion.div
                                            key={activity.day}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                                            transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                                            className={`flex items-center justify-between p-3 rounded-lg ${activity.type === "Rest" ? "bg-muted/30" : "bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 text-sm font-medium text-muted-foreground">
                                                    {activity.day}
                                                </span>
                                                <span className={`font-medium ${activity.type === "Rest" ? "text-muted-foreground" : ""}`}>
                                                    {activity.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-muted-foreground">{activity.duration}</span>
                                                {activity.calories > 0 && (
                                                    <span className="text-primary font-medium">{activity.calories} kcal</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Achievements */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.7 }}
                                className="glass-card rounded-2xl p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Award className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">Achievements</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {dashboardData.achievements.map((achievement, index) => (
                                        <motion.div
                                            key={achievement.name}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                            transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                                            className={`p-3 rounded-xl text-center ${achievement.unlocked
                                                ? "glass-card border-primary/30"
                                                : "bg-muted/20 opacity-50"
                                                }`}
                                        >
                                            <achievement.icon className={`h-6 w-6 mx-auto mb-2 ${achievement.unlocked ? "text-primary" : "text-muted-foreground"
                                                }`} />
                                            <p className="text-xs font-medium">{achievement.name}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Progress Chart Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 1 }}
                            className="mt-6 glass-card rounded-2xl p-5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">Weekly Progress</h4>
                                </div>
                                <span className="text-sm text-primary font-medium">+12% this week</span>
                            </div>
                            <div className="flex items-end justify-between h-32 gap-2">
                                {dashboardData.weeklyProgress.map((value, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex-1 bg-primary/20 rounded-t-lg relative overflow-hidden"
                                        initial={{ height: 0 }}
                                        animate={isInView ? { height: `${value}%` } : {}}
                                        transition={{ duration: 0.5, delay: 1.1 + index * 0.05 }}
                                    >
                                        <div
                                            className="absolute inset-0 bg-gradient-to-t from-primary to-primary/50"
                                            style={{ height: "100%" }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}


