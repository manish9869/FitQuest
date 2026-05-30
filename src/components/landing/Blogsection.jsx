import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
const blogPosts = [
    {
        id: 1,
        title: "The Science Behind Fat Loss: What Actually Works",
        excerpt: "Understanding the fundamentals of fat loss and why crash diets don't work. Learn the sustainable approach to losing weight.",
        category: "Fat Loss",
        readTime: "5 min read",
        date: "Dec 15, 2024",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=340&fit=crop&q=80",
    },
    {
        id: 2,
        title: "Protein: How Much Do You Really Need?",
        excerpt: "Debunking myths about protein intake and finding the optimal amount for your fitness goals.",
        category: "Nutrition",
        readTime: "4 min read",
        date: "Dec 10, 2024",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=340&fit=crop&q=80",
    },
    {
        id: 3,
        title: "Recovery: The Missing Piece in Your Fitness Puzzle",
        excerpt: "Why rest days are just as important as training days and how to optimize your recovery.",
        category: "Recovery",
        readTime: "6 min read",
        date: "Dec 5, 2024",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=340&fit=crop&q=80",
    },
    {
        id: 4,
        title: "Building Muscle After 30: A Complete Guide",
        excerpt: "Age is just a number. Learn how to build and maintain muscle as you get older.",
        category: "Muscle Building",
        readTime: "7 min read",
        date: "Nov 28, 2024",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=340&fit=crop&q=80",
    },
    {
        id: 5,
        title: "Pre-Workout Nutrition: Fuel Your Performance",
        excerpt: "What to eat before training for optimal energy and performance in the gym.",
        category: "Nutrition",
        readTime: "4 min read",
        date: "Nov 20, 2024",
        image: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&h=340&fit=crop&q=80",
    },
    {
        id: 6,
        title: "Home Workout Essentials: No Gym Required",
        excerpt: "Build an effective workout routine at home with minimal equipment.",
        category: "Workouts",
        readTime: "5 min read",
        date: "Nov 15, 2024",
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=340&fit=crop&q=80",
    },
]


// Removed TypeScript Record type — plain object works in JSX
const categoryColors = {
    "Fat Loss": "bg-orange-500/20 text-orange-400",
    "Nutrition": "bg-green-500/20 text-green-400",
    "Recovery": "bg-blue-500/20 text-blue-400",
    "Muscle Building": "bg-red-500/20 text-red-400",
    "Workouts": "bg-primary/20 text-primary",
}

export function BlogSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">Blog</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Fitness <span className="text-primary">Insights</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Free educational content to help you on your fitness journey. Tips, guides, and science-backed advice.
                    </p>
                </motion.div>

                {/* Blog Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogPosts.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                            className="group"
                        >
                            <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all h-full flex flex-col">
                                {/* Blog thumbnail image */}
                                <div className="aspect-video relative overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Category Badge */}
                                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[post.category] || "bg-primary/20 text-primary"}`}>
                                        {post.category}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                        <span>{post.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {post.readTime}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                                        {post.excerpt}
                                    </p>

                                    <Button variant="ghost" className="w-fit p-0 h-auto text-primary hover:bg-transparent group/btn">
                                        Read More
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* View All CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-center mt-12"
                >
                    <Button variant="outline" size="lg" className="group">
                        View All Articles
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}


