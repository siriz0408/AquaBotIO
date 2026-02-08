"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fish, Loader2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SpeciesSearch,
  SpeciesFilters,
  SpeciesGrid,
  SpeciesType,
  CareLevel,
  Temperament,
} from "@/components/species";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Species } from "@/types/database";

export default function SpeciesLibraryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [species, setSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SpeciesType>("all");
  const [careLevelFilter, setCareLevelFilter] = useState<CareLevel>("all");
  const [temperamentFilter, setTemperamentFilter] = useState<Temperament>("all");

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 24;

  const loadSpecies = useCallback(
    async (reset = false) => {
      if (reset) {
        setPage(0);
        setSpecies([]);
      }

      setIsLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        let query = supabase
          .from("species")
          .select("*")
          .order("common_name", { ascending: true })
          .range(reset ? 0 : page * PAGE_SIZE, (reset ? 0 : page) * PAGE_SIZE + PAGE_SIZE - 1);

        // Apply search
        if (searchQuery) {
          query = query.or(
            `common_name.ilike.%${searchQuery}%,scientific_name.ilike.%${searchQuery}%`
          );
        }

        // Apply type filter
        if (typeFilter !== "all") {
          query = query.eq("type", typeFilter);
        }

        // Apply care level filter
        if (careLevelFilter !== "all") {
          query = query.eq("care_level", careLevelFilter);
        }

        // Apply temperament filter
        if (temperamentFilter !== "all") {
          query = query.eq("temperament", temperamentFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (reset) {
          setSpecies(data || []);
        } else {
          setSpecies((prev) => [...prev, ...(data || [])]);
        }

        setHasMore((data?.length || 0) === PAGE_SIZE);
      } catch (error) {
        console.error("Error loading species:", error);
        toast.error("Failed to load species");
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, router, searchQuery, typeFilter, careLevelFilter, temperamentFilter, page]
  );

  // Reset and reload when filters change
  useEffect(() => {
    loadSpecies(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter, careLevelFilter, temperamentFilter]);

  // Load more when page changes (but not on filter change)
  useEffect(() => {
    if (page > 0) {
      loadSpecies(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const hasActiveFilters =
    typeFilter !== "all" ||
    careLevelFilter !== "all" ||
    temperamentFilter !== "all";

  const clearFilters = () => {
    setTypeFilter("all");
    setCareLevelFilter("all");
    setTemperamentFilter("all");
  };

  return (
    <div className="min-h-screen bg-brand-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-brand-cyan" />
            <span className="font-bold text-brand-navy">AquaBotAI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-brand-navy transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/chat"
              className="text-sm text-gray-600 hover:text-brand-navy transition-colors"
            >
              Chat
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-brand-navy">Species Library</h1>
          <p className="text-gray-600">
            Browse {species.length}+ aquarium species. Search by name or filter by type,
            care level, and temperament.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <SpeciesSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name..."
              className="flex-1"
            />
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 ${showFilters ? "bg-brand-cyan/10 border-brand-cyan text-brand-navy" : ""}`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-brand-cyan text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[typeFilter !== "all", careLevelFilter !== "all", temperamentFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filter Species</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              <SpeciesFilters
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                careLevelFilter={careLevelFilter}
                onCareLevelChange={setCareLevelFilter}
                temperamentFilter={temperamentFilter}
                onTemperamentChange={setTemperamentFilter}
              />
            </div>
          )}
        </div>

        {/* Results count */}
        {!isLoading && species.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {species.length} species
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {/* Species Grid */}
        <SpeciesGrid
          species={species}
          isLoading={isLoading && species.length === 0}
          emptyMessage={
            searchQuery
              ? "No species match your search. Try a different term."
              : "No species found with the selected filters."
          }
          onAddToTank={async (_species) => {
            // Open tank selection modal or redirect to tank livestock page
            // For now, redirect to dashboard to select a tank
            router.push("/dashboard");
            toast.info("Select a tank from your dashboard to add this species");
          }}
          showAddButton={true}
        />

        {/* Load More */}
        {!isLoading && hasMore && species.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Load More
            </Button>
          </div>
        )}

        {/* Loading more indicator */}
        {isLoading && species.length > 0 && (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
}
