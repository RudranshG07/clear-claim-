// Live per-station reward rate from WeatherXM's public network stats.
const WEATHERXM_STATS = "https://api.weatherxm.com/api/v1/network/stats";

export type DepinReward = {
  source: string;
  activeStations: number;
  rewards30d: number;
  perStationMonthly: number;
  lastTxUrl?: string;
};

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
