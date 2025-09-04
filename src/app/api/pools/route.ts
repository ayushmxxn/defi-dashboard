import { NextResponse } from "next/server";

// Interface for pool data
interface Pool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number | null;
  apy: number | null;
  apyMean30d: number | null;
  category: string;
}

// Interface for DeFiLlama Pools API response
interface PoolsApiResponse {
  data: {
    pool: string;
    chain: string;
    project: string;
    symbol: string | null;
    tvlUsd: number | null;
    apy: number | null;
  }[];
}

// Interface for historical APY data
interface HistoricalAPY {
  timestamp: string;
  apy: number;
}

// Interface for Historical APY API response
interface HistoricalApiResponse {
  data: HistoricalAPY[];
}

// List of target pool IDs
const targetPoolIds = [
  "db678df9-3281-4bc2-a8bb-01160ffd6d48", // Aave V3
  "c1ca08e4-d618-415e-ad63-fcec58705469", // Compound V3
  "8edfdf02-cdbb-43f7-bca6-954e5fe56813", // Maple
  "747c1d2a-c668-4682-b9f9-296708a3dd90", // Lido
  "80b8bf92-b953-4c20-98ea-c9653ef2bb98", // Binance Staked ETH
  "90bfb3c2-5d35-4959-a275-ba5085b08aa3", // Stader
  "107fb915-ab29-475b-b526-d0ed0d3e6110", // Cian Yield Layer
  "05a3d186-2d42-4e21-b1f0-68c079d22677", // Yearn Finance
  "1977885c-d5ae-4c9e-b4df-863b7e1578e6", // Beefy
];

export async function GET() {
  try {
    // Fetch pool data from DeFiLlama API
    const poolsResponse = await fetch("https://yields.llama.fi/pools", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!poolsResponse.ok) {
      throw new Error(`Failed to fetch pools: ${poolsResponse.statusText}`);
    }

    const poolsData: PoolsApiResponse = await poolsResponse.json();
    console.log("Pools API Response:", poolsData); // Log raw pools API response (server-side)

    // Filter pools to include only those in targetPoolIds and map to Pool interface
    const filteredPools: Pool[] = poolsData.data
      .filter((pool) => targetPoolIds.includes(pool.pool))
      .map((pool) => ({
        pool: pool.pool,
        chain: pool.chain,
        project: pool.project,
        symbol: pool.symbol ?? "Unknown",
        tvlUsd: pool.tvlUsd ?? 0,
        apy: pool.apy ?? 0,
        apyMean30d: null, // Will be populated with historical data
        category:
          pool.project.toLowerCase() === "aave-v3" ||
          pool.project.toLowerCase() === "compound-v3" ||
          pool.project.toLowerCase() === "maple"
            ? "Lending"
            : pool.project.toLowerCase() === "lido" ||
              pool.project.toLowerCase() === "binance-staked-eth" ||
              pool.project.toLowerCase() === "stader"
            ? "Liquid Staking"
            : "Yield Aggregator",
      }));

    // Fetch historical APY data for each pool
    const poolsWithHistorical = await Promise.all(
      filteredPools.map(async (pool: Pool) => {
        try {
          const historicalResponse = await fetch(
            `https://yields.llama.fi/chart/${pool.pool}`,
            {
              headers: {
                Accept: "application/json",
              },
              next: { revalidate: 3600 }, // Cache for 1 hour
            }
          );

          if (!historicalResponse.ok) {
            throw new Error(
              `Failed to fetch historical APY for pool ${pool.pool}`
            );
          }

          const historicalData: HistoricalApiResponse =
            await historicalResponse.json();
          console.log(
            `Historical APY Response for pool ${pool.pool}:`,
            historicalData
          ); // Log historical APY response

          // Calculate 30-day average APY
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const recentData = historicalData.data.filter(
            (entry) => new Date(entry.timestamp) >= thirtyDaysAgo
          );
          const apyMean30d =
            recentData.length > 0
              ? recentData.reduce((sum, entry) => sum + entry.apy, 0) /
                recentData.length
              : null;

          return { ...pool, apyMean30d };
        } catch (error) {
          console.error(
            `Error fetching historical APY for pool ${pool.pool}:`,
            error
          );
          return { ...pool, apyMean30d: null };
        }
      })
    );

    console.log("Processed Pools with Historical Data:", poolsWithHistorical); // Log final processed pools

    return NextResponse.json({ data: poolsWithHistorical }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pools:", error);
    return NextResponse.json(
      { error: "Failed to fetch pool data" },
      { status: 500 }
    );
  }
}
