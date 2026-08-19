import React from 'react';
import { Video, MapPin, Home } from 'lucide-react';

interface SacredRitualProcessProps {
    puja: any;
}

const SacredRitualProcess: React.FC<SacredRitualProcessProps> = ({ puja }) => {
    if (!puja?.process) return null;

    const processData = puja.process;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-6">
                {puja.title} – How the Process Works
            </h2>
            
            {/* Delivery Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
                {puja.isOnline && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm animate-pulse">
                        <Video className="w-4 h-4" /> Live Online Puja
                    </div>
                )}
                {puja.isTemple && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm animate-pulse">
                        <MapPin className="w-4 h-4" /> Temple Visit Puja
                    </div>
                )}
                {puja.isHome && (
                    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm animate-pulse">
                        <Home className="w-4 h-4" /> At-Home Puja Service
                    </div>
                )}
            </div>

            {/* Handle Array format (e.g. from production DB) */}
            {Array.isArray(processData) && processData.length > 0 ? (
                <div className="relative border-l-2 border-stone-200 pl-6 ml-3 space-y-8 my-4">
                    {processData.map((step: any, index: number) => (
                        <div key={index} className="relative">
                            <span className="absolute -left-[35px] top-1 bg-stone-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-white">
                                {index + 1}
                            </span>
                            <h4 className="font-display text-lg font-bold text-stone-950">{step.title}</h4>
                            <p className="text-stone-600 text-base mt-1.5 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                /* Handle HTML string format (ReactQuill, rich text, Vedic consultants) */
                <div 
                    className="text-stone-700 text-lg leading-relaxed prose prose-stone max-w-none"
                    dangerouslySetInnerHTML={{ __html: typeof processData === 'string' ? processData : '' }}
                />
            )}
        </div>
    );
};

export default SacredRitualProcess;
