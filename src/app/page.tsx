"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

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

interface ApiResponse {
  data: Pool[];
  error?: string;
}

export default function DeFiPoolsTable() {
  const { isWalletConnected } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>(""); // Changed to empty string
  const [search, setSearch] = useState<string>("");
  const [chainFilter, setChainFilter] = useState<string>(""); // Changed to empty string
  const [apyMin, setApyMin] = useState<string>("");
  const [apyMax, setApyMax] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchPools() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/pools", {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pools: ${response.statusText}`);
        }

        const result: ApiResponse = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }

        setPools(result.data);
      } catch (err: unknown) {
        console.error("Error fetching pools from API route:", err);
        setError("Failed to load pool data. Please try again later.");
        setPools([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPools();
  }, []);

  const filteredPools = pools
    .filter((pool) =>
      categoryFilter === "" || categoryFilter === "All"
        ? true
        : pool.category === categoryFilter
    )
    .filter((pool) =>
      chainFilter === "" || chainFilter === "All"
        ? true
        : pool.chain === chainFilter
    )
    .filter((pool) => {
      if (!search) return true;
      const text = `${pool.project} ${pool.symbol}`.toLowerCase();
      return text.includes(search.toLowerCase());
    })
    .filter((pool) => {
      const min = apyMin ? parseFloat(apyMin) : undefined;
      const max = apyMax ? parseFloat(apyMax) : undefined;
      const apy = pool.apy ?? NaN;
      if (!isFinite(apy)) return false;
      if (min !== undefined && apy < min) return false;
      if (max !== undefined && apy > max) return false;
      return true;
    });

  const categories: string[] = [
    "All",
    "Lending",
    "Liquid Staking",
    "Yield Aggregator",
  ];

  const chains: string[] = [
    "All",
    "Ethereum",
    "Arbitrum",
    "Polygon",
    "Base",
    "Solana",
  ];

  const formatTVL = (tvl: number | null): string => {
    if (tvl === null || tvl === undefined) return "N/A";
    if (tvl <= 0) return "$0";
    if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    return `$${tvl.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatAPY = (apy: number | null): string => {
    if (apy === null || apy === undefined) return "N/A";
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

  const getApyTrend = (apy: number | null, apyMean30d: number | null) => {
    if (apy === null || apyMean30d === null) return null;
    const diff = apy - apyMean30d;
    if (Math.abs(diff) < 0.1) return null;
    return diff > 0 ? (
      <TrendingUp
        className="h-3 w-3 text-green-500 inline-block mr-1"
        aria-label="APY trending up"
      />
    ) : (
      <TrendingDown
        className="h-3 w-3 text-red-500 inline-block mr-1"
        aria-label="APY trending down"
      />
    );
  };

  const getApyBadgeVariant = (
    apy: number | null
  ): "default" | "secondary" | "outline" | "destructive" => {
    if (apy === null || apy === undefined) return "secondary";
    if (apy >= 6) return "default";
    if (apy <= 4) return "destructive";
    return "outline";
  };

  return (
    <Tooltip.Provider>
      <div className="px-0 sm:px-0 py-6 bg-background text-foreground max-w-full overflow-x-auto">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">
            DeFi Pools
          </h1>
          <p className="sm:text-lg text-muted-foreground">
            Discover the best yield opportunities across leading DeFi protocols
          </p>
        </div>
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="col-span-1">
              <Input
                placeholder="Search by project or asset"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full border-border rounded-md focus:outline-none">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Select value={chainFilter} onValueChange={setChainFilter}>
                <SelectTrigger className="w-full border-border rounded-md focus:outline-none">
                  <SelectValue placeholder="Select Chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Min APY"
                value={apyMin}
                onChange={(e) => setApyMin(e.target.value)}
              />
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Max APY"
                value={apyMax}
                onChange={(e) => setApyMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="border border-border rounded-lg overflow-hidden">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-b border-border bg-neutral-100 dark:bg-[#1D1D22] dark:hover:bg-[#1D1D22] rounded-t-lg">
                  <TableHead className="px-4 py-3.5 font-medium text-neutral-900 dark:text-foreground">
                    Project
                  </TableHead>
                  <TableHead className="px-4 py-3.5 font-medium text-neutral-900 dark:text-foreground">
                    Category
                  </TableHead>
                  <TableHead className="px-4 py-3.5 font-medium text-neutral-900 dark:text-foreground">
                    Asset
                  </TableHead>
                  <TableHead className="px-4 py-3.5 font-medium text-right text-neutral-900 dark:text-foreground">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="h-4 w-4" /> TVL
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3.5 font-medium text-right text-neutral-900 dark:text-foreground">
                    <div className="flex items-center justify-end gap-1.5">
                      <Percent className="h-4 w-4" /> APY
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3.5 font-medium text-right text-neutral-900 dark:text-foreground">
                    <div className="flex items-center justify-end gap-1.5">
                      <Percent className="h-4 w-4" /> 30d Avg APY
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-border/50"
                      >
                        <TableCell className="px-4 py-3.5">
                          <div className="h-5 bg-muted rounded w-3/4 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="h-5 bg-muted rounded w-1/2 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="h-5 bg-muted rounded w-1/3 animate-pulse"></div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <div className="h-5 bg-muted rounded w-1/4 ml-auto animate-pulse"></div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <div className="h-5 bg-muted rounded w-1/4 ml-auto animate-pulse"></div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <div className="h-5 bg-muted rounded w-1/4 ml-auto animate-pulse"></div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-red-500"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredPools.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No pools found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPools.map((pool, index) => {
                    const isLocked =
                      pool.category === "Yield Aggregator" &&
                      !isWalletConnected;
                    return (
                      <Tooltip.Root key={pool.pool} delayDuration={200}>
                        <Tooltip.Trigger asChild>
                          <TableRow
                            className={`border-b border-border/50 ${
                              isLocked
                                ? "opacity-70 cursor-not-allowed filter blur-[1px]"
                                : "hover:bg-muted/10 cursor-pointer"
                            } transition-colors ${
                              index === filteredPools.length - 1
                                ? "border-b-0"
                                : ""
                            }`}
                          >
                            <Link
                              href={isLocked ? "#" : `/pools/${pool.pool}`}
                              className="contents"
                            >
                              <TableCell className="px-4 py-3.5 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  {isLocked && (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {pool.project}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3.5">
                                <Badge
                                  variant={getCategoryVariant(pool.category)}
                                >
                                  {pool.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-3.5 text-muted-foreground">
                                {pool.symbol}
                              </TableCell>
                              <TableCell
                                className="px-4 py-3.5 text-right font-medium text-foreground"
                                aria-label={`Total Value Locked: ${
                                  pool.tvlUsd
                                    ? pool.tvlUsd.toLocaleString("en-US")
                                    : "Not Available"
                                } USD`}
                                title={
                                  pool.tvlUsd
                                    ? `Exact TVL: $${pool.tvlUsd.toLocaleString(
                                        "en-US"
                                      )}`
                                    : undefined
                                }
                              >
                                {formatTVL(pool.tvlUsd)}
                              </TableCell>
                              <TableCell
                                className="px-4 py-3.5 text-right"
                                aria-label={`Annual Percentage Yield: ${
                                  pool.apy
                                    ? formatAPY(pool.apy)
                                    : "Not Available"
                                }`}
                              >
                                <Badge
                                  variant={getApyBadgeVariant(pool.apy)}
                                  className="font-medium hover:bg-opacity-80 transition-colors"
                                >
                                  {pool.category === "Yield Aggregator" ? (
                                    <>
                                      {getApyTrend(pool.apy, pool.apyMean30d)}
                                      {formatAPY(pool.apy)}
                                    </>
                                  ) : (
                                    <>
                                      {formatAPY(pool.apy)}
                                      {getApyTrend(pool.apy, pool.apyMean30d)}
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="px-4 py-3.5 text-right"
                                aria-label={`30-day Average APY: ${
                                  pool.apyMean30d
                                    ? formatAPY(pool.apyMean30d)
                                    : "Not Available"
                                }`}
                              >
                                <Badge
                                  variant="secondary"
                                  className="font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                  {formatAPY(pool.apyMean30d)}
                                </Badge>
                              </TableCell>
                            </Link>
                          </TableRow>
                        </Tooltip.Trigger>
                        {isLocked && (
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className={`${
                                theme === "dark"
                                  ? "bg-neutral-100 text-neutral-900"
                                  : "bg-background text-foreground"
                              } border border-border rounded-md px-2 py-1 text-xs shadow-md z-50`}
                              side="top"
                              sideOffset={5}
                            >
                              Connect your wallet to unlock these fields
                              <Tooltip.Arrow
                                className={`${
                                  theme === "dark"
                                    ? "fill-neutral-100"
                                    : "fill-border"
                                }`}
                              />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        )}
                      </Tooltip.Root>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
