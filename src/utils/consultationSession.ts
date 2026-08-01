import { getApiUrl, readJsonResponse } from "@/utils/api";

export type ConsultationMode = "chat" | "call";

export type PanditProfile = {
  id: string;
  profileId?: string;
  userId?: string | null;
  email?: string;
  name: string;
  displayName?: string;
  expertise?: string;
  bio?: string;
  languages?: string[];
  modes?: ConsultationMode[];
  price?: number;
  pricePerMinute?: number;
  experience?: string;
  experienceYears?: number;
  status?: "online" | "busy" | "offline";
  image?: string;
  avatar?: string;
  rating?: number;
  ratingCount?: number;
  isActive?: boolean;
};

type StartWalletSessionResponse = {
  success?: boolean;
  message?: string;
  booking?: {
    bookingId?: string;
    durationMinutes?: number;
  };
  session?: {
    remainingSeconds?: number;
  };
};

type ConsultationSession = {
  startedAt?: string;
  endsAt?: string;
  autoEndAt?: string | null;
  panditJoinedAt?: string | null;
  waitingForPandit?: boolean;
  remainingSeconds?: number;
  durationMinutes?: number;
  status?: "active" | "completed";
};

type MarkPanditJoinedResponse = {
  success?: boolean;
  message?: string;
  booking?: {
    bookingId?: string;
    durationMinutes?: number;
  };
  session?: ConsultationSession;
};

export type FinalizeWalletSessionResponse = {
  success?: boolean;
  message?: string;
  wallet?: {
    balance?: number;
  };
  debitAmount?: number;
  amountDebited?: number;
  walletDebitedAmount?: number;
};

type SubmitConsultationFeedbackResponse = {
  success?: boolean;
  message?: string;
  feedback?: {
    rating?: number;
    comment?: string;
    ratedAt?: string;
  };
  profile?: {
    rating?: number;
    ratingCount?: number;
  } | null;
};

const readUserToken = () => {
  const token = localStorage.getItem("userToken");
  if (!token) {
    throw new Error("Please login first.");
  }
  return token;
};

const toDurationMinutes = (durationSeconds?: number) => {
  const seconds = Number(durationSeconds || 300);
  if (!Number.isFinite(seconds) || seconds <= 0) return 5;
  return Math.max(5, Math.ceil(seconds / 60));
};

export const fetchPanditProfiles = async () => {
  const response = await fetch(getApiUrl("/api/pandit-dashboard/pandits"));
  const data = await readJsonResponse<{ success?: boolean; message?: string; pandits?: PanditProfile[] }>(response);

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Unable to load pandits.");
  }

  return data.pandits || [];
};

export const startWalletConsultationSession = async ({
  pandit,
  mode,
  durationSeconds,
  concern,
}: {
  pandit: Pick<PanditProfile, "id" | "name">;
  mode: ConsultationMode;
  durationSeconds?: number;
  concern?: string;
}) => {
  const token = readUserToken();
  const durationMinutes = toDurationMinutes(durationSeconds);
  const response = await fetch(getApiUrl("/api/wallet/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      astrologerId: pandit.id,
      mode,
      durationMinutes,
      concern: concern || `Live ${mode} consultation`,
    }),
  });

  const data = await readJsonResponse<StartWalletSessionResponse>(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Unable to start consultation.");
  }

  const bookingId = data.booking?.bookingId;
  if (!bookingId) {
    throw new Error("Consultation did not return a booking id.");
  }

  const remainingSeconds = Number(data.session?.remainingSeconds);
  return {
    bookingId,
    booking: data.booking,
    session: data.session,
    durationSeconds:
      Number.isFinite(remainingSeconds) && remainingSeconds > 0
        ? remainingSeconds
        : durationMinutes * 60,
  };
};

export const finalizeWalletConsultationSession = async (bookingId: string) => {
  const token = readUserToken();
  const response = await fetch(getApiUrl(`/api/astro-bookings/${encodeURIComponent(bookingId)}/finalize`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readJsonResponse<FinalizeWalletSessionResponse>(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Unable to finalize consultation.");
  }

  return data;
};

export const markPanditJoinedConsultationSession = async (bookingId: string) => {
  const token = readUserToken();
  const response = await fetch(getApiUrl(`/api/astro-bookings/${encodeURIComponent(bookingId)}/join`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readJsonResponse<MarkPanditJoinedResponse>(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Unable to join this consultation.");
  }

  return data;
};

export const submitConsultationFeedback = async ({
  bookingId,
  rating,
  comment,
}: {
  bookingId: string;
  rating: number;
  comment?: string;
}) => {
  const token = readUserToken();
  const response = await fetch(getApiUrl(`/api/astro-bookings/${encodeURIComponent(bookingId)}/feedback`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment }),
  });

  const data = await readJsonResponse<SubmitConsultationFeedbackResponse>(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Unable to submit feedback.");
  }

  return data;
};
