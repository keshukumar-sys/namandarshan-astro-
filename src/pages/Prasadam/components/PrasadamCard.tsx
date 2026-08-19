import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { PrasadamData } from "../data";
import { useNavigate, Link } from "react-router-dom";

interface PrasadamCardProps extends PrasadamData {
    temples?: any[];
}

const PrasadamCard = ({ id, slug, title, image, description, templeName, location, templeSlug, temples }: PrasadamCardProps) => {
    const navigate = useNavigate();

    const cleanTempleName = (name: string) => {
        if (!name) return "";

        // Comprehensive manual overrides from the provided spreadsheet
        const overrides: Record<string, string> = {
            "Shri Nathji": "Chhapan Bhog Shri Nathji",
            "Divine Mahaprasadam": "Divine Mahaprasadam Shri Krishna",
            "Ganga Maiya": "Ganga Maiya Haridwar",
            "Jagannath Puri": "Jagannath Puri",
            "Kashi Vishwanath": "Kashi Vishwanath",
            "Iskcon Vrindavan": "Iskcon Vrindavan",
            "Maa Kalka Ji": "Maa Kalka Ji",
            "Mahakaleshwar": "Mahakaleshwar",
            "Mata Jhandewali": "Mata Jhandewali",
            "Mata Vaishno Devi": "Mata Vaishno Devi",
            "Nageshwar": "Nageshwar Jyotirlinga",
            "Prem Mandir": "Prem Mandir Vrindavan",
            "Shri Krishna Janmabhoomi": "Shri Krishna Janmabhoomi",
            "Brihadeeswarar": "Brihadeeswarar Temple",
            "Brihadeswara": "Brihadeeswarar Temple",
            "Ram Lalla": "Ram Lalla Ayodhya",
            "Kanaji Laddu": "Kanaji Laddu Shaktipeeth",
            "Golden Cave": "Golden Cave Temple",
            "Sacred Laddu": "Sacred Laddu & Pedha",
            "Somnath": "Somnath",
            "Sri Podalamma": "Sri Podalamma Temple",
            "Sri Padmavathi": "Tiruchanur Sri Padmavathi",
            "Bhairava": "Swarna Akarshana Bhairava",
            "Tirumala Tirupati": "Tirumala Tirupati Balaji",
            "Neelkanth": "Shree Neelkanth Mahadev Temple",
            "Dharmasthala": "Shri Kshetra Dharmasthala Manjunatha Swamy Temple",
            "Ram Janmabhoomi": "Shri Ram Janmabhoomi",
            "Suchindram": "Suchindram Temple",
            "Meenakshi": "Meenakshi Temple",
            "Rameshwaram": "Rameshwaram Temple",
            "Kedarnath": "Kedarnath Temple",
            "Badrinath": "Badrinath Temple",
            "Srisailam": "Srisailam Temple",
            "Kukke": "Kukke Subramanya",
            "Mangalagiri": "Mangalagiri Lakshmi Narasimha",
            "Shirdi": "Shirdi Sai Baba",
            "Trimbakeshwar": "Trimbakeshwar",
            "Yadadri": "Yadadri Lakshmi Narasimha",
            "Malyadri": "Sri Malyadri Lakshmi Narasimha Swamy Temple",
            "Ekambaranathar": "Arulmigu Ekambaranathar Temple",
            "Tirupati Balaji": "Tirupati Balaji"
        };

        // Check if the current name matches an override keyword
        for (const [key, value] of Object.entries(overrides)) {
            if (name.includes(key)) return value;
        }

        // Default logic: Take everything before the first bracket and trim
        let base = name.split("(")[0].trim();
        return base.replace(/[.]$/, "");
    };

    const cleanPrasadamName = (name: string, templeName: string) => {
        if (!name) return "";

        // Comprehensive manual overrides for Prasadam Names from spreadsheet
        const mapping: Record<string, string> = {
            "nathji": "Chhappan Bhog",
            "divine mahaprasadam": "Mathura Peda",
            "ganga maiya": "Mishri Prasad",
            "jagannath": "Jagannath Khaja",
            "kashi vishwanath": "Rabri Peda",
            "vrindavan": "Makhan Mishri",
            "kalka": "Boondi Ladoo",
            "mahakaleshwar": "Dry Fruit Laddu",
            "jhandewali": "Besan Ladoo",
            "vaishno devi": "Mishri Prasad",
            "nageshwar": "Churma Ladoo",
            "krishna janmabhoomi": "Makhan Mishri",
            "ram janmabhoomi": "Besan Ladoo",
            "prem mandir": "Mathura Peda",
            "brihadeeswarar": "Puliyodarai (Tamarind Rice)",
            "brihadeswara": "Puliyodarai (Tamarind Rice)",
            "ram lalla": "Besan Ladoo",
            "kanaji": "Kanaji Laddu",
            "golden cave": "Coconut Laddu",
            "sacred laddu": "Temple Laddu",
            "neelkanth": "Bhang Prasad",
            "dharmasthala": "Anna Prasada (Free Meal / Bhojan)",
            "ekambaranathar": "Puliyodarai (Tamarind Rice)",
            "malyadri": "Sacred Laddu and Pulihora (Tamarind Rice)",
            "somnath": "Magas Laddu",
            "podalamma": "Pulihora",
            "padmavathi": "Laddu",
            "bhairava": "Laddu",
            "tirumala": "Tirupati Laddu",
            "suchindram": "Panchamrit",
            "meenakshi": "Laddu",
            "rameshwaram": "Panchamrit",
            "kedarnath": "Dry Fruits Prasad",
            "badrinath": "Mishri",
            "srisailam": "Laddu",
            "kukke": "Laddu",
            "mangalagiri": "Panakam",
            "shirdi": "Peda",
            "trimbakeshwar": "Panchamrit",
            "yadadri": "Laddu",
            "tirupati balaji": "Tirupati Laddu"
        };

        // Check if temple name matches a key in the mapping
        const templeKey = Object.keys(mapping).find(key => templeName.toLowerCase().includes(key));
        if (templeKey) return mapping[templeKey];

        // If it's a long sentence, extract the core subject after "is/are"
        const sentenceSplitters = /\b(is|are)\s+(?:the|primarily\s+known\s+as|primarily\s+offered\s+as|typically\s+featuring|featuring|typically\s+offering)\s*(?:the)?\s*/i;
        if (name.length > 45 && sentenceSplitters.test(name)) {
            const parts = name.split(sentenceSplitters);
            let clean = parts[parts.length - 1].trim();
            clean = clean.split(/[.!(]/)[0].trim();
            return clean;
        }
        return name.trim();
    };

    const displayPrasadamName = cleanPrasadamName(title, templeName);
    const displayTempleName = cleanTempleName(templeName);
    let fullHeading = `${displayTempleName} Prasadam Online – ${displayPrasadamName}`;
    if (displayPrasadamName.toLowerCase().includes("prasadam online") || displayPrasadamName.toLowerCase() === displayTempleName.toLowerCase()) {
        fullHeading = displayPrasadamName.toLowerCase() === displayTempleName.toLowerCase() 
            ? `${displayTempleName} Prasadam Online` 
            : displayPrasadamName;
    }

    // Helper to extract a matching temple slug from the display name
    const getTempleSlug = (name: string) => {
        if (templeSlug) return templeSlug;
        if (!name) return "";

        const nameLower = name.toLowerCase();

        // 1. Manual overrides for known discrepancies (Priority)
        if (name.includes("Vaishno Devi")) return "vaishno-devi";
        if (name.includes("Radha Raman") || name.includes("Shahji")) return "radha-raman-temple";
        if (name.includes("Krishna Janmabhoomi")) return "shree-krishna-janmabhoomi-temple";
        if (name.includes("Penusila")) return "penchalakona-lakshmi-narasimha-swamy-temple";
        if (name.includes("Gangotri")) return "gangotri-temple";
        if (name.includes("Ekambaranathar") || name.includes("Ekambareswarar")) return "ekambareswarar-temple--temple";

        // 2. Attempt smart match against actual backend temples!
        if (temples && temples.length > 0) {
            // First, try exact string match
            const exact = temples.find(t => t.name?.toLowerCase() === nameLower);
            if (exact) return exact.slug;

            // Second, fuzzy match "first name / key term" 
            // example: "Shri Radha Raman (Shahji) Temple" -> extracts "radha" or "raman"
            // remove generic titles/brackets to find the core identifier:
            let coreKeywordStr = nameLower.replace(/shree|shri|sri|temple|mandir|shrine|dham|jyotirlinga|\(|\)/g, '').trim();
            const keywords = coreKeywordStr.split(/\s+/).filter(w => w.length > 3);

            if (keywords.length > 0) {
                // Try matching the primary unique keyword (the first one)
                let mainKeyword = keywords[0];
                let bestMatch = temples.find(t => t.name?.toLowerCase().includes(mainKeyword));

                // If it fails, try the second keyword (e.g. if the first was generic)
                if (!bestMatch && keywords.length > 1) {
                    bestMatch = temples.find(t => t.name?.toLowerCase().includes(keywords[1]));
                }

                if (bestMatch && bestMatch.slug) {
                    return bestMatch.slug;
                }
            }
        }

        // 3. Fallback: Remove parentheticals and "Shrine"/"Temple" suffixes
        let clean = name.split('(')[0].replace(/temple/i, '').replace(/shrine/i, '').trim();
        return clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 flex flex-col h-full group">
            {/* Image Container */}
            <div className="relative h-64 overflow-hidden bg-stone-100">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Temple/Location Badge */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <Badge className="bg-white/90 text-stone-900 hover:bg-white backdrop-blur-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        {location}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="mb-4">
                    <h3 className="font-display text-2xl font-bold text-stone-900 mb-2 leading-tight">
                        {fullHeading}
                    </h3>
                    <Link
                        to={`/temples/${getTempleSlug(templeName)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-orange-600 mb-3 hover:text-orange-800 hover:underline inline-block transition-colors"
                    >
                        {displayTempleName}
                    </Link>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-3">
                        {description}
                    </p>
                </div>

                <div className="mt-auto pt-4">
                    <Button
                        onClick={() => navigate(`/prasadam/${slug || id}`)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                        Order Prasadam
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PrasadamCard;
