/**
 * Live DePIN reward data from WeatherXM's public API. This is real, on-chain
 * reward economics from an actual DePIN network (6k+ weather stations on
 * Arbitrum) — used to ground the agent's claim in a genuine per-station reward
 * instead of an invented number.
 *
 * Settlement still happens on our testnet contract (no DePIN mints claimable
 * test rewards), but the *amount and context are real*.
 */
const WEATHERXM_STATS = "https://api.weatherxm.com/api/v1/network/stats";

export type DepinReward = {
  source: string;
  activeStations: number;
  rewards30d: number; // total WXM distributed across the network in 30 days
  perStationMonthly: number; // realistic single-operator monthly reward (WXM)
  lastTxUrl?: string; // a real on-chain WeatherXM reward distribution
};

/** Fetch WeatherXM's live network reward stats. Returns null on any failure. */
export async function getDepinReward(): Promise<DepinReward | null> {
  try {
    const res = await fetch(WEATHERXM_STATS, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const d = (await res.json()) as any;
    const activeStations = Number(d?.net_health?.active_stations);
    const rewards30d = Number(d?.rewards?.last_30days);
    if (!activeStations || !rewards30d) return null;
    return {
      source: "api.weatherxm.com/api/v1/network/stats",
      activeStations,
      rewards30d,
      perStationMonthly: rewards30d / activeStations,
      lastTxUrl: d?.rewards?.last_tx_hash_url,
    };
  } catch {
    return null;
  }
}
