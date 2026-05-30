import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "How do your coaching programs work?",
        answer: "After you sign up, we have an in-depth consultation to understand your goals, lifestyle, and any limitations. I then create a fully customized workout and nutrition plan. We check in weekly via chat or video call, and I adjust your program based on your progress.",
    },
    {
        question: "How quickly will I see results?",
        answer: "Most clients start seeing noticeable changes within 4-6 weeks. Significant transformations typically happen in 3-6 months. Results depend on consistency, adherence to the plan, and individual factors like starting point and genetics.",
    },
    {
        question: "Do I need a gym membership?",
        answer: "Not necessarily! I offer both gym-based and home workout programs. If you prefer to train at home, I'll design an effective program using minimal equipment like dumbbells, resistance bands, or just bodyweight.",
    },
    {
        question: "What does the nutrition coaching involve?",
        answer: "Depending on your plan, I'll provide macro targets, meal templates, food swaps, and recipe suggestions. I focus on sustainable, flexible eating rather than restrictive diets. Premium and Elite plans include fully custom meal plans.",
    },
    {
        question: "Can I cancel or change my plan anytime?",
        answer: "Yes. You can upgrade, downgrade, or cancel your plan at any time. If you're not satisfied within the first 7 days, I offer a full refund — no questions asked.",
    },
    {
        question: "How is online coaching different from in-person training?",
        answer: "Online coaching gives you the flexibility to train on your schedule, from anywhere. You get the same level of personalization and accountability — often at a lower cost. We stay connected via app, chat, and video calls.",
    },
];

export default function FAQSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <section id="faq" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-white/[0.02] to-background" />

            <div ref={ref} className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">FAQ</span>
                    <h2 className="text-3xl md:text-5xl font-space font-bold mt-4 mb-6">
                        Common <span className="text-gradient-green">Questions</span>
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Everything you need to know before starting your transformation journey.
                    </p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
                            className="glass border border-white/5 rounded-xl overflow-hidden hover:border-emerald-500/20 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <span className="font-semibold pr-4">{faq.question}</span>
                                <motion.div
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0"
                                >
                                    <ChevronDown className="h-5 w-5 text-emerald-400" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-5 pb-5 text-muted-foreground leading-relaxed border-t border-white/5 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}


