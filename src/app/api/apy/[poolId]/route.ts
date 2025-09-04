import { NextResponse } from "next/server";

// Interface for historical APY data
interface HistoricalAPY {
  timestamp: string;
  apy: number;
}

interface ApyApiResponse {
  data: HistoricalAPY[];
}

// Dynamic route handler for GET requests
export async function GET(
  request: Request,
  { params }: { params: { poolId: string } }
) {
  const { poolId } = params;

  try {
    // Validate poolId
    if (!poolId) {
      return NextResponse.json({ error: "Invalid pool ID" }, { status: 400 });
    }

    // Fetch APY history from DeFiLlama API
    const response = await fetch(`https://yields.llama.fi/chart/${poolId}`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch APY history: ${response.statusText}`);
    }

    const data: ApyApiResponse = await response.json();
    console.log(`Historical APY Response for pool ${poolId}:`, data); // Log for debugging

    return NextResponse.json<ApyApiResponse>(
      { data: data.data || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error fetching APY history for pool ${poolId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch APY history" },
      { status: 500 }
    );
  }
}
