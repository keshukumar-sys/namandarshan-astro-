import { ScrollText } from "lucide-react";

export default function PujaGlory({ puja }: { puja: any }) {
    if (!puja.importance) return null;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-stone-100 pb-4">
                <ScrollText className="w-6 h-6 text-stone-700" />
                <h3 className="font-display text-2xl font-bold text-stone-900">
                {puja.title} – Spiritual Significance
                </h3>
            </div>
            
            <div 
                className="text-stone-600 leading-relaxed text-lg prose prose-stone max-w-none"
                dangerouslySetInnerHTML={{ __html: puja.importance }}
            />
        </div>
    );
}
