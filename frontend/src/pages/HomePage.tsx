import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {Festival} from "@/types";
import {LoadingState, ErrorState} from "@/components/LoadingStates";
import {HeroCarousel} from "@/components/HeroCarousel";
import {FestivalScrollRow} from "@/components/FestivalScrollRow";
import {useSearch} from "@/contexts/SearchContext";
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
        name: "Lễ hội Âm nhạc Đà Nẵng",
        symbol: "DND",
        nftContract: "0x2346...",
        marketplace: "0x6781...",
        organiser: "0xbcde...",
        totalTickets: 3000,
        ticketsForSale: 250,
    },
    {
        id: "4",
        name: "Jazz Festival Hà Nội",
        symbol: "JFHN",
        nftContract: "0x3456...",
        marketplace: "0x7890...",
        organiser: "0xcdef...",
        totalTickets: 1500,
        ticketsForSale: 180,
    },
    {
        id: "5",
        name: "Rock Concert Sài Gòn",
        symbol: "RCSG",
        nftContract: "0x4567...",
        marketplace: "0x8901...",
        organiser: "0xdef0...",
        totalTickets: 2500,
        ticketsForSale: 320,
    },
    {
        id: "6",
        name: "EDM Festival Hồ Chí Minh",
        symbol: "EDMHCM",
        nftContract: "0x5678...",
        marketplace: "0x9012...",
        organiser: "0xef01...",
        totalTickets: 5000,
        ticketsForSale: 450,
    },
    {
        id: "7",
        name: "Acoustic Night Đà Lạt",
        symbol: "ANDL",
        nftContract: "0x6789...",
        marketplace: "0x0123...",
        organiser: "0xf012...",
        totalTickets: 800,
        ticketsForSale: 95,
    },
    {
        id: "8",
        name: "Hip Hop Show Hà Nội",
        symbol: "HHSHN",
        nftContract: "0x7890...",
        marketplace: "0x1234...",
        organiser: "0x0123...",
        totalTickets: 1800,
        ticketsForSale: 210,
    },
    {
        id: "9",
        name: "Country Music Nha Trang",
        symbol: "CMNT",
        nftContract: "0x8901...",
        marketplace: "0x2345...",
        organiser: "0x1234...",
        totalTickets: 1200,
        ticketsForSale: 140,
    },
    {
        id: "10",
        name: "Classical Music Night Huế",
        symbol: "CMNH",
        nftContract: "0x9012...",
        marketplace: "0x3456...",
        organiser: "0x2345...",
        totalTickets: 600,
        ticketsForSale: 75,
    },
];

export function HomePage() {
    const { searchQuery } = useSearch();
    
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

    // Filter festivals based on search query
    const filteredFestivals = useMemo(() => {
        if (!festivals) return [];
        if (!searchQuery.trim()) return festivals;
        
        const query = searchQuery.toLowerCase().trim();
        return festivals.filter((festival) => 
            festival.name.toLowerCase().includes(query) ||
            festival.symbol.toLowerCase().includes(query)
        );
    }, [festivals, searchQuery]);

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

    // Featured festivals for hero carousel (top 4)
    const featuredFestivals = filteredFestivals.slice(0, 10);

    // Trending festivals
    const trendingFestivals = filteredFestivals;

    return (
        <div className="modern-container">
            {/* Search Results Info */}
            {searchQuery.trim() && (
                <div style={{
                    padding: "16px",
                    background: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span style={{ color: "#e0e0e0" }}>
                        Tìm thấy <strong style={{ color: "#6366f1" }}>{filteredFestivals.length}</strong> sự kiện cho "{searchQuery}"
                    </span>
                    {filteredFestivals.length === 0 && (
                        <span style={{ color: "#888", marginLeft: "auto" }}>
                            Không tìm thấy kết quả phù hợp
                        </span>
                    )}
                </div>
            )}

            {filteredFestivals.length === 0 && searchQuery.trim() ? (
                <div style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "#888"
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                    <h3 style={{ fontSize: "20px", marginBottom: "8px", color: "#e0e0e0" }}>
                        Không tìm thấy sự kiện
                    </h3>
                    <p>Hãy thử tìm kiếm với từ khóa khác</p>
                </div>
            ) : (
                <>
                    {/* Hero Carousel - only show when not searching */}
                    {!searchQuery.trim() && <HeroCarousel festivals={featuredFestivals} />}

                    {/* Featured Festivals Section */}
                    <FestivalScrollRow 
                        title={searchQuery.trim() ? "Kết quả tìm kiếm" : "Sự kiện âm nhạc nổi bật"} 
                        festivals={featuredFestivals} 
                    />

                    {/* Trending Events Section with Rankings - only show when not searching */}
                    {!searchQuery.trim() && (
                        <FestivalScrollRow 
                            title="Sự kiện đang thịnh hành" 
                            festivals={trendingFestivals} 
                            showRanking={true} 
                        />
                    )}
                </>
            )}
        </div>
    );
}
