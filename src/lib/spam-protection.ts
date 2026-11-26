/**
 * Spam Protection & Rate Limiting for Oslo Cafe Enquiries
 * Automatically imposes a 1-hour ban if a user repeatedly submits enquiry forms.
 */

const BAN_STORAGE_KEY = "oslo_enquiry_ban_until";
const ATTEMPTS_STORAGE_KEY = "oslo_enquiry_attempts";

const MAX_ATTEMPTS_BEFORE_BAN = 3; // 3 submissions within the window triggers 1-hour ban
const ATTEMPT_WINDOW_MS = 3 * 60 * 1000; // 3 minutes
const BAN_DURATION_MS = 60 * 60 * 1000; // 1 hour (3,600,000 ms)

export interface BanStatus {
  isBanned: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  banUntil: number | null;
}

/**
 * Check if the current device/user is currently banned from submitting enquiries
 */
export function checkEnquiryBanStatus(): BanStatus {
  if (typeof window === "undefined") {
    return { isBanned: false, remainingMinutes: 0, remainingSeconds: 0, banUntil: null };
  }

  try {
    const rawBanUntil = localStorage.getItem(BAN_STORAGE_KEY);
    if (rawBanUntil) {
      const banUntil = parseInt(rawBanUntil, 10);
      const now = Date.now();
      if (now < banUntil) {
        const remainingMs = banUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        return {
          isBanned: true,
          remainingMinutes,
          remainingSeconds,
          banUntil,
        };
      } else {
        // Ban has expired!
        localStorage.removeItem(BAN_STORAGE_KEY);
        localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
      }
    }
  } catch {}

  return { isBanned: false, remainingMinutes: 0, remainingSeconds: 0, banUntil: null };
}

/**
 * Record a submission attempt.
 * If attempts exceed MAX_ATTEMPTS_BEFORE_BAN, trigger an immediate 1-hour ban.
 */
export function recordEnquiryAttempt(): { isBanned: boolean; remainingMinutes: number } {
  if (typeof window === "undefined") return { isBanned: false, remainingMinutes: 0 };

  const now = Date.now();
  let attempts: number[] = [];

  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (raw) {
      attempts = JSON.parse(raw);
    }
  } catch {}

  // Keep only attempts within the window (3 minutes)
  attempts = attempts.filter((ts) => typeof ts === "number" && now - ts < ATTEMPT_WINDOW_MS);
  attempts.push(now);

  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch {}

  // If user hit or exceeded limit, apply 1-hour ban
  if (attempts.length >= MAX_ATTEMPTS_BEFORE_BAN) {
    const banUntil = now + BAN_DURATION_MS;
    try {
      localStorage.setItem(BAN_STORAGE_KEY, banUntil.toString());
    } catch {}
    return { isBanned: true, remainingMinutes: 60 };
  }

  return { isBanned: false, remainingMinutes: 0 };
}

/**
 * Manually trigger an immediate 1-hour ban (e.g. honeypot bot trap)
 */
export function banDeviceForOneHour(): { banUntil: number; remainingMinutes: number } {
  const banUntil = Date.now() + BAN_DURATION_MS;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BAN_STORAGE_KEY, banUntil.toString());
    } catch {}
  }
  return { banUntil, remainingMinutes: 60 };
}
