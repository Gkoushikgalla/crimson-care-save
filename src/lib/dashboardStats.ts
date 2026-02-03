/**
 * Fallback dashboard stats when backend/Firebase is not available.
 * Used consistently across the app (HeroSection, dashboards, etc.).
 */
export const FALLBACK_DASHBOARD_STATS = {
  registeredDonors: 500,
  successfulDonations: 72,
  avgResponseTime: "35 min",
  avgResponseTimeDisplay: "< 35 min",
} as const;
