import { Sparkles, Package } from "lucide-react";

export default function PujaBenefits({ puja }: { puja: any }) {
    return (
        <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 md:p-8 rounded-2xl border border-orange-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-orange-100 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-display text-2xl font-bold text-stone-900 mb-3">{puja.title} – Benefits of This Puja</h3>
                        <div 
                            className="text-stone-700 leading-relaxed text-lg prose prose-stone prose-orange max-w-none"
                            dangerouslySetInnerHTML={{ 
                                __html: puja.benefits || "Experience divine blessings, spiritual growth, and peace of mind by performing this sacred ritual with complete devotion." 
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Samagri */}
            <div id="samagri" className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm scroll-mt-44">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-stone-600" />
                    </div>
                    <div>
                        <h3 className="font-display text-2xl font-bold text-stone-900 mb-3">Puja Samagri Included</h3>
                        <p className="text-stone-600 leading-relaxed text-lg">
                            {puja.samagri || "All required sacred items (Samagri) for the puja including pure ghee, sacred threads, specific flowers, and prasad are arranged by our verified Pandits."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
