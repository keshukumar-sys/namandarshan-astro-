import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { ShareGuide } from "@/components/common/ShareGuide";
import BookingModal from "@/components/booking/BookingModal";
import { Star, MapPin, Clock, Languages, Award, ChevronRight } from "lucide-react";

import pandit1 from "@/assets/Pandit1.png";
import pandit2 from "@/assets/Pandit2.png";
import pandit3 from "@/assets/Pandit3.png";
import pandit4 from "@/assets/Pandit4.png";
import pandit5 from "@/assets/Pandit5.png";
import pandit6 from "@/assets/Pandit6.png";

interface Pundit {
    id: number;
    name: string;
    location: string;
    timing: string;
    experience: string;
    languages: string;
    price: string;
    image: string;
    services: { name: string; desc?: string; price?: string }[];
    expertise: string[];
    extraInfo?: string;
}

const pundits: Pundit[] = [
    {
        id: 1,
        name: "Paladya Astra and Numero Expert",
        location: "Subhash Chauraha Civil Lines, Allahabad",
        timing: "Open until 9:00 pm",
        experience: "18 Years of Experience",
        languages: "Hindi, English",
        price: "₹ 300 onwards / session",
        image: pandit1,
        expertise: ["Vastu Consultation", "Kundali Matching", "Numerology"],
        services: [
            { name: "Kundali Matching", desc: "Finding the right partner is crucial, and astrologers...", price: "₹ 300 onwards / session" },
            { name: "Astrology for Career Growth", desc: "Astrologers for Career provide guidance based on...", price: "₹ 200 onwards / session" },
            { name: "Astrology for Education", desc: "Astrologers specializing in education offer...", price: "₹ 200 onwards / session" },
        ]
    },
    {
        id: 2,
        name: "Pankaj Dubey",
        location: "Dariyabad, Allahabad",
        timing: "Open until 9:00 pm",
        experience: "25 Years of Experience",
        languages: "Hindi, Sanskrit",
        price: "₹ 200 onwards / session",
        image: pandit2,
        expertise: ["Kundali Matching", "Vastu Consultation", "Career Guidance"],
        services: [
            { name: "Kundali Matching", desc: "Kundali matching is a vital process in Indian...", price: "₹ 300 onwards / session" },
            { name: "Astrology for Career Growth", desc: "Astrologers for Career service provides insightful...", price: "₹ 200 onwards / session" },
            { name: "Astrology for Education", desc: "Astrologers for education specialize in offering...", price: "₹ 200 onwards / session" },
        ]
    },
    {
        id: 3,
        name: "Astro Rahul Srivastava",
        location: "Allahpur, Allahabad",
        timing: "Open until 8:00 pm",
        experience: "17 Years of Experience",
        languages: "Hindi",
        price: "₹ 200 onwards / session",
        image: pandit3,
        expertise: ["Kundali Matching", "Vastu Consultation"],
        services: [
            { name: "Kundali Matching", desc: "Comprehensive matching for a happy married life." },
            { name: "Vastu Consultation", desc: "Harmonizing your home and workplace." }
        ]
    },
    {
        id: 4,
        name: 'ACHARYA RAJESH JI "MAHARAJ"',
        location: "Banda (U.P.)",
        timing: "Available on Call",
        experience: "15+ Years of Experience",
        languages: "Hindi, Sanskrit",
        price: "Consultation Fee on Call",
        image: pandit4,
        expertise: ["Vaidik Research", "Astro Consultancy Services"],
        extraInfo: "Lokmangal-Vaidik-Research-Astro-Consultancy-Services",
        services: [
            { name: "Vaidik Research Insights", desc: "Deep astrological research for life’s challenges." },
            { name: "Comprehensive Charting", desc: "Understand your celestial map deeply." }
        ]
    },
    {
        id: 5,
        name: "Astrologer Sri Ashimanandaji Jyotish Mahamohopadhay",
        location: "Benachity, Durgapur",
        timing: "Open until 10:00 pm",
        experience: "31 Years of Experience",
        languages: "Bengali, Hindi",
        price: "₹ 500 Consultation Fee",
        image: pandit5,
        expertise: ["Vastu Shastra", "Life Suggestions"],
        extraInfo: "11 'Friendly' Suggestions included",
        services: [
            { name: "Vastu Consultation", desc: "Specialist in Vastu Shastra for homes and commercial spaces." },
            { name: "Personal Astrological Counseling", desc: "11 friendly customized suggestions for better living." }
        ]
    },
    {
        id: 6,
        name: "Acharya Pandit Sanjay Ji",
        location: "Jhotwara, Jaipur",
        timing: "Open until 9:00 pm",
        experience: "30 Years of Experience",
        languages: "Hindi, Rajasthani",
        price: "Consultation Fee on Call",
        image: pandit6,
        expertise: ["Kundli Matching", "Palm Reading"],
        services: [
            { name: "Kundli Matching", desc: "Ensuring celestial compatibility for couples." },
            { name: "Palm Reading", desc: "Insightful readings of your lifelines and future." }
        ]
    }
];

const VedicConsultants = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const formId = "astro-booking";
    const isBookingOpen = searchParams.get("form") === formId;
    const [selectedService, setSelectedService] = useState<string>("Vedic Consultation");

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pundits.map((pundit) => (
                            <div key={pundit.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 overflow-hidden flex flex-col h-full group">
                                {/* Consultant Image & Header */}
                                <div className="relative h-64 overflow-hidden bg-white">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                    <img
                                        src={pundit.image}
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
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-stone-400 mt-0.5 shrink-0" />
                                            <span className="text-stone-600 text-sm">{pundit.location}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Languages className="w-5 h-5 text-stone-400 shrink-0" />
                                            <span className="text-stone-600 text-sm">{pundit.languages}</span>
                                        </div>
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
                                            {pundit.services.map((svc, index) => (
                                                <div key={index} className="group/svc relative pl-4 border-l border-stone-200 hover:border-orange-400 transition-colors">
                                                    <div className="font-semibold text-stone-800 text-sm mb-1">{svc.name}</div>
                                                    {svc.desc && <p className="text-xs text-stone-500 leading-relaxed mb-1.5">{svc.desc}</p>}
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
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default VedicConsultants;
