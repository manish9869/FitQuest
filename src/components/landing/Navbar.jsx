import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

const navItems = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Programs", href: "#programs" },
    { name: "Transformations", href: "#transformations" },
    { name: "Tools", href: "#tools" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#contact" },
]

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        window.addEventListener("scroll", handleScroll)

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass py-3" : "bg-transparent py-5"
                    }`}
            >
                <div className="container mx-auto flex items-center justify-between px-4">
                    {/* Logo */}
                    <a href="#home" className="group flex items-center gap-2">
                        <div className="relative">
                            <Dumbbell className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />

                            <div className="absolute inset-0 bg-primary/30 blur-lg transition-all group-hover:bg-primary/50" />
                        </div>

                        <span className="text-xl font-bold tracking-tight">
                            Fit with <span className="text-primary">Sudarshan</span>
                        </span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                {item.name}

                                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all group-hover:w-full" />
                            </a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden items-center gap-3 lg:flex">
                        <Link to="/dashboard">
                            <Button variant="ghost">
                                Dashboard
                            </Button>
                        </Link>

                        <Link to="/dashboard">
                            <Button className="glow-lime">
                                Start Your Journey
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-foreground transition-colors hover:text-primary lg:hidden"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 pt-20 lg:hidden"
                    >
                        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />

                        <div className="relative container mx-auto px-4 py-8">
                            <div className="flex flex-col gap-2">
                                {navItems.map((item, index) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <a
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block rounded-lg px-4 py-3 text-lg font-medium text-foreground transition-all hover:bg-muted/50 hover:text-primary"
                                        >
                                            {item.name}
                                        </a>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: navItems.length * 0.05 }}
                                    className="mt-4 flex flex-col gap-3"
                                >
                                    <Link to="/dashboard">
                                        <Button variant="outline" className="w-full">
                                            Dashboard
                                        </Button>
                                    </Link>

                                    <Link to="/dashboard">
                                        <Button className="glow-lime w-full" size="lg">
                                            Start Your Journey
                                        </Button>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}


