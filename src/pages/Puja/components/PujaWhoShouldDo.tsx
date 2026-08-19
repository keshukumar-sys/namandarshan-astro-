import { Users, Check } from "lucide-react";

export default function PujaWhoShouldDo({ puja }: { puja: any }) {
    const whoShouldDo = puja?.whoShouldDo;

    // Handle Array format (e.g. from older schemas or current database structures in production)
    if (Array.isArray(whoShouldDo) && whoShouldDo.length > 0) {
        return (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-stone-700" />
                    <h3 className="font-display text-2xl font-bold text-stone-900">{puja.title} – Who Should Do This Puja?</h3>
                </div>
                
                <ul className="space-y-4">
                    {whoShouldDo.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-stone-700 text-lg leading-relaxed">
                            <span className="flex-shrink-0 mt-1 bg-stone-100 p-1 rounded-full text-stone-700">
                                <Check className="w-4 h-4 animate-pulse" />
                            </span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Default to HTML string rendering (Vedic consultants, rich text, ReactQuill input)
    const htmlContent = typeof whoShouldDo === 'string' && whoShouldDo.trim()
        ? whoShouldDo
        : `<ul>
            <li>Individuals facing continuous obstacles in career or business.</li>
            <li>Families seeking harmony, peace, and protection from negative energies.</li>
            <li>Anyone wishing to express gratitude and seek divine blessings for health.</li>
           </ul>`;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-stone-700" />
                <h3 className="font-display text-2xl font-bold text-stone-900">{puja.title} – Who Should Do This Puja?</h3>
            </div>
            
            <div 
                className="text-stone-700 text-lg leading-relaxed prose prose-stone max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}
