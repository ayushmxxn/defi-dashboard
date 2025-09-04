"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

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

// Interface for API response from /api/pools
interface ApiResponse {
  data: Pool[];
  error?: string;
}

// Interface for APY history data
interface ApyDataPoint {
  timestamp: number;
  apy: number;
  month: string;
}

// Interface for APY API response
interface ApyApiResponse {
  data?: Array<{ timestamp: string; apy: number }>;
}

// Explicitly define ChartConfig type
interface CustomChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

const chartConfig: CustomChartConfig = {
  apy: {
    label: "APY (%)",
    color: "oklch(0.606 0.25 292.717)",
  },
};

export default function PoolDetails() {
  const params = useParams<{ poolId?: string }>();
  const poolId = params.poolId;
  const { theme } = useTheme();
  const [pool, setPool] = useState<Pool | null>(null);
  const [apyHistory, setApyHistory] = useState<ApyDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formatting functions
  const formatTVL = (tvl: number | null): string => {
    if (tvl == null) return "N/A";
    if (tvl <= 0) return "$0";
    if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    return `$${tvl.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatAPY = (apy: number | null): string => {
    if (apy == null) return "N/A";
    return `${apy.toFixed(2)}%`;
  };

  const getCategoryVariant = (
    category: string
  ): "default" | "secondary" | "outline" => {
    switch (category) {
      case "Lending":
        return "default";
      case "Liquid Staking":
        return "secondary";
      case "Yield Aggregator":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getApyBadgeVariant = (
    apy: number | null
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (apy == null) return "secondary";
    if (apy >= 6) return "default";
    if (apy <= 4) return "destructive";
    return "outline";
  };

  // Fetch pool details and APY history
  useEffect(() => {
    if (!poolId) {
      setError("Invalid pool ID");
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch pool data
        const poolResponse = await fetch("/api/pools", {
          cache: "no-store", // fresh data
        });
        if (!poolResponse.ok) {
          throw new Error(`Pool API error: ${poolResponse.statusText}`);
        }
        const poolResult: ApiResponse = await poolResponse.json();
        if (poolResult.error) throw new Error(poolResult.error);

        const selectedPool = poolResult.data.find((p) => p.pool === poolId);
        if (!selectedPool) throw new Error("Pool not found");
        setPool(selectedPool);

        // Fetching APY history from local API route
        const apyResponse = await fetch(`/api/apy/${poolId}`, {
          cache: "no-store", // fresh data
        });
        if (!apyResponse.ok) {
          throw new Error(`APY API error: ${apyResponse.statusText}`);
        }
        const apyResult: ApyApiResponse = await apyResponse.json();

        // Process APY data
        const apyData: ApyDataPoint[] = (apyResult.data || [])
          .filter(
            (item): item is { timestamp: string; apy: number } =>
              !!item?.timestamp && item.apy != null && !isNaN(item.apy)
          )
          .map((item) => ({
            timestamp: Math.floor(new Date(item.timestamp).getTime() / 1000),
            apy: Number(item.apy),
            month: "",
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        // Calculate 30-day average APY
        const thirtyDaysAgo = Math.floor(
          subMonths(new Date(), 1).getTime() / 1000
        );
        const recentApyData = apyData.filter(
          (point) => point.timestamp >= thirtyDaysAgo
        );
        const apyMean30d =
          recentApyData.length > 0
            ? recentApyData.reduce((sum, point) => sum + point.apy, 0) /
              recentApyData.length
            : null;

        // Update pool with calculated apyMean30d if not provided
        setPool((prev) =>
          prev
            ? {
                ...prev,
                apyMean30d:
                  prev.apyMean30d != null ? prev.apyMean30d : apyMean30d,
              }
            : prev
        );

        // Filter for 1st of each month (last 12 months)
        const today = new Date();
        const twelveMonthsAgo = subMonths(today, 12);
        const monthlyApy: ApyDataPoint[] = [];
        const threeDaysInSeconds = 3 * 24 * 60 * 60;

        for (let i = 11; i >= 0; i--) {
          const targetMonth = subMonths(today, i);
          const firstOfMonth = startOfMonth(targetMonth);
          const firstOfMonthTimestamp = Math.floor(
            firstOfMonth.getTime() / 1000
          );

          const closestPoint = apyData.find(
            (point) =>
              Math.abs(point.timestamp - firstOfMonthTimestamp) <=
                threeDaysInSeconds &&
              point.timestamp >= Math.floor(twelveMonthsAgo.getTime() / 1000)
          );

          if (closestPoint) {
            monthlyApy.push({
              ...closestPoint,
              month: format(
                new Date(closestPoint.timestamp * 1000),
                "MMM yyyy"
              ),
            });
          }
        }

        setApyHistory(monthlyApy);
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load data. Please try again later.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [poolId]);

  // Background and text colors based on theme
  const cardBackgroundColor = theme === "dark" ? "#1E1E1E" : "#FFFFFF";
  const textColor = theme === "dark" ? "#FFFFFF" : "#000000";

  return (
    <div className="container mx-auto py-10 px-1 sm:px-1">
      {isLoading ? (
        <div className="space-y-6">
          {/* Top Section Skeleton */}
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
                <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <div className="ml-auto">
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
            </div>
          </div>

          {/* Bottom Section Skeleton */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Chart Skeleton */}
                <div className="flex-1">
                  <div className="h-[400px] w-full bg-muted rounded animate-pulse"></div>
                </div>
                {/* Metrics Skeleton */}
                <div className="flex flex-col gap-4 w-full lg:w-64">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4"
                      style={{ backgroundColor: cardBackgroundColor }}
                    >
                      <div className="h-4 w-16 bg-muted rounded animate-pulse mb-2"></div>
                      <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card className="shadow-none">
          <CardContent className="pt-6 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      ) : !pool ? (
        <Card className="shadow-none">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Pool not found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top Section */}
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{pool.project}</h1>
              <Badge variant={getCategoryVariant(pool.category)}>
                {pool.category}
              </Badge>
            </div>
            <div className="ml-auto">
              <Button variant="outline" className="shadow-none" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Lobby
                </Link>
              </Button>
            </div>
          </div>

          {/* Bottom Section: Chart and Metrics */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>APY History</CardTitle>
              <CardDescription>
                APY for the first of each month over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Chart */}
                <div className="flex-1">
                  {apyHistory.length > 0 ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-[400px] w-full"
                    >
                      <LineChart
                        data={apyHistory}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                `${Number(value).toFixed(2)}%`
                              }
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="apy"
                          stroke={chartConfig.apy.color}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No APY history data available for the last 12 months.
                    </p>
                  )}
                </div>
                {/* Metrics */}
                <div className="flex flex-col gap-4 w-full lg:w-64">
                  <div
                    className="border rounded-lg p-4"
                    style={{ backgroundColor: cardBackgroundColor }}
                  >
                    <p
                      className="text-sm text-muted-foreground"
                      style={{ color: textColor }}
                    >
                      Asset
                    </p>
                    <p
                      className="text-lg font-medium"
                      style={{ color: textColor }}
                    >
                      {pool.symbol || "N/A"}
                    </p>
                  </div>
                  <div
                    className="border rounded-lg p-4"
                    style={{ backgroundColor: cardBackgroundColor }}
                  >
                    <p
                      className="text-sm text-muted-foreground"
                      style={{ color: textColor }}
                    >
                      TVL
                    </p>
                    <p
                      className="text-lg font-medium"
                      style={{ color: textColor }}
                    >
                      {formatTVL(pool.tvlUsd)}
                    </p>
                  </div>
                  <div
                    className="border rounded-lg p-4"
                    style={{ backgroundColor: cardBackgroundColor }}
                  >
                    <p
                      className="text-sm text-muted-foreground"
                      style={{ color: textColor }}
                    >
                      APY
                    </p>
                    <Badge
                      variant={getApyBadgeVariant(pool.apy)}
                      style={{ color: textColor }}
                    >
                      {formatAPY(pool.apy)}
                    </Badge>
                  </div>
                  <div
                    className="border rounded-lg p-4"
                    style={{ backgroundColor: cardBackgroundColor }}
                  >
                    <p
                      className="text-sm text-muted-foreground"
                      style={{ color: textColor }}
                    >
                      30d Avg APY
                    </p>
                    <Badge variant="secondary" style={{ color: textColor }}>
                      {formatAPY(pool.apyMean30d)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
