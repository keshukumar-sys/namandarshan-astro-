import { Star } from "lucide-react";

const AstrologerCard = ({ astrologer, onCall, onChat }: any) => {
  const canChat = !astrologer.modes || astrologer.modes.includes("chat");
  const canCall = !astrologer.modes || astrologer.modes.includes("call");
  const image = astrologer.image || astrologer.avatar || "/assets/pandit-assistant.png";
  const price = astrologer.pricePerMinute || astrologer.price || 0;
  const status = astrologer.status || "online";
  const ratingCount = Number(astrologer.ratingCount || 0);
  const ratingValue = Number(astrologer.rating || 0);
  const ratingLabel = ratingCount > 0 ? ratingValue.toFixed(1) : "New";

  return (
    <div className="relative rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl">
      <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-white ${
        status === "busy" ? "bg-amber-500" : status === "offline" ? "bg-slate-500" : "bg-green-500"
      }`}>
        {status}
      </div>

      <div className="absolute left-4 top-4 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
        Verified
      </div>

      <div className="flex flex-col items-center pt-5">
        <img
          src={image}
          alt={astrologer.name}
          className="h-24 w-24 rounded-full border-4 border-orange-100 object-cover"
        />

        <h3 className="mt-4 text-center text-xl font-bold">{astrologer.name}</h3>

        <div className="mt-1 flex items-center gap-1">
          <Star className="h-4 w-4 fill-current text-amber-500" />
          <span className="font-medium">{ratingLabel}</span>
          {ratingCount > 0 && <span className="text-xs text-gray-500">({ratingCount})</span>}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-gray-700">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Experience</span>
          <span className="font-medium">{astrologer.experience || `${astrologer.experienceYears || 0} Years`}</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Expertise</span>
          <span className="text-right font-medium">{astrologer.expertise || "Spiritual Guidance"}</span>
        </div>

        <div>
          <p className="mb-2 text-gray-500">Languages</p>
          <div className="flex flex-wrap gap-2">
            {(astrologer.languages || []).map((lang: string) => (
              <span key={lang} className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-600">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-xs text-gray-500">Consultation Fee</p>
          <p className="text-2xl font-bold text-orange-500">
            Rs. {price}
            <span className="text-sm font-normal text-gray-500">/min</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-semibold capitalize text-green-600">{status === "offline" ? "Offline" : "Available"}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => onChat(astrologer)}
          disabled={!canChat || status === "offline"}
          className="rounded-xl bg-green-600 py-3 font-medium text-white transition hover:bg-green-700 disabled:bg-gray-300"
        >
          Chat Now
        </button>

        {/* 
        <button
          type="button"
          onClick={() => onCall(astrologer)}
          disabled={!canCall || status === "offline"}
          className="rounded-xl bg-orange-500 py-3 font-medium text-white transition hover:bg-orange-600 disabled:bg-gray-300"
        >
          Call Now
        </button>
        */}
      </div>
    </div>
  );
};

export default AstrologerCard;
