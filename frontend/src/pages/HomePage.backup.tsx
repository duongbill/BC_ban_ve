import { useQuery } from "@tanstack/react-query";
import { Festival } from "@/types";
import { HeroSection } from "@/components/HeroSection";
import { FestivalsGrid } from "@/components/FestivalsGrid";
import { StatsSection } from "@/components/StatsSection";
import { LoadingState, ErrorState } from "@/components/LoadingStates";

// Mock data - in real app this would fetch from blockchain
const mockFestivals: Festival[] = [
  {
    id: "1",
    name: "Summer Music Fest",
    symbol: "SMF",
    nftContract: "0x1234...",
    marketplace: "0x5678...",
    organiser: "0xabcd...",
    totalTickets: 1000,
    ticketsForSale: 50,
  },
  {
    id: "2",
    name: "Electronic Dance Festival",
    symbol: "EDF",
    nftContract: "0x2345...",
    marketplace: "0x6789...",
    organiser: "0xbcde...",
    totalTickets: 2000,
    ticketsForSale: 120,
  },
];

export function HomePage() {
  const {
    data: festivals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["festivals"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockFestivals;
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FestivalsGrid festivals={festivals} isLoading={isLoading} />
      <StatsSection festivals={festivals} />
    </div>
  );
}
