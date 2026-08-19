import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  LogOut,
  Save,
  UserRound,
  Users,
  Camera,
  Crop,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Upload,
  X,
  Loader2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getApiUrl, readJsonResponse } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import RechargeModal from "@/components/astrologer/RechargeModal";
import { markPanditJoinedConsultationSession } from "@/utils/consultationSession";

type RangeOption = "7d" | "30d" | "90d" | "all";

interface DashboardTotals {
  totalBookings: number;
  callBookings: number;
  chatBookings: number;
  completedBookings: number;
  activeBookings: number;
  totalMinutes: number;
  earnings: number;
  completedEarnings: number;
  averageBookingValue: number;
}

interface ModeSummary {
  bookings: number;
  minutes: number;
  earnings: number;
}

interface DailySummary {
  date: string;
  callBookings: number;
  chatBookings: number;
  bookings: number;
  minutes: number;
  earnings: number;
}

interface RecentBooking {
  bookingId: string;
  astrologerId: string;
  astrologerName: string;
  customerName: string;
  customerEmail?: string;
  concern?: string;
  mode: "chat" | "call";
  durationMinutes: number;
  earnings: number;
  paymentStatus: string;
  status: string;
  bookedAt: string | null;
}

interface PanditBookingNotification {
  bookingId: string;
  roomId?: string;
  astrologerId: string;
  astrologerName: string;
  customerName: string;
  customerEmail?: string;
  concern?: string;
  mode: "chat" | "call";
  durationMinutes: number;
  status?: string;
  bookedAt?: string | null;
  receivedAt: string;
  unread: boolean;
}

interface PanditProfile {
  id: string;
  userId?: string | null;
  name: string;
  displayName?: string;
  email?: string;
  expertise?: string;
  bio?: string;
  languages?: string[];
  modes?: Array<"chat" | "call">;
  pricePerMinute?: number;
  experienceYears?: number;
  status?: "online" | "busy" | "offline";
  availabilityStatus?: "online" | "busy" | "offline";
  avatar?: string;
  image?: string;
  rating?: number;
  ratingCount?: number;
  isActive?: boolean;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  profile: PanditProfile;
}

interface PanditDashboardResponse {
  success: boolean;
  message?: string;
  generatedAt: string;
  scope: {
    panditId: string | null;
    panditName: string | null;
    authMode: string;
    range: RangeOption;
  };
  totals: DashboardTotals;
  byMode: {
    call: ModeSummary;
    chat: ModeSummary;
  };
  daily: DailySummary[];
  recentBookings: RecentBooking[];
}

const ranges: Array<{ label: string; value: RangeOption }> = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "All", value: "all" },
];

const emptyTotals: DashboardTotals = {
  totalBookings: 0,
  callBookings: 0,
  chatBookings: 0,
  completedBookings: 0,
  activeBookings: 0,
  totalMinutes: 0,
  earnings: 0,
  completedEarnings: 0,
  averageBookingValue: 0,
};

const emptyMode: ModeSummary = {
  bookings: 0,
  minutes: 0,
  earnings: 0,
};

const emptyProfileForm = {
  displayName: "",
  expertise: "",
  bio: "",
  languages: "",
  modes: ["chat", "call"] as Array<"chat" | "call">,
  pricePerMinute: "13",
  experienceYears: "0",
  status: "online" as "online" | "busy" | "offline",
  availabilityStatus: "online" as "online" | "busy" | "offline",
  avatar: "",
  isActive: true,
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function isRange(value: string | null): value is RangeOption {
  return value === "7d" || value === "30d" || value === "90d" || value === "all";
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDayLabel(value: string) {
  if (value === "unscheduled") return "NA";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "active") return "bg-blue-50 text-blue-700 border-blue-200";
  if (normalized === "failed" || normalized === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function modeClass(mode: string) {
  return mode === "call"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function isOpenRequestStatus(status: string) {
  return ["active", "confirmed"].includes(String(status || "").toLowerCase());
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const MetricCard = ({
  title,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  accent: string;
}) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
      </div>
      <div className={`rounded-lg p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </section>
);

const PanditDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rangeParam = searchParams.get("range");
  const range: RangeOption = isRange(rangeParam) ? rangeParam : "30d";
  const [data, setData] = useState<PanditDashboardResponse | null>(null);
  const [profile, setProfile] = useState<PanditProfile | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);

  // Profile Image Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropZoom(1);
      setCropRotation(0);
      setCropOffsetX(0);
      setCropOffsetY(0);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyCropAndUpload = async () => {
    if (!rawImageSrc) return;
    setIsUploadingAvatar(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = rawImageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not initialize canvas context");

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);

      const aspect = img.width / img.height;
      let drawW = size;
      let drawH = size;
      if (aspect > 1) {
        drawH = size;
        drawW = size * aspect;
      } else {
        drawW = size;
        drawH = size / aspect;
      }

      ctx.drawImage(
        img,
        -drawW / 2 + cropOffsetX,
        -drawH / 2 + cropOffsetY,
        drawW,
        drawH
      );
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob) throw new Error("Failed to process image data");

      const body = new FormData();
      body.append("file", blob, `avatar_${Date.now()}.jpg`);

      const res = await fetch(getApiUrl("/api/upload"), {
        method: "POST",
        body,
      });

      const data = await readJsonResponse<any>(res);
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      const uploadedUrl = data?.url || data?.fileUrl || data?.location;
      if (!uploadedUrl) throw new Error("Image URL missing from server response");

      setProfileForm((prev) => ({ ...prev, avatar: uploadedUrl }));
      toast.success("Profile picture updated successfully!");
      setCropModalOpen(false);
      setRawImageSrc(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to crop and upload image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PanditBookingNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [joiningBookingId, setJoiningBookingId] = useState<string | null>(null);
  const { balance } = useWallet();
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isUserAuthenticated, isLoading: authLoading, logoutUser } = useAuth();
  const { socket, isConnected } = useSocket();

  const updateParams = useCallback(
    (next: { range?: RangeOption }) => {
      const params = new URLSearchParams();
      if (next.range) params.set("range", next.range);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const loadDashboard = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ range });

      const token = localStorage.getItem("userToken");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(getApiUrl(`/api/pandit-dashboard/summary?${params.toString()}`), {
        headers,
      });
      const payload = await readJsonResponse<PanditDashboardResponse>(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to load dashboard.");
      }

      setData(payload);
    } catch (loadError: unknown) {
      if (!silent) {
        setError(getErrorMessage(loadError, "Unable to load dashboard."));
        setData(null);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [range]);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return;

    try {
      const response = await fetch(getApiUrl("/api/pandit-dashboard/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await readJsonResponse<ProfileResponse>(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to load profile.");
      }

      const nextProfile = payload.profile;
      setProfile(nextProfile);
      setProfileForm({
        displayName: nextProfile.displayName || nextProfile.name || "",
        expertise: nextProfile.expertise || "",
        bio: nextProfile.bio || "",
        languages: (nextProfile.languages || []).join(", "),
        modes: nextProfile.modes?.length ? nextProfile.modes : ["chat", "call"],
        pricePerMinute: String(nextProfile.pricePerMinute || 13),
        experienceYears: String(nextProfile.experienceYears || 0),
        status: nextProfile.status || "online",
        availabilityStatus: nextProfile.availabilityStatus || nextProfile.status || "online",
        avatar: nextProfile.avatar || nextProfile.image || "",
        isActive: nextProfile.isActive !== false,
      });
      setProfileError(null);
    } catch (loadError: unknown) {
      setProfileError(getErrorMessage(loadError, "Unable to load profile."));
    }
  }, []);

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    setIsLoadingFeedback(true);
    try {
      const res = await fetch(getApiUrl("/api/pandit-dashboard/feedback"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (payload.success) {
        setFeedbacks(payload.feedbacks || []);
        setFeedbackSummary(payload.summary || null);
      }
    } catch (e) {
      console.error("Failed to load feedbacks", e);
    } finally {
      setIsLoadingFeedback(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isUserAuthenticated) {
      navigate('/login?mode=login&role=pandit&redirect=%2Fpandit-dashboard', { replace: true });
      return;
    }

    if (!authLoading && user && !['pandit', 'astrologer'].includes(user.role || '')) {
      navigate('/login?mode=login&role=pandit&redirect=%2Fpandit-dashboard', { replace: true });
      return;
    }

    loadDashboard();
    loadProfile();
    loadFeedbacks();
  }, [authLoading, isUserAuthenticated, loadDashboard, loadFeedbacks, loadProfile, navigate, user]);

  const totals = data?.totals || emptyTotals;
  const byMode = data?.byMode || { call: emptyMode, chat: emptyMode };
  const visibleDaily = useMemo(() => (data?.daily || []).slice(-14), [data?.daily]);
  const dashboardLabel = data?.scope.panditName || profile?.displayName || user?.name || "Pandit";
  const currentPanditId = String(profile?.id || user?._id || data?.scope.panditId || "").trim();

  useEffect(() => {
    if (socket && currentPanditId) {
      socket.emit("pandit:register_online", { panditId: currentPanditId, email: user?.email });
    }
  }, [socket, currentPanditId, user?.email]);

  const updateAvailabilityStatus = async (nextStatus: "online" | "busy" | "offline") => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    try {
      const res = await fetch(getApiUrl("/api/pandit-dashboard/status"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = await res.json();
      if (payload.success) {
        toast.success(`Availability status set to ${nextStatus.toUpperCase()}`);
        setProfileForm((prev) => ({ ...prev, availabilityStatus: nextStatus }));
        setProfile((prev: any) => ({ ...prev, status: nextStatus, availabilityStatus: nextStatus }));
      }
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };
  const unreadNotificationCount = notifications.filter((item) => item.unread).length;
  const maxDailyBookings = Math.max(1, ...visibleDaily.map((item) => item.bookings));
  const completionRate =
    totals.totalBookings > 0 ? Math.round((totals.completedBookings / totals.totalBookings) * 100) : 0;

  useEffect(() => {
    const activeRequests = (data?.recentBookings || [])
      .filter((booking) => isOpenRequestStatus(booking.status))
      .map<PanditBookingNotification>((booking) => ({
        bookingId: booking.bookingId,
        roomId: booking.bookingId,
        astrologerId: booking.astrologerId,
        astrologerName: booking.astrologerName || dashboardLabel,
        customerName: booking.customerName || "Devotee",
        customerEmail: booking.customerEmail,
        concern: booking.concern,
        mode: booking.mode,
        durationMinutes: Number(booking.durationMinutes || 5),
        status: booking.status,
        bookedAt: booking.bookedAt,
        receivedAt: booking.bookedAt || new Date().toISOString(),
        unread: true,
      }));

    setNotifications((prev) => {
      const previousById = new Map(prev.map((item) => [item.bookingId, item]));

      return activeRequests.map((request) => {
        const previous = previousById.get(request.bookingId);
        return previous
          ? {
              ...request,
              receivedAt: previous.receivedAt,
              unread: previous.unread,
            }
          : request;
      });
    });
  }, [dashboardLabel, data?.recentBookings]);

  useEffect(() => {
    if (!currentPanditId || authLoading || !isUserAuthenticated) return;

    const interval = window.setInterval(() => {
      void loadDashboard({ silent: true });
    }, 8000);

    return () => window.clearInterval(interval);
  }, [authLoading, currentPanditId, isUserAuthenticated, loadDashboard]);

  useEffect(() => {
    if (!socket || !isConnected || !currentPanditId) return;

    socket.emit("pandit:subscribe", { panditId: currentPanditId });

    const handleBookingRequest = (payload: Partial<PanditBookingNotification>) => {
      if (!payload.bookingId || !payload.astrologerId || !payload.mode) return;
      if (currentPanditId && String(payload.astrologerId) !== currentPanditId) return;

      const nextNotification: PanditBookingNotification = {
        bookingId: String(payload.bookingId),
        roomId: String(payload.roomId || payload.bookingId),
        astrologerId: String(payload.astrologerId),
        astrologerName: String(payload.astrologerName || dashboardLabel),
        customerName: String(payload.customerName || "Devotee"),
        customerEmail: payload.customerEmail,
        concern: payload.concern,
        mode: payload.mode,
        durationMinutes: Number(payload.durationMinutes || 5),
        status: payload.status || "active",
        bookedAt: payload.bookedAt || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        unread: true,
      };

      setNotifications((prev) => [
        nextNotification,
        ...prev.filter((item) => item.bookingId !== nextNotification.bookingId),
      ].slice(0, 12));
      toast.info(`${nextNotification.customerName} requested a ${nextNotification.mode}.`);
      void loadDashboard({ silent: true });
    };

    const handleBookingEnded = (payload: { bookingId?: string; message?: string }) => {
      if (!payload.bookingId) return;
      setNotifications((prev) => prev.filter((item) => item.bookingId !== payload.bookingId));
      toast.message(payload.message || "A consultation request has ended.");
      void loadDashboard({ silent: true });
    };

    socket.on("pandit:booking-request", handleBookingRequest);
    socket.on("pandit:booking-ended", handleBookingEnded);

    return () => {
      socket.emit("pandit:unsubscribe", { panditId: currentPanditId });
      socket.off("pandit:booking-request", handleBookingRequest);
      socket.off("pandit:booking-ended", handleBookingEnded);
    };
  }, [currentPanditId, dashboardLabel, isConnected, loadDashboard, socket]);

  const handleLogout = () => {
    logoutUser();
    navigate("/", { replace: true });
  };

  const updateProfileField = (field: keyof typeof emptyProfileForm, value: string | boolean) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProfileMode = (mode: "chat" | "call") => {
    setProfileForm((prev) => {
      const nextModes = prev.modes.includes(mode)
        ? prev.modes.filter((item) => item !== mode)
        : [...prev.modes, mode];

      return { ...prev, modes: nextModes.length ? nextModes : [mode] };
    });
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem("userToken");
    if (!token) return;

    setIsSavingProfile(true);
    setProfileError(null);

    const displayName = profileForm.displayName.trim() || user?.name || "Pandit Ji";
    const expertise = profileForm.expertise.trim() || "Vedic Astrology, Puja, Spiritual Guidance";

    try {
      const response = await fetch(getApiUrl("/api/pandit-dashboard/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...profileForm,
          displayName,
          expertise,
          modes: ["chat"],
          pricePerMinute: Number(profileForm.pricePerMinute) || 13,
          experienceYears: Number(profileForm.experienceYears) || 0,
        }),
      });
      const payload = await readJsonResponse<ProfileResponse>(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to save profile.");
      }

      setProfile(payload.profile);
      setProfileForm((prev) => ({
        ...prev,
        displayName: payload.profile.displayName || displayName,
        expertise: payload.profile.expertise || expertise,
      }));
      toast.success("Pandit profile saved successfully!");
      await loadDashboard();
    } catch (saveError: unknown) {
      setProfileError(getErrorMessage(saveError, "Unable to save profile."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const joinBooking = async (booking: RecentBooking) => {
    if (!isOpenRequestStatus(booking.status)) {
      toast.error("This consultation has already ended.");
      return;
    }

    if (joiningBookingId) return;

    setJoiningBookingId(booking.bookingId);

    try {
      const joined = await markPanditJoinedConsultationSession(booking.bookingId);
      const remainingSeconds = Number(joined.session?.remainingSeconds);
      const durationSeconds =
        Number.isFinite(remainingSeconds) && remainingSeconds > 0
          ? remainingSeconds
          : Math.max(1, Number(booking.durationMinutes) || 5) * 60;

      const astrologer = {
        id: booking.astrologerId,
        name: booking.astrologerName,
        avatar: profile?.avatar || profile?.image || "/assets/pandit-assistant.png",
        image: profile?.image || profile?.avatar || "/assets/pandit-assistant.png",
      };

      if (booking.mode === "chat") {
        navigate("/astro-chat", {
          state: {
            bookingId: booking.bookingId,
            roomId: booking.bookingId,
            astrologer,
            devotee: {
              name: booking.customerName || "Devotee",
              email: booking.customerEmail || "",
            },
            durationSeconds,
          },
        });
        return;
      }

      navigate("/astro-call", {
        state: {
          bookingId: booking.bookingId,
          roomId: booking.bookingId,
          astrologer,
          durationSeconds,
          joinExisting: true,
        },
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to join this consultation."));
      void loadDashboard({ silent: true });
    } finally {
      setJoiningBookingId(null);
    }
  };

  const joinNotification = (notification: PanditBookingNotification) => {
    setNotifications((prev) =>
      prev.map((item) => item.bookingId === notification.bookingId ? { ...item, unread: false } : item)
    );
    setIsNotificationsOpen(false);
    void joinBooking({
      bookingId: notification.bookingId,
      astrologerId: notification.astrologerId,
      astrologerName: notification.astrologerName,
      customerName: notification.customerName,
      customerEmail: notification.customerEmail,
      concern: notification.concern,
      mode: notification.mode,
      durationMinutes: notification.durationMinutes,
      earnings: 0,
      paymentStatus: "wallet_pending",
      status: notification.status || "active",
      bookedAt: notification.bookedAt || notification.receivedAt,
    });
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-orange-600">Naman Darshan</p>
            <h1 className="text-2xl font-bold">Pandit Dashboard</h1>
            <p className="text-sm text-slate-500">
              {dashboardLabel}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              {ranges.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={range === item.value}
                  onClick={() => updateParams({ range: item.value })}
                  className={`h-9 min-w-14 rounded-md px-3 text-sm font-semibold transition ${
                    range === item.value
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  title="Notifications"
                  aria-label="Notifications"
                  onClick={toggleNotifications}
                  className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[11px] font-bold text-white">
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 z-40 w-[min(92vw,360px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="font-semibold text-slate-950">Requests</p>
                      <p className="text-xs text-slate-500">New chat and call requests</p>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => {
                          const Icon = notification.mode === "call" ? PhoneCall : MessageCircle;

                          return (
                            <div key={notification.bookingId} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-lg p-2 ${notification.mode === "call" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {notification.customerName}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    {notification.concern || `Live ${notification.mode} consultation`}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {formatDate(notification.bookedAt || notification.receivedAt)}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => joinNotification(notification)}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                <Icon className="h-3.5 w-3.5" />
                                Join {notification.mode}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                          No new requests
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                title="Refresh dashboard"
                onClick={() => void loadDashboard()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                title="Logout"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <UserRound className="h-5 w-5 text-orange-600" />
                Pandit Profile
              </h2>
              <p className="text-sm text-slate-500">
                This profile appears in the devotee dashboard for chat and call bookings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => updateAvailabilityStatus("online")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    (profileForm.availabilityStatus || profile?.availabilityStatus || profile?.status || "online") === "online"
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  Online
                </button>

                <button
                  type="button"
                  onClick={() => updateAvailabilityStatus("busy")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    (profileForm.availabilityStatus || profile?.availabilityStatus || profile?.status) === "busy"
                      ? "bg-red-600 text-white shadow-sm ring-2 ring-red-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Busy
                </button>

                <button
                  type="button"
                  onClick={() => updateAvailabilityStatus("offline")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    (profileForm.availabilityStatus || profile?.availabilityStatus || profile?.status) === "offline"
                      ? "bg-slate-700 text-white shadow-sm ring-2 ring-slate-400"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  Offline
                </button>
              </div>

              <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                profileForm.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}>
                {profileForm.isActive ? "Visible to devotees" : "Hidden from devotees"}
              </span>
            </div>
          </div>

          {profileError && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">{profileError}</p>
            </div>
          )}

          <form onSubmit={saveProfile} className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                value={profileForm.displayName}
                onChange={(event) => updateProfileField("displayName", event.target.value)}
                placeholder="e.g. Pandit Ji"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="expertise">
                Expertise
              </label>
              <input
                id="expertise"
                value={profileForm.expertise}
                onChange={(event) => updateProfileField("expertise", event.target.value)}
                placeholder="Vedic Astrology, Puja, Numerology"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="pricePerMinute">
                Fee Per Minute
              </label>
              <input
                id="pricePerMinute"
                type="number"
                min="1"
                value={profileForm.pricePerMinute}
                onChange={(event) => updateProfileField("pricePerMinute", event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="experienceYears">
                Experience Years
              </label>
              <input
                id="experienceYears"
                type="number"
                min="0"
                value={profileForm.experienceYears}
                onChange={(event) => updateProfileField("experienceYears", event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>



            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="languages">
                Languages
              </label>
              <input
                id="languages"
                value={profileForm.languages}
                onChange={(event) => updateProfileField("languages", event.target.value)}
                placeholder="Hindi, English, Sanskrit"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Profile Photo Upload & Crop Section */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar Preview Frame */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200 flex items-center justify-center">
                    {profileForm.avatar ? (
                      <img
                        src={profileForm.avatar}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Pandit";
                        }}
                      />
                    ) : (
                      <UserRound className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105" title="Change & Crop Photo">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Profile Photo</h4>
                      <p className="text-xs text-slate-500">Upload and crop your photo. This photo will be visible to devotees.</p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload & Crop Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider" htmlFor="avatar">
                      Profile Image URL (Optional Direct Link)
                    </label>
                    <input
                      id="avatar"
                      value={profileForm.avatar}
                      onChange={(event) => updateProfileField("avatar", event.target.value)}
                      placeholder="https://..."
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <label className="text-sm font-semibold text-slate-700" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                value={profileForm.bio}
                onChange={(event) => updateProfileField("bio", event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:col-span-4">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={profileForm.modes.includes("chat")}
                  onChange={() => toggleProfileMode("chat")}
                />
                Chat
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={profileForm.modes.includes("call")}
                  onChange={() => toggleProfileMode("call")}
                />
                Call
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={profileForm.isActive}
                  onChange={(event) => updateProfileField("isActive", event.target.checked)}
                />
                Show in devotee dashboard
              </label>

              <Button type="submit" disabled={isSavingProfile} className="ml-auto rounded-lg">
                <Save className="h-4 w-4" />
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Earnings"
            value={currency.format(totals.earnings)}
            helper={`${currency.format(totals.completedEarnings)} from completed sessions`}
            icon={IndianRupee}
            accent="bg-emerald-50 text-emerald-700"
          />
          <MetricCard
            title="Call Bookings"
            value={compactNumber.format(totals.callBookings)}
            helper={`${compactNumber.format(byMode.call.minutes)} call minutes`}
            icon={PhoneCall}
            accent="bg-sky-50 text-sky-700"
          />
          <MetricCard
            title="Chat Bookings"
            value={compactNumber.format(totals.chatBookings)}
            helper={`${compactNumber.format(byMode.chat.minutes)} chat minutes`}
            icon={MessageCircle}
            accent="bg-violet-50 text-violet-700"
          />
          <MetricCard
            title="Completion Rate"
            value={`${completionRate}%`}
            helper={`${compactNumber.format(totals.activeBookings)} active or confirmed`}
            icon={CheckCircle2}
            accent="bg-amber-50 text-amber-700"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Booking Trend</h2>
                <p className="text-sm text-slate-500">Calls and chats by booking date</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  Call
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Chat
                </span>
              </div>
            </div>

            <div className="mt-6 h-72 overflow-x-auto">
              {visibleDaily.length > 0 ? (
                <div className="grid h-full min-w-[640px] grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-3">
                  {visibleDaily.map((item) => {
                    const height = item.bookings > 0 ? Math.max(10, (item.bookings / maxDailyBookings) * 100) : 0;
                    const callHeight = item.bookings > 0 ? (item.callBookings / item.bookings) * 100 : 0;
                    const chatHeight = item.bookings > 0 ? (item.chatBookings / item.bookings) * 100 : 0;

                    return (
                      <div key={item.date} className="flex h-full flex-col justify-end gap-2">
                        <div className="flex h-52 items-end rounded-md bg-slate-100 px-1.5 pb-1.5">
                          <div
                            className="flex w-full flex-col overflow-hidden rounded bg-slate-200"
                            style={{ height: `${height}%` }}
                            title={`${item.bookings} bookings, ${currency.format(item.earnings)}`}
                          >
                            <div style={{ height: `${chatHeight}%` }} className="bg-emerald-500" />
                            <div style={{ height: `${callHeight}%` }} className="bg-sky-500" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-700">{item.bookings}</p>
                          <p className="text-[11px] text-slate-500">{formatDayLabel(item.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm font-medium text-slate-500">
                  No bookings in this range
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Mode Split</h2>
            <div className="mt-5 space-y-4">
              {(["call", "chat"] as const).map((mode) => {
                const summary = byMode[mode];
                const Icon = mode === "call" ? PhoneCall : MessageCircle;
                const total = Math.max(1, totals.totalBookings);
                const width = Math.max(4, (summary.bookings / total) * 100);

                return (
                  <div key={mode} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${mode === "call" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{mode}</p>
                          <p className="text-sm text-slate-500">{compactNumber.format(summary.minutes)} minutes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{compactNumber.format(summary.bookings)}</p>
                        <p className="text-sm text-slate-500">{currency.format(summary.earnings)}</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${mode === "call" ? "bg-sky-500" : "bg-emerald-500"}`}
                        style={{ width: `${summary.bookings > 0 ? width : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <CalendarCheck className="h-5 w-5 text-orange-600" />
                <p className="mt-3 text-2xl font-bold">{compactNumber.format(totals.totalBookings)}</p>
                <p className="text-sm text-slate-500">Total bookings</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <Clock3 className="h-5 w-5 text-blue-600" />
                <p className="mt-3 text-2xl font-bold">{compactNumber.format(totals.totalMinutes)}</p>
                <p className="text-sm text-slate-500">Total minutes</p>
              </div>
            </div>
          </section>
        </div>

        {/* Devotee Feedback & Ratings Section (Compact) */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Devotee Feedback & Ratings</h2>
            </div>
            
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-800">
              <span>⭐ {feedbackSummary?.avgRating || profile?.rating || "5.0"} / 5</span>
              <span className="text-amber-600/70 font-normal">({feedbackSummary?.totalReviews || feedbacks.length || 0} reviews)</span>
            </div>
          </div>

          {isLoadingFeedback ? (
            <div className="py-6 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-1" />
              <p className="text-xs font-medium">Loading feedback...</p>
            </div>
          ) : feedbacks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {feedbacks.map((fb) => (
                <div key={fb.id || fb.bookingId} className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-3 flex flex-col justify-between hover:border-amber-300 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">{fb.customerName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= fb.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic line-clamp-2 bg-white px-2 py-1.5 rounded border border-slate-100">
                      "{fb.comment || "No comment provided."}"
                    </p>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400">
                    <span>ID: {fb.bookingId}</span>
                    <span>{fb.ratedAt ? new Date(fb.ratedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-500">No Devotee Feedback Yet</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Recent Bookings</h2>
              <p className="text-sm text-slate-500">Latest call and chat sessions from MongoDB</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
              <Users className="h-4 w-4" />
              {data?.scope.panditName || dashboardLabel}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Pandit</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Mode</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Duration</th>
                  <th className="px-5 py-3 font-semibold">Earnings</th>
                  <th className="px-5 py-3 font-semibold">Booked At</th>
                  <th className="px-5 py-3 font-semibold">Join</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentBookings?.length ? (
                  data.recentBookings.map((booking) => {
                    const canJoin = isOpenRequestStatus(booking.status);
                    const isJoining = joiningBookingId === booking.bookingId;

                    return (
                    <tr key={booking.bookingId} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950">{booking.astrologerName || dashboardLabel}</p>
                        <p className="max-w-72 truncate text-slate-500">{booking.concern || booking.astrologerName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{booking.customerName || "Customer"}</p>
                        <p className="text-slate-500">{booking.customerEmail || "No email"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${modeClass(booking.mode)}`}>
                          {booking.mode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium">{compactNumber.format(booking.durationMinutes)} min</td>
                      <td className="px-5 py-4 font-bold text-slate-950">{currency.format(booking.earnings)}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(booking.bookedAt)}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void joinBooking(booking)}
                          disabled={!canJoin || isJoining || Boolean(joiningBookingId)}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {isJoining ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : booking.mode === "call" ? (
                            <PhoneCall className="h-3.5 w-3.5" />
                          ) : (
                            <MessageCircle className="h-3.5 w-3.5" />
                          )}
                          {isJoining ? "Joining..." : canJoin ? "Join" : "Ended"}
                        </button>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm font-medium text-slate-500">
                      {isLoading ? "Loading bookings..." : "No bookings found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      {/* Interactive Profile Image Crop Modal */}
      {cropModalOpen && rawImageSrc && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Crop className="w-5 h-5 text-orange-400" /> Crop & Adjust Profile Photo
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setRawImageSrc(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50">
              {/* Interactive Preview Frame */}
              <div className="relative w-60 h-60 mx-auto rounded-full overflow-hidden border-4 border-orange-500 shadow-xl bg-slate-900 flex items-center justify-center">
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={{
                    transform: `scale(${cropZoom}) rotate(${cropRotation}deg) translate(${cropOffsetX}px, ${cropOffsetY}px)`,
                    transition: "transform 0.1s ease-out",
                  }}
                >
                  <img
                    src={rawImageSrc}
                    alt="Crop preview"
                    className="max-w-none w-full h-full object-cover"
                  />
                </div>
                {/* Circular Mask Guide */}
                <div className="absolute inset-0 border-2 border-dashed border-white/70 rounded-full pointer-events-none" />
              </div>

              {/* Crop Controls */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {/* Zoom Control */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5 text-orange-600" /> Zoom Level</span>
                    <span>{cropZoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Horizontal Shift */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Move Horizontal (X)</span>
                    <span>{cropOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={cropOffsetX}
                    onChange={(e) => setCropOffsetX(parseInt(e.target.value))}
                    className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Vertical Shift */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Move Vertical (Y)</span>
                    <span>{cropOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={cropOffsetY}
                    onChange={(e) => setCropOffsetY(parseInt(e.target.value))}
                    className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Rotate Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setCropRotation((prev) => (prev + 90) % 360)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-orange-600" /> Rotate 90°
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => {
                  setCropModalOpen(false);
                  setRawImageSrc(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={handleApplyCropAndUpload}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading Cropped Photo...
                  </>
                ) : (
                  <>
                    <Crop className="w-4 h-4" /> Save & Set Profile Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanditDashboard;
