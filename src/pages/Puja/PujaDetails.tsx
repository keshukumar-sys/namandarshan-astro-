import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Helmet } from 'react-helmet-async';
import { getApiUrl } from "@/utils/api";
import { Clock, MapPin, CheckCircle2, ChevronDown, PlayCircle, Star, ShieldCheck, Sparkles, Calendar, Users, ArrowLeft, Home, ChevronRight, Music, Video } from "lucide-react";
import { Link } from "react-router-dom";
import SacredRitualProcess from "./components/SacredRitualProcess";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PujaBookingModal from "@/components/booking/PujaBookingModal";
import { ShareGuide } from "@/components/common/ShareGuide";
import TempleCard from "@/pages/Temples/components/TempleCard";

import PujaPricingTiers from "./components/PujaPricingTiers";
import PujaBenefits from "./components/PujaBenefits";
import PujaWhoShouldDo from "./components/PujaWhoShouldDo";
import PujaMuhurat from "./components/PujaMuhurat";
import PujaTempleDetails from "./components/PujaTempleDetails";
import PujaTestimonials from "./components/PujaTestimonials";
import PujaGlory from "./components/PujaGlory";
import RelatedPujas from "./components/RelatedPujas";
import StickyBookingCTA from "./components/StickyBookingCTA";

const sectionLabels: Record<string, string> = {
    about: "About Puja",
    benefits: "Benefits",
    "who-should-do": "Who Should Do",
    muhurat: "Muhurat Dates",
    process: "Process",
    temple: "Temple Details",
    packages: "Packages",
    reviews: "Reviews",
    faqs: "FAQs"
};

const PujaDetails = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [puja, setPuja] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const formId = "puja-booking";
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(searchParams.get("form") === formId);
    const [suggestedTemples, setSuggestedTemples] = useState<any[]>([]);
    const [templesLoading, setTemplesLoading] = useState(true);

    useEffect(() => {
        setTemplesLoading(true);
        fetch(getApiUrl("/api/temples"))
            .then(res => res.json())
            .then(data => {
                let list = [];
                if (data.success && Array.isArray(data.data)) {
                    list = data.data;
                } else if (Array.isArray(data)) {
                    list = data;
                }
                const shuffled = [...list].sort(() => 0.5 - Math.random());
                setSuggestedTemples(shuffled.slice(0, 3));
                setTemplesLoading(false);
            })
            .catch(err => {
                console.error("Failed to load suggested temples:", err);
                setTemplesLoading(false);
            });
    }, []);

    useEffect(() => {
        setIsBookingModalOpen(searchParams.get("form") === formId);
    }, [searchParams]);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        fetch(getApiUrl(`/api/pujas/${slug}`))
            .then(res => {
                if (!res.ok) throw new Error("Not found");
                return res.json();
            })
            .then(data => {
                setPuja(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);

                // Final fallback check with -puja suffix just in case the backend exact match fails, 
                // though the backend should handle this ideally
                fetch(getApiUrl(`/api/pujas/${slug}-puja`))
                    .then(res2 => res2.json())
                    .then(data2 => {
                        setPuja(data2);
                        setLoading(false);
                    })
                    .catch(() => {
                        setPuja(null);
                        setLoading(false);
                    });
            });
    }, [slug]);

    const getEmbedUrl = (url: string) => {
        if (!url) return "";
        if (url.includes("youtube.com/embed/")) return url;
        if (url.includes("youtube.com/watch?v=")) {
            const id = url.split("v=")[1]?.split("&")[0];
            return `https://www.youtube.com/embed/${id}`;
        }
        if (url.includes("youtu.be/")) {
            const id = url.split("youtu.be/")[1]?.split("?")[0];
            return `https://www.youtube.com/embed/${id}`;
        }
        return url;
    };

    const handleOpen = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("form", formId);
            return newParams;
        }, { replace: false });
    };

    const handleClose = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("form");
            return newParams;
        }, { replace: true });
    };
    const [bookingMode, setBookingMode] = useState<"online" | "offline">("online");
    const [bookingType, setBookingType] = useState<"Individual" | "Family">("Individual");
    const [activeSection, setActiveSection] = useState("about");

    // Dynamic hash-based URL listener for tabs (back/forward and deep-linking support)
    useEffect(() => {
        const sections = [
            "about",
            "benefits",
            "who-should-do",
            "glory",
            "muhurat",
            "process",
            "temple",
            "reviews",
            "faqs"
        ];

        const topMargin = window.innerWidth >= 1024 ? "-350px" : "-220px";
        const observerOptions = {
            root: null,
            rootMargin: `${topMargin} 0px -40% 0px`,
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => {
            sections.forEach((id) => {
                const el = document.getElementById(id);
                if (el) observer.unobserve(el);
            });
        };
    }, [loading, puja]);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setActiveSection(id);
        
        const el = document.getElementById(id);
        if (el) {
            // Dynamic offset calculation based on viewport width to match sticky headers
            const offset = window.innerWidth >= 1024 ? 340 : 210;
            const elementPosition = el.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const handleBooking = (mode: "online" | "offline", type: "Individual" | "Family") => {
        setBookingMode(mode);
        setBookingType(type);
        handleOpen();
    };

    // Scroll active tab into view horizontally on mobile/desktop as user scrolls down the sections
    useEffect(() => {
        const activeTabEl = document.getElementById(`tab-link-${activeSection}`);
        const containerEl = document.getElementById("puja-tabs-nav");
        
        if (activeTabEl && containerEl) {
            // Calculate the positions
            const containerWidth = containerEl.clientWidth;
            const tabLeft = activeTabEl.offsetLeft;
            const tabWidth = activeTabEl.clientWidth;

            // Center the active tab smoothly within the scrollable container
            const targetScrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
            
            containerEl.scrollTo({
                left: targetScrollLeft,
                behavior: "smooth"
            });
        }
    }, [activeSection]);

    useEffect(() => {
        // Scroll to very top on fresh slug load
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <p className="text-xl text-stone-600">Loading Puja Details...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!puja) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold text-stone-600 mb-4">Puja Not Found</h1>
                    <Button onClick={() => navigate("/puja")}>Back to Pujas</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-stone-50 pb-24 md:pb-0">
            <SEO
                title={puja.seoTitle || `${puja.title} - Online Puja Booking`}
                description={puja.seoDescription || puja.description}
                keywords={puja.seoKeywords || ["Online Puja", puja.title, "Vedic Rituals", "Hindu Puja", puja.location]}
            />
            <Header />
            <main className="flex-grow" style={{ paddingTop: "var(--header-height, 148px)" }}>
                {/* Breadcrumbs - Non-sticky on Mobile, Sticky on Desktop */}
                <div className="puja-breadcrumbs-sticky z-40 bg-[#fffdf4] py-3 border-b border-stone-200 shadow-sm w-full mb-8">
                    <div className="container mx-auto px-4 max-w-7xl">
                        {/* Breadcrumb and Share */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-stone-500 flex-wrap">
                                <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                                <ChevronRight className="w-4 h-4" />
                                <Link to="/puja" className="hover:text-orange-600 transition-colors">Puja</Link>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-stone-900 font-medium">{puja.title}</span>
                            </div>
                            <ShareGuide 
                                pageTitle={puja.title} 
                                description={puja.seoDescription || puja.description?.slice(0, 160)}
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-7xl mb-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* 1. H1 Title & Hero Image */}
                        <div id="about" className="w-full lg:w-[65%] space-y-6 scroll-mt-44">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                                <Star className="w-3 h-3 fill-current" />
                                Premium Vedic Ritual
                            </div>
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900 leading-tight">
                                {puja.title}
                            </h1>
                            <p className="text-lg text-stone-600 leading-relaxed">
                                {puja.description}
                            </p>
                            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-sm border border-stone-200">
                                <img src={puja.image || puja.featuredImage} alt={puja.title} className={`w-full h-full object-${puja.imageFit || 'cover'}`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        </div>

                        {/* Right Column: Top Select Package Card */}
                        <div className="hidden lg:block w-full lg:w-[35%] space-y-6 lg:sticky lg:top-[210px] z-30">
                            <PujaPricingTiers onBook={handleBooking} />
                        </div>
                    </div>
                </div>

                {/* Scroll anchor target for unified page transitions */}
                <div id="puja-content-start" />

                {/* Full-width Sticky Nav Anchors - Sticky Block 2 */}
                <div className="puja-tabs-sticky z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm mb-12">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div id="puja-tabs-nav" className="flex justify-between items-center text-sm font-bold text-stone-500 overflow-x-auto whitespace-nowrap gap-6 no-scrollbar pt-3">
                            {[
                                { id: "about", label: "About Puja" },
                                { id: "benefits", label: "Benefits" },
                                { id: "who-should-do", label: "Who Should Do" },
                                { id: "glory", label: puja.gloryTitle || "Glory & Significance" },
                                { id: "muhurat", label: "Muhurat Dates" },
                                { id: "process", label: "Process" },
                                { id: "temple", label: "Temple Details" },
                                { id: "reviews", label: "Reviews" },
                                { id: "faqs", label: "FAQs" }
                            ].map((item) => {
                                if (item.id === "faqs" && (!puja.faqs || puja.faqs.length === 0)) return null;
                                if (item.id === "glory" && (!puja.importance || puja.importance.length === 0)) return null;
                                const isActive = activeSection === item.id;
                                return (
                                    <a
                                        key={item.id}
                                        id={`tab-link-${item.id}`}
                                        onClick={(e) => handleNavClick(e, item.id)}
                                        className={`transition-all duration-200 flex-shrink-0 pb-3 border-b-2 cursor-pointer ${
                                            isActive
                                                ? "text-saffron border-saffron font-extrabold"
                                                : "text-stone-500 border-transparent hover:text-saffron"
                                        }`}
                                    >
                                        {item.label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        
                        {/* Left Column - Main Content (Scroll Flow) */}
                        <div className="w-full lg:w-[65%] space-y-12 min-h-[450px]">
                            {/* 1. About section */}
                            <div id="about" className="scroll-mt-80 bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                                <h3 className="font-display text-2xl font-bold text-stone-900 flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-saffron" />
                                    About {puja.title}
                                </h3>
                                <div 
                                    className="text-stone-600 leading-relaxed text-lg prose prose-stone max-w-none"
                                    dangerouslySetInnerHTML={{ __html: puja.about || puja.description }}
                                />
                                <div className="border-t border-stone-100 pt-6 space-y-4">
                                    <div className="flex items-center gap-3 text-stone-700">
                                        <Clock className="w-5 h-5 text-saffron" />
                                        <span><strong>Duration:</strong> {puja.duration || "1.5 - 2 Hours"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-stone-700">
                                        <MapPin className="w-5 h-5 text-saffron" />
                                        <span><strong>Performed at:</strong> {puja.location || "Temple / Sacred River Ghats"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-stone-700">
                                        <ShieldCheck className="w-5 h-5 text-saffron" />
                                        <span><strong>100% Certified:</strong> Highly experienced Vedic Pandits with proper verification</span>
                                    </div>
                                </div>
                            </div>

                            <div id="benefits" className="scroll-mt-80">
                                <PujaBenefits puja={puja} />
                            </div>

                            <div id="who-should-do" className="scroll-mt-80">
                                <PujaWhoShouldDo puja={puja} />
                            </div>



                            <div id="muhurat" className="scroll-mt-80">
                                <PujaMuhurat puja={puja} />
                            </div>

                            <div id="process" className="scroll-mt-80">
                                <SacredRitualProcess puja={puja} />
                            </div>

                            <div id="temple" className="scroll-mt-80">
                                <PujaTempleDetails puja={puja} />
                            </div>

                            <div id="packages" className="scroll-mt-80 lg:hidden">
                                <PujaPricingTiers onBook={handleBooking} />
                            </div>

                            {/* Audio Player */}
                            {puja.audioUrl && (
                                <div id="audio" className="scroll-mt-80 bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                                            <Music className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h3 className="font-display text-2xl font-bold text-stone-900">
                                            Listen to {puja.title}
                                        </h3>
                                    </div>
                                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                        <audio controls className="w-full">
                                            <source src={puja.audioUrl} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </div>
                            )}

                            {/* Watch Video */}
                            {puja.videoUrl && (
                                <div id="video" className="scroll-mt-80 bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                                            <Video className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h3 className="font-display text-2xl font-bold text-stone-900">
                                            Watch {puja.title} Video
                                        </h3>
                                    </div>
                                    <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video max-w-3xl mx-auto border border-stone-100 bg-black">
                                        <iframe
                                            src={getEmbedUrl(puja.videoUrl)}
                                            title={puja.title}
                                            className="absolute inset-0 w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            )}

                            <div id="reviews" className="scroll-mt-80">
                                <PujaTestimonials puja={puja} />
                            </div>

                            {puja.faqs && puja.faqs.length > 0 && (
                                <div id="faqs" className="scroll-mt-80 bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
                                    <h3 className="font-display text-2xl font-bold text-stone-900 mb-6">{puja.title} – Common Questions</h3>
                                    <Accordion type="single" collapsible className="w-full space-y-4">
                                        {puja.faqs.map((faq: any, idx: number) => (
                                            <AccordionItem key={idx} value={`item-${idx}`} className="bg-stone-50 border border-stone-100 px-6 rounded-xl">
                                                <AccordionTrigger className="text-left font-semibold text-stone-900 hover:text-orange-600 py-4">
                                                    <span>{faq.question}</span>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-stone-600 leading-relaxed pb-4">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sticky Sidebar */}
                        <div className="hidden lg:block w-full lg:w-[35%] space-y-6 lg:sticky lg:top-[340px]">
                            {/* Quick Book Card */}
                            <div className="bg-gradient-to-br from-orange-600 to-amber-700 text-white p-6 rounded-2xl shadow-md border border-orange-500/20 space-y-5 relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                                <div className="absolute -left-8 -top-8 w-24 h-24 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
                                
                                <div className="relative space-y-4">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider">
                                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                                        Fast & Secure Booking
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h4 className="font-display text-lg font-black leading-tight">
                                            Ready to perform your puja?
                                        </h4>
                                        <p className="text-white/80 text-xs leading-relaxed font-medium">
                                            Select your preference and submit Sankalp details to secure your spot.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2.5 pt-2">
                                        <div className="flex items-center gap-2.5 text-xs font-semibold">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                ✓
                                            </div>
                                            <span>Personalized Sankalp (Name & Gotra)</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                ✓
                                            </div>
                                            <span>Full Video Proof Provided</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-semibold">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                ✓
                                            </div>
                                            <span>Blessed Prasad Home Delivery</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleBooking("online", "Individual")}
                                        className="w-full bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-850 font-black py-5 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                                    >
                                        Book Puja Now
                                    </Button>
                                </div>
                            </div>

                            {/* 1. Related Pujas Sidebar Widget */}
                            <RelatedPujas currentSlug={slug} variant="sidebar" />
                        </div>
                    </div>
                </div>

                {/* 10. Related Pujas (Mobile Only) */}
                <div id="related" className="container mx-auto px-4 max-w-7xl scroll-mt-48 lg:hidden">
                    <RelatedPujas currentSlug={slug} />
                </div>

                {/* Suggested Temples Section */}
                <div className="container mx-auto px-4 max-w-7xl mt-12 mb-16">
                    <h3 className="font-display text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                        <span>🕉</span> Suggested Temples to Explore
                    </h3>
                    {templesLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="h-80 bg-white rounded-3xl border border-stone-250 animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {suggestedTemples.map((temple) => (
                                <TempleCard key={temple._id} temple={temple} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* 11. Sticky Mobile CTA */}
            <div className="lg:hidden">
                <StickyBookingCTA onBook={() => handleBooking("online", "Individual")} title={puja.title} />
            </div>

            <PujaBookingModal
                isOpen={isBookingModalOpen}
                onClose={handleClose}
                mode={bookingMode}
                bookingType={bookingType}
                pujaTitle={puja.title}
                serviceId={slug}
            />
            <Footer />
        </div>
    );
};

export default PujaDetails;
