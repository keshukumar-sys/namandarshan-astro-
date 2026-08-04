import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RechargeModal from "@/components/astrologer/RechargeModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { canStartConsultation } from "@/utils/consultationAccess";
import {
  fetchPanditProfiles,
  PanditProfile,
  startWalletConsultationSession,
} from "@/utils/consultationSession";

const loginRedirect = `/login?mode=login&redirect=${encodeURIComponent("/devotee-dashboard")}`;
const DEFAULT_AVATAR = "/assets/pandit-assistant.png";

const formatMoney = (amount: number) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;

const DevoteeDashboard = () => {
  const navigate = useNavigate();
  const { isUserAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { balance, isLoading: isWalletLoading, isLowBalance, refreshBalance } = useWallet();
  const [pandits, setPandits] = useState<PanditProfile[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingPandits, setIsLoadingPandits] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecharge, setShowRecharge] = useState(false);
  const [isStartingId, setIsStartingId] = useState<string | null>(null);

  const hasWalletBalance = canStartConsultation(balance, user);
  const firstName = user?.name?.split(" ")[0] || "Devotee";

  const loadPandits = useCallback(async () => {
    setIsLoadingPandits(true);
    setError(null);

    try {
      const profiles = await fetchPanditProfiles();
      setPandits(profiles);
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load pandits.");
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
    if (!query) return pandits;

    return pandits.filter((pandit) => {
      const haystack = [
        pandit.name,
        pandit.expertise,
        pandit.bio,
        ...(pandit.languages || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [pandits, search]);

  const ensureCanStart = () => {
    if (!isUserAuthenticated) {
      navigate(loginRedirect);
      return false;
    }

    if (isWalletLoading) {
      toast.message("Checking wallet balance...");
      return false;
    }

    return true;
  };

  const startSession = async (pandit: PanditProfile, mode: "chat" | "call") => {
    if (!ensureCanStart()) return;

    setIsStartingId(`${pandit.id}-${mode}`);

    try {
      const started = await startWalletConsultationSession({
        pandit,
        mode,
        durationSeconds: 300,
      });

      const astrologer = {
        ...pandit,
        avatar: pandit.avatar || pandit.image || DEFAULT_AVATAR,
        image: pandit.image || pandit.avatar || DEFAULT_AVATAR,
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

      navigate("/astro-call", {
        state: {
          astrologer,
          bookingId: started.bookingId,
          roomId: started.bookingId,
          durationSeconds: started.durationSeconds,
          joinExisting: true,
        },
      });
    } catch (startError: any) {
      if (startError?.message?.includes("Add money")) {
        setShowRecharge(true);
      } else {
        toast.error(startError?.message || "Unable to start consultation.");
      }
    } finally {
      setIsStartingId(null);
    }
  };

  const walletState = !isUserAuthenticated
    ? "Sign in required"
    : hasWalletBalance
      ? isLowBalance
        ? "Low balance"
        : "Ready"
      : "Recharge needed";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="pt-40 lg:pt-52">
        <section className="border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-600">
                  Devotee Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-normal md:text-4xl">
                  Namaste, {isAuthLoading ? "..." : firstName}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Connect with verified pandits for private chat or live call consultations.
                </p>
                
                {/* New User Offer Banner */}
                <div className="mt-5 inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl shadow-sm">
                  <div className="bg-emerald-100 p-2 rounded-full">
                      <span className="text-xl block animate-bounce">🎁</span>
                  </div>
                  <div className="text-left">
                      <h3 className="font-bold text-base leading-tight">First Chat is Free!</h3>
                      <p className="text-xs font-medium text-emerald-700">New users get their first 5 minutes completely free.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild type="button" variant="outline" size="lg" className="rounded-lg border-slate-300 bg-white">
                  <Link to="/my-trips">
                    <CalendarDays className="h-4 w-4" />
                    My Trips
                  </Link>
                </Button>
                <Button type="button" size="lg" onClick={() => setShowRecharge(true)} className="rounded-lg">
                  <Wallet className="h-4 w-4" />
                  Recharge Wallet
                </Button>
                <Button asChild type="button" variant="outline" size="lg" className="rounded-lg border-slate-300 bg-white">
                  <Link to="/wallet">Wallet</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-5 px-4 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Wallet Balance</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {isUserAuthenticated ? formatMoney(balance) : "Rs. 0"}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-600">Status</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  hasWalletBalance ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                }`}>
                  {walletState}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <label htmlFor="pandit-search" className="text-sm font-semibold text-slate-700">
                Search Pandits
              </label>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  id="pandit-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, language, expertise"
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={loadPandits}
                className="mt-3 w-full rounded-lg border-slate-300 bg-white"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingPandits ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </aside>

          <section className="min-w-0">
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Available Pandits</h2>
                <p className="text-sm text-slate-500">{filteredPandits.length} profiles online</p>
              </div>
              <div className="hidden items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm sm:flex">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Verified profiles
              </div>
            </div>

            {isLoadingPandits ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
                ))}
              </div>
            ) : filteredPandits.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredPandits.map((pandit) => {
                  const image = pandit.image || pandit.avatar || DEFAULT_AVATAR;
                  const price = pandit.pricePerMinute || pandit.price || 0;
                  const canChat = (pandit.modes || []).includes("chat");
                  const canCall = (pandit.modes || []).includes("call");
                  const ratingCount = Number(pandit.ratingCount || 0);
                  const ratingValue = Number(pandit.rating || 0);
                  const ratingLabel = ratingCount > 0 ? ratingValue.toFixed(1) : "New";

                  return (
                    <article key={pandit.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div className="relative h-36 bg-slate-100">
                        <img src={image} alt={pandit.name} className="h-full w-full object-cover" />
                        <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          {pandit.status || "online"}
                        </span>
                        {/* Free Chat Badge */}
                        <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 border border-green-400/50 backdrop-blur-sm">
                            <span>⭐</span> 5 Mins Free
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold">{pandit.name}</h3>
                            <p className="truncate text-sm text-slate-500">{pandit.expertise}</p>
                          </div>
                          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-700">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{ratingLabel}</span>
                            {ratingCount > 0 && <span className="text-xs text-amber-600">({ratingCount})</span>}
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600">
                          {pandit.bio || "Available for spiritual and astrological guidance."}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-slate-500">Experience</p>
                            <p className="mt-1 font-semibold">{pandit.experience || `${pandit.experienceYears || 0} Years`}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-slate-500">Fee</p>
                            <p className="mt-1 font-semibold">{formatMoney(price)}/min</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(pandit.languages || []).slice(0, 4).map((language) => (
                            <span key={language} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                              {language}
                            </span>
                          ))}
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3">
                          <Button
                            type="button"
                            disabled={!canChat || isStartingId === `${pandit.id}-chat`}
                            onClick={() => startSession(pandit, "chat")}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Chat
                          </Button>
                          {/* 
                          <Button
                            type="button"
                            disabled={!canCall || isStartingId === `${pandit.id}-call`}
                            onClick={() => startSession(pandit, "call")}
                            className="rounded-lg"
                          >
                            <PhoneCall className="h-4 w-4" />
                            Call
                          </Button>
                          */}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold">No pandits are available yet.</p>
                <p className="mt-2 text-sm text-slate-500">Profiles created from the pandit dashboard will appear here.</p>
              </div>
            )}
          </section>
        </section>
      </main>

      {showRecharge && (
        <RechargeModal
          onClose={() => setShowRecharge(false)}
          onSuccess={() => {
            refreshBalance();
          }}
          reasonMessage="Add money to start a chat or call with a pandit."
        />
      )}

      <Footer />
    </div>
  );
};

export default DevoteeDashboard;
