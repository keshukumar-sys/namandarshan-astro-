import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AstrologerCard from "@/components/astrologer/AstrologerCard";
import LoginModal from "@/components/Astro-auth/LoginModal";
import SignupModal from "@/components/Astro-auth/SignupModal";
import AstroCallHeader from "@/components/layout/AstroCallHeader";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { canStartConsultation } from "@/utils/consultationAccess";
import {
  fetchPanditProfiles,
  PanditProfile,
  startWalletConsultationSession,
} from "@/utils/consultationSession";
import WebRTCCall from "./WebRTCCall";

const DEFAULT_DURATION_SECONDS = 300;

export default function AstroCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUserAuthenticated, user } = useAuth();
  const { balance, isLoading: isWalletLoading } = useWallet();
  const hasWalletBalance = canStartConsultation(balance, user);
  const [pandits, setPandits] = useState<PanditProfile[]>([]);
  const [selectedCall, setSelectedCall] = useState<{
    bookingId: string;
    roomId: string;
    durationSeconds: number;
  } | null>(
    location.state?.bookingId
      ? {
          bookingId: location.state.bookingId,
          roomId: location.state.roomId || location.state.bookingId,
          durationSeconds: Number(location.state.durationSeconds || DEFAULT_DURATION_SECONDS),
        }
      : null
  );
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [pendingAction, setPendingAction] = useState<"chat" | "call" | null>(null);
  const [pendingPandit, setPendingPandit] = useState<PanditProfile | null>(null);
  const [isLoadingPandits, setIsLoadingPandits] = useState(true);
  const [isStartingId, setIsStartingId] = useState<string | null>(null);

  const loadPandits = useCallback(async () => {
    setIsLoadingPandits(true);
    try {
      setPandits(await fetchPanditProfiles());
    } catch (error: any) {
      toast.error(error?.message || "Unable to load pandits.");
      setPandits([]);
    } finally {
      setIsLoadingPandits(false);
    }
  }, []);

  useEffect(() => {
    loadPandits();
  }, [loadPandits]);

  const filteredPandits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pandits.filter((pandit) => {
      const matchesSearch =
        !query ||
        [pandit.name, pandit.expertise, ...(pandit.languages || [])]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        activeFilter === "All" ||
        (pandit.expertise || "").toLowerCase().includes(activeFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, pandits, search]);

  const requireAccess = (pandit: PanditProfile, action: "chat" | "call") => {
    if (!isUserAuthenticated) {
      setPendingAction(action);
      setPendingPandit(pandit);
      setShowLogin(true);
      return false;
    }

    if (isWalletLoading) return false;

    if (!hasWalletBalance) {
      navigate("/wallet");
      return false;
    }

    return true;
  };

  const startSession = async (pandit: PanditProfile, mode: "chat" | "call") => {
    if (!requireAccess(pandit, mode)) return;

    setIsStartingId(`${pandit.id}-${mode}`);

    try {
      const started = await startWalletConsultationSession({
        pandit,
        mode,
        durationSeconds: DEFAULT_DURATION_SECONDS,
      });
      const astrologer = {
        ...pandit,
        avatar: pandit.avatar || pandit.image || "/assets/pandit-assistant.png",
        image: pandit.image || pandit.avatar || "/assets/pandit-assistant.png",
        price: pandit.pricePerMinute || pandit.price || 0,
      };

      if (mode === "chat") {
        navigate("/astro-chat", {
          state: {
            astrologer,
            bookingId: started.bookingId,
            roomId: started.bookingId,
            durationSeconds: started.durationSeconds,
          },
        });
        return;
      }

      setSelectedCall({
        bookingId: started.bookingId,
        roomId: started.bookingId,
        durationSeconds: started.durationSeconds,
      });
    } catch (error: any) {
      toast.error(error?.message || "Unable to start consultation.");
    } finally {
      setIsStartingId(null);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);

    if (pendingPandit && pendingAction) {
      void startSession(pendingPandit, pendingAction);
    } else {
      navigate("/devotee-dashboard");
    }

    setPendingAction(null);
    setPendingPandit(null);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);

    if (pendingPandit && pendingAction) {
      void startSession(pendingPandit, pendingAction);
    } else {
      navigate("/devotee-dashboard");
    }

    setPendingAction(null);
    setPendingPandit(null);
  };

  if (selectedCall) {
    return (
      <WebRTCCall
        bookingId={selectedCall.bookingId}
        roomId={selectedCall.roomId}
        sessionSeconds={selectedCall.durationSeconds}
      />
    );
  }

  const filterOptions = ["All", "Vedic", "Numerology", "Tarot", "Puja"];

  return (
    <div className="min-h-screen bg-gray-50">
      <AstroCallHeader
        onChatClick={() => {
          if (filteredPandits[0]) void startSession(filteredPandits[0], "chat");
        }}
        onCallClick={() => {
          if (filteredPandits[0]) void startSession(filteredPandits[0], "call");
        }}
        onLoginClick={() => setShowLogin(true)}
      />

      <div className="container mx-auto px-4 pb-20 pt-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Talk To Pandits</h1>
            <p className="mt-2 text-slate-600">Profiles are managed from the pandit dashboard.</p>
          </div>
          {isUserAuthenticated && (
            <div
              className="min-w-[190px] cursor-pointer rounded-xl border bg-white px-4 py-3 shadow-md transition hover:shadow-lg"
              onClick={() => navigate("/wallet")}
            >
              <p className="text-xs text-gray-500">Wallet Balance</p>
              <span className="text-lg font-bold text-green-600">Rs. {balance}</span>
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Search pandits..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex-1 rounded-lg border bg-white p-3"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded px-4 py-2 ${
                activeFilter === filter ? "bg-orange-500 text-white" : "border bg-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoadingPandits ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-2xl border bg-white" />
            ))}
          </div>
        ) : filteredPandits.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPandits.map((pandit) => (
              <AstrologerCard
                key={pandit.id}
                astrologer={{
                  ...pandit,
                  image: pandit.image || pandit.avatar || "/assets/pandit-assistant.png",
                  price: pandit.pricePerMinute || pandit.price || 0,
                  experience: pandit.experience || `${pandit.experienceYears || 0} Years`,
                  rating: pandit.rating,
                  ratingCount: pandit.ratingCount,
                }}
                onCall={() => startSession(pandit, "call")}
                onChat={() => startSession(pandit, "chat")}
                isStartingCall={isStartingId === `${pandit.id}-call`}
                isStartingChat={isStartingId === `${pandit.id}-chat`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold">No pandit profiles found.</p>
            <p className="mt-2 text-sm text-slate-500">Ask pandits to save their profile from the pandit dashboard.</p>
          </div>
        )}
      </div>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onBackToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onSignupSuccess={handleSignupSuccess}
      />

      <Footer />
    </div>
  );
}
