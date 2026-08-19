import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { ShareGuide } from "@/components/common/ShareGuide";
import BookingModal from "@/components/booking/BookingModal";
import { Star, MapPin, Clock, Languages, Award, ChevronRight, Loader2 } from "lucide-react";
import { getApiUrl } from "@/utils/api";

import defaultPandit from "@/assets/Pandit1.png";

interface Pundit {
    id: string;
    name: string;
    location: string;
    timing: string;
    experience: string;
    languages: string[];
    price: number;
    image: string;
    services: { name: string; desc?: string; price?: number }[];
    areasOfExpertise: string[];
    bio?: string;
    extraInfo?: string;
}

const VedicConsultants = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const formId = "astro-booking";
    const isBookingOpen = searchParams.get("form") === formId;
    const [selectedService, setSelectedService] = useState<string>("Vedic Consultation");
    
    const [pundits, setPundits] = useState<Pundit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPundits = async () => {
            try {
                const res = await fetch(getApiUrl("/api/pandit-dashboard/pandits"));
                const data = await res.json();
                if (data.success && data.pandits) {
                    setPundits(data.pandits);
                }
            } catch (err) {
                console.error("Failed to fetch consultants:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPundits();
    }, []);

    const handleOpen = (serviceName?: string) => {
        if (serviceName) setSelectedService(serviceName);
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

    return (
        <div className="min-h-screen flex flex-col bg-stone-50">
            <SEO
                title="Vedic Consultants | Naman Darshan"
                description="Connect with India's top certified Vedic astrologers, numerologists, and Vastu experts for Kundali matching, career growth, and life guidance."
                keywords={["Vedic Consultants", "Astrologers India", "Kundali Matching", "Vastu Shastra", "Online Puja"]}
            />
            <Header />
            <main className="flex-grow pt-40 md:pt-48 lg:pt-52 pb-16">
                <BookingModal
                    isOpen={isBookingOpen}
                    onClose={handleClose}
                    type="astro"
                    serviceName={selectedService}
                />

                {/* Breadcrumbs and Share */}
                <div className="container mx-auto px-4 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                        <nav className="flex items-center space-x-2 text-sm text-stone-500">
                            <a href="/" className="hover:text-primary transition-colors">Home</a>
                            <span>/</span>
                            <a href="/astro-naman" className="hover:text-primary transition-colors">Astro</a>
                            <span>/</span>
                            <span className="text-primary font-medium">Vedic Consultants</span>
                        </nav>
                        <ShareGuide />
                    </div>
                </div>

                {/* Hero Header */}
                <div className="container mx-auto px-4 mb-12">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 font-bold text-sm rounded-full uppercase tracking-wider mb-2">
                            Expert Guidance
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900">
                            Our Vedic Consultants
                        </h1>
                        <p className="text-lg text-stone-600 leading-relaxed">
                            Find answers to your life's most pressing questions. Connect with our experienced astrologers for personalized readings, Kundali matching, and Vastu advice.
                        </p>
                        
                        {/* New User Offer Banner */}
                        <div className="mt-8 mx-auto inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                            <div className="bg-green-100 p-2 rounded-full">
                                <span className="text-2xl block animate-bounce">🎁</span>
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg leading-tight">First Chat is Free!</h3>
                                <p className="text-sm font-medium text-green-700">New users get their first 5 minutes completely free.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pundits List */}
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                        </div>
                    ) : pundits.length === 0 ? (
                        <div className="text-center py-24 text-stone-500">
                            <p className="text-lg">No consultants are currently available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {pundits.map((pundit) => (
                                <div key={pundit.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 overflow-hidden flex flex-col h-full group">
                                    {/* Consultant Image & Header */}
                                    <div className="relative h-64 overflow-hidden bg-white">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                        <img
                                            src={pundit.image || defaultPandit}
                                            alt={pundit.name}
                                            className="w-full h-full object-contain object-bottom group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                                            <h2 className="text-2xl font-bold font-display leading-tight mb-1 drop-shadow-md">
                                                {pundit.name}
                                            </h2>
                                            <div className="flex items-center gap-1.5 text-orange-300 text-sm font-medium">
                                                <Award className="w-4 h-4" />
                                                <span>{pundit.experience}</span>
                                            </div>
                                        </div>
                                        {/* Quick Contact Badge */}
                                        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-stone-900 font-bold text-sm shadow-sm flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            {pundit.timing}
                                        </div>
                                        
                                        {/* Free Chat Badge */}
                                        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 border border-green-400/50 backdrop-blur-sm">
                                            <span>⭐</span> 5 Mins Free
                                        </div>
                                    </div>

                                    {/* Body Content */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        {/* Essential Info */}
                                        <div className="space-y-3 mb-6 pb-6 border-b border-stone-100">
                                            {pundit.location && (
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-stone-400 mt-0.5 shrink-0" />
                                                    <span className="text-stone-600 text-sm">{pundit.location}</span>
                                                </div>
                                            )}
                                            {pundit.languages && pundit.languages.length > 0 && (
                                                <div className="flex items-center gap-3">
                                                    <Languages className="w-5 h-5 text-stone-400 shrink-0" />
                                                    <span className="text-stone-600 text-sm">{pundit.languages.join(", ")}</span>
                                                </div>
                                            )}
                                            {pundit.extraInfo && (
                                                <div className="flex items-start gap-3">
                                                    <Star className="w-5 h-5 text-orange-500 mt-0.5 shrink-0 fill-orange-500" />
                                                    <span className="text-stone-700 font-medium text-sm italic">{pundit.extraInfo}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Services / Expertise */}
                                        <div className="flex-grow">
                                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 border-l-2 border-orange-500 pl-2">
                                                Key Services
                                            </h3>
                                            <div className="space-y-4">
                                                {pundit.services && pundit.services.length > 0 ? pundit.services.map((svc, index) => (
                                                    <div key={index} className="group/svc relative pl-4 border-l border-stone-200 hover:border-orange-400 transition-colors">
                                                        <div className="font-semibold text-stone-800 text-sm mb-1">{svc.name}</div>
                                                        {svc.desc && <p className="text-xs text-stone-500 leading-relaxed mb-1.5">{svc.desc}</p>}
                                                    </div>
                                                )) : pundit.areasOfExpertise?.map((expertise, index) => (
                                                    <div key={index} className="group/svc relative pl-4 border-l border-stone-200 hover:border-orange-400 transition-colors">
                                                        <div className="font-semibold text-stone-800 text-sm mb-1">{expertise}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Footers */}
                                        <div className="mt-8 space-y-3 pt-6 border-t border-stone-100">
                                            <div className="flex gap-2">
                                                <a
                                                    href={`https://api.whatsapp.com/send/?phone=918796973199&text=${encodeURIComponent(`Namaste 🙏\n\nI would like to book a Consultation with ${pundit.name}.`)}&type=phone_number&app_absent=0`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 text-center bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                                >
                                                    WhatsApp Now
                                                </a>
                                                <button
                                                    onClick={() => handleOpen(`Consultation with ${pundit.name}`)}
                                                    className="flex-[2] bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-700 hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Book Session
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default VedicConsultants;
