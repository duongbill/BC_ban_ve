import {useQuery} from "@tanstack/react-query";
import {Festival} from "@/types";
import {LoadingState, ErrorState} from "@/components/LoadingStates";
import {HeroCarousel} from "@/components/HeroCarousel";
import {FestivalScrollRow} from "@/components/FestivalScrollRow";
import "../styles/modern-theme.css";

// Mock data - in real app this would fetch from blockchain
const mockFestivals: Festival[] = [
    {
        id: "1",
        name: "Đêm Nhạc Sài Gòn",
        symbol: "SGM",
        nftContract: "0x1234...",
        marketplace: "0x5678...",
        organiser: "0xabcd...",
        totalTickets: 1000,
        ticketsForSale: 50,
    },
    {
        id: "2",
        name: "Hòa Nhạc Giao Hưởng VN",
        symbol: "VNSO",
        nftContract: "0x2345...",
        marketplace: "0x6789...",
        organiser: "0xbcde...",
        totalTickets: 2000,
        ticketsForSale: 120,
    },
    {
        id: "3",
        name: "Lễ hội Âm nhạc Đà Nẵng ",
        symbol: "DND",
        nftContract: "0x2346...",
        marketplace: "0x6781...",
        organiser: "0xbcde...",
        totalTickets: 3000,
        ticketsForSale: 250,
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
        return (
            <div className="modern-container">
                <LoadingState />
            </div>
        );
    }

    if (error) {
        return (
            <div className="modern-container">
                <ErrorState />
            </div>
        );
    }

    // Featured festivals for hero carousel (top 3)
    const featuredFestivals = festivals?.slice(0, 3) || [];

    // Trending festivals (all festivals for now)
    const trendingFestivals = festivals || [];

    return (
        <div className="modern-container">
            {/* Hero Carousel */}
            <HeroCarousel festivals={featuredFestivals} />

            {/* Featured Festivals Section */}
            <FestivalScrollRow title="Sự kiện âm nhạc nổi bật" festivals={featuredFestivals} />

            {/* Trending Events Section with Rankings */}
            <FestivalScrollRow title="Sự kiện đang thịnh hành" festivals={trendingFestivals} showRanking={true} />
        </div>
    );
}
