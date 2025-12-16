import React, {useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {useAccount} from "wagmi";
import {useBiconomyAccount} from "@/hooks/useBiconomyAccount";
import {useBuyTicket, useBuySecondaryTicket} from "@/hooks/useFestivalMutations";
import {useSecondaryMarketTickets} from "@/hooks/useTicketManagement";
import {uploadMetadata} from "@/services/ipfs";
import {Festival, Ticket} from "@/types";
import toast from "react-hot-toast";
import "../styles/festival-page.css";

// Import deployed addresses directly from JSON file
import deployedAddresses from "../../../deployedAddresses.json";

// Use deployed contract addresses from JSON file (more reliable than env vars)
const DEPLOYED_NFT_ADDRESS = deployedAddresses.sampleNFT || "0x0000000000000000000000000000000000000000";
const DEPLOYED_MARKETPLACE_ADDRESS = deployedAddresses.sampleMarketplace || "0x0000000000000000000000000000000000000000";
const DEPLOYED_ORGANISER_ADDRESS = deployedAddresses.organiser || "0x0000000000000000000000000000000000000000";
const DEPLOYED_FEST_TOKEN_ADDRESS = deployedAddresses.festToken || "0x0000000000000000000000000000000000000000";

// Mock festivals data for different IDs
const mockFestivals: Record<string, Festival> = {
    "1": {
        id: "1",
        name: "Đêm Nhạc Sài Gòn 2025",
        symbol: "SGM",
        nftContract: DEPLOYED_NFT_ADDRESS,
        marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
        organiser: DEPLOYED_ORGANISER_ADDRESS,
        totalTickets: 1000,
        ticketsForSale: 250,
    },
    "2": {
        id: "2",
        name: "Hòa Nhạc Giao Hưởng Hà Nội",
        symbol: "HNH",
        nftContract: DEPLOYED_NFT_ADDRESS,
        marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
        organiser: DEPLOYED_ORGANISER_ADDRESS,
        totalTickets: 800,
        ticketsForSale: 180,
    },
    "3": {
        id: "3",
        name: "Lễ Hội Âm Nhạc Đà Nẵng",
        symbol: "DND",
        nftContract: DEPLOYED_NFT_ADDRESS,
        marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
        organiser: DEPLOYED_ORGANISER_ADDRESS,
        totalTickets: 1200,
        ticketsForSale: 320,
    },
};

// Fallback festival
const mockFestival: Festival = mockFestivals["1"];

// Note: for secondary market testing, we use placeholder tokenIds and addresses
// In production, these would be fetched from blockchain events
const mockSecondaryTickets: Ticket[] = [
    {
        id: "1",
        tokenId: 1,
        tokenURI: "ipfs://QmExample1",
        purchasePrice: "50",
        sellingPrice: "55",
        isForSale: true,
        owner: "0x0000000000000000000000000000000000000001",
        festival: mockFestival,
    },
    {
        id: "2",
        tokenId: 2,
        tokenURI: "ipfs://QmExample2",
        purchasePrice: "75",
        sellingPrice: "80",
        isForSale: true,
        owner: "0x0000000000000000000000000000000000000002",
        festival: mockFestival,
    },
];

// Ticket types for different festivals
const FESTIVAL_TICKET_TYPES: Record<
    string,
    Array<{
        id: string;
        name: string;
        description: string;
        price: string;
        icon: string;
        color: string;
    }>
> = {
    "1": [
        {
            id: "vip",
            name: "VIP Pass",
            description: "VIP access to all areas including backstage, VIP lounge, and premium seating",
            price: "100",
            icon: "👑",
            color: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        },
        {
            id: "standard",
            name: "Standard Ticket",
            description: "General admission to the festival with access to main stage and food areas",
            price: "50",
            icon: "🎫",
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        {
            id: "early-bird",
            name: "Early Bird",
            description: "Discounted ticket for early supporters with standard access",
            price: "40",
            icon: "🐦",
            color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        },
        {
            id: "student",
            name: "Student Pass",
            description: "Special discounted rate for students with valid ID",
            price: "35",
            icon: "🎓",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        },
    ],
    "2": [
        {
            id: "premium",
            name: "Premium Box",
            description: "Private box with premium view, complimentary drinks, and exclusive access",
            price: "150",
            icon: "🎭",
            color: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
        },
        {
            id: "orchestra",
            name: "Orchestra Seat",
            description: "Best seats in the orchestra section with perfect acoustics",
            price: "80",
            icon: "🎼",
            color: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
        },
        {
            id: "balcony",
            name: "Balcony Seat",
            description: "Elevated view from balcony section with good sound quality",
            price: "60",
            icon: "🎪",
            color: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        },
        {
            id: "student",
            name: "Student Discount",
            description: "Special rate for students with valid student ID",
            price: "45",
            icon: "🎓",
            color: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
        },
    ],
    "3": [
        {
            id: "vip",
            name: "VIP Beach Access",
            description: "Exclusive beachfront area, private bar, and priority entry",
            price: "120",
            icon: "🏖️",
            color: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        },
        {
            id: "general",
            name: "General Admission",
            description: "Access to all stages, food vendors, and beach areas",
            price: "70",
            icon: "🎸",
            color: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
        },
        {
            id: "day-pass",
            name: "Day Pass",
            description: "Single day access to festival grounds and activities",
            price: "50",
            icon: "☀️",
            color: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
        },
        {
            id: "group",
            name: "Group Ticket (5+)",
            description: "Special group rate for 5 or more people",
            price: "45",
            icon: "👥",
            color: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
        },
    ],
};

// Fallback ticket types
const TICKET_TYPES = FESTIVAL_TICKET_TYPES["1"];
// Festival banner images - different images for each festival
// You can replace these with local images in the public folder
const FESTIVAL_BANNERS: Record<string, string> = {
    "1": "/sai-gon-banner.webp", // Sài Gòn - Đêm nhạc sôi động
    "2": "/nha-hat-lon-ha-noi-banner.jpg", // Hà Nội - Nhà hát cổ điển, giao hưởng
    "3": "/da-nang-banner.jpg", // Đà Nẵng - Bãi biển, festival ngoài trời
};

// Festival descriptions
const FESTIVAL_DESCRIPTIONS: Record<string, {description: string; features: string[]; location: string; date: string}> = {
    "1": {
        description:
            "Đêm Nhạc Sài Gòn 2025 - Cùng hoà mình vào không gian âm nhạc sôi động với dàn nghệ sĩ hàng đầu Việt Nam. Một đêm nhạc đáng nhớ với âm thanh, ánh sáng và hiệu ứng sân khấu hoành tráng nhất.",
        features: [
            "✨ Dàn line-up nghệ sĩ khủng",
            "🎵 Hệ thống âm thanh, ánh sáng đẳng cấp quốc tế",
            "🍔 Khu ẩm thực phong phú",
            "🎁 Nhiều hoạt động minigame hấp dẫn",
        ],
        location: "Khu đô thị Vạn Phúc, TP. HCM",
        date: "27.12.2025",
    },
    "2": {
        description:
            "Hòa Nhạc Giao Hưởng Hà Nội - Trải nghiệm âm nhạc cổ điển đỉnh cao với dàn nhạc giao hưởng quốc gia. Một buổi tối thanh lịch với những bản nhạc bất hủ của các nhà soạn nhạc vĩ đại.",
        features: [
            "🎼 Dàn nhạc giao hưởng chuyên nghiệp",
            "🎹 Độc tấu piano và violin",
            "🍷 Khu VIP với rượu vang cao cấp",
            "🎭 Không gian sang trọng, thanh lịch",
        ],
        location: "Nhà hát Lớn Hà Nội",
        date: "15.01.2026",
    },
    "3": {
        description:
            "Lễ Hội Âm Nhạc Đà Nẵng - Festival âm nhạc ngoài trời lớn nhất miền Trung. Hòa mình vào không khí sôi động với nhiều thể loại nhạc từ EDM, Rock đến Pop và Indie.",
        features: [
            "🏖️ Sân khấu bãi biển độc đáo",
            "🎸 Nhiều thể loại nhạc đa dạng",
            "🌊 Trải nghiệm biển đêm tuyệt đẹp",
            "🍻 Khu ẩm thực và bar phong phú",
        ],
        location: "Bãi biển Mỹ Khê, Đà Nẵng",
        date: "20.02.2026",
    },
};

// Create a simple placeholder image as base64
const createPlaceholderImage = (color: string): File => {
    // Create a small canvas
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, 0, 400, 400);
        gradient.addColorStop(0, color === "vip" ? "#FFD700" : color === "standard" ? "#667eea" : color === "early-bird" ? "#f093fb" : "#4facfe");
        gradient.addColorStop(1, color === "vip" ? "#FFA500" : color === "standard" ? "#764ba2" : color === "early-bird" ? "#f5576c" : "#00f2fe");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 400);
    }

    // Convert to blob then file
    return new File([canvas.toDataURL()], `${color}-ticket.png`, {
        type: "image/png",
    });
};

export function FestivalPage() {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {address} = useAccount();
    const {smartAccountAddress} = useBiconomyAccount();

    // IMPORTANT: For now, use regular address for buying tickets
    // Smart account needs FEST tokens transferred to it first
    // Using regular address ensures FEST tokens are available
    // Tickets will still be queryable if we use the same address consistently
    const buyerAddress = address; // Use regular address to ensure FEST tokens are available

    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null);
    const [ticketData, setTicketData] = useState({
        name: "",
        description: "",
        price: "",
        image: null as File | null,
    });

    const buyTicketMutation = useBuyTicket();
    const buySecondaryMutation = useBuySecondaryTicket();

    const {data: festival, isLoading} = useQuery({
        queryKey: ["festival", id],
        queryFn: async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Return festival based on ID, fallback to ID 1 if not found
            return mockFestivals[id || "1"] || mockFestival;
        },
    });

    // Get ticket types for current festival
    const currentTicketTypes = React.useMemo(() => {
        return FESTIVAL_TICKET_TYPES[id || "1"] || TICKET_TYPES;
    }, [id]);

    // Fetch real secondary market tickets from blockchain (include own tickets)
    const {data: blockchainSecondaryTickets, isLoading: isLoadingSecondary} = useSecondaryMarketTickets(
        DEPLOYED_NFT_ADDRESS,
        undefined // Don't exclude any tickets - show all including own
    );

    const currentUserAddress = (buyerAddress || smartAccountAddress)?.toLowerCase();

    // Transform blockchain tickets to UI format
    const secondaryTickets = React.useMemo(() => {
        if (!blockchainSecondaryTickets || blockchainSecondaryTickets.length === 0) {
            // Fallback to mock data if no real tickets
            return mockSecondaryTickets;
        }

        return blockchainSecondaryTickets.map((ticket) => ({
            id: ticket.tokenId.toString(),
            tokenId: ticket.tokenId,
            tokenURI: ticket.tokenURI,
            purchasePrice: (BigInt(ticket.purchasePrice) / BigInt(10 ** 18)).toString(),
            sellingPrice: (BigInt(ticket.sellingPrice) / BigInt(10 ** 18)).toString(),
            isForSale: ticket.isForSale,
            owner: ticket.owner,
            isGifted: ticket.isGifted,
            isVerified: ticket.isVerified,
            festival: mockFestival,
        }));
    }, [blockchainSecondaryTickets]);

    const handleBuyPrimaryTicket = async () => {
        if (!buyerAddress) {
            toast.error("Vui lòng kết nối ví trước");
            return;
        }

        if (!selectedTicketType) {
            toast.error("Vui lòng chọn loại vé");
            return;
        }

        if (!festival || !ticketData.name || !ticketData.description || !ticketData.price) {
            toast.error("Vui lòng chọn loại vé");
            return;
        }

        // Create a mock image if none provided
        let imageFile = ticketData.image;
        if (!imageFile) {
            // Create a simple canvas-based placeholder
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                const selectedType = TICKET_TYPES.find((t) => t.id === selectedTicketType);
                if (selectedType) {
                    // Simple gradient background
                    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
                    gradient.addColorStop(
                        0,
                        selectedType.id === "vip"
                            ? "#FFD700"
                            : selectedType.id === "standard"
                            ? "#667eea"
                            : selectedType.id === "early-bird"
                            ? "#f093fb"
                            : "#4facfe"
                    );
                    gradient.addColorStop(
                        1,
                        selectedType.id === "vip"
                            ? "#FFA500"
                            : selectedType.id === "standard"
                            ? "#764ba2"
                            : selectedType.id === "early-bird"
                            ? "#f5576c"
                            : "#00f2fe"
                    );
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 400, 400);

                    // Add text
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "bold 32px Inter";
                    ctx.textAlign = "center";
                    ctx.fillText(selectedType.name, 200, 200);
                }
            }

            // Convert canvas to blob and then to File
            await new Promise<void>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        imageFile = new File([blob], `${selectedTicketType}-ticket.png`, {
                            type: "image/png",
                        });
                    }
                    resolve();
                });
            });
        }

        if (!imageFile) {
            toast.error("Không thể tạo ảnh vé");
            return;
        }

        if (!buyerAddress) {
            toast.error("Vui lòng kết nối ví trước khi mua vé");
            return;
        }

        console.log("🎫 Attempting to buy ticket:", {
            festival: festival.name,
            ticketType: selectedTicketType,
            price: ticketData.price,
            buyerAddress: buyerAddress,
            regularAddress: address,
            smartAccountAddress: smartAccountAddress,
            nftAddress: festival.nftContract,
            marketplaceAddress: festival.marketplace,
        });

        try {
            const result = await buyTicketMutation.mutateAsync({
                nftAddress: festival.nftContract,
                marketplaceAddress: festival.marketplace,
                tokenAddress: DEPLOYED_FEST_TOKEN_ADDRESS,
                price: ticketData.price,
                buyerAddress: buyerAddress,
                ticketData: {
                    name: ticketData.name,
                    description: ticketData.description,
                    image: imageFile,
                },
            });
            console.log("✅ Ticket purchased successfully:", result);
            setShowBuyModal(false);
            setSelectedTicketType(null);
            setTicketData({name: "", description: "", price: "", image: null});
        } catch (error) {
            console.error("Error buying ticket:", error);
        }
    };

    const handleBuySecondaryTicket = async (ticket: Ticket) => {
        if (!festival || !ticket.sellingPrice) return;

        try {
            await buySecondaryMutation.mutateAsync({
                nftAddress: festival.nftContract,
                marketplaceAddress: festival.marketplace,
                tokenAddress: DEPLOYED_FEST_TOKEN_ADDRESS,
                ticketId: ticket.tokenId,
                price: ticket.sellingPrice,
            });
        } catch (error) {
            console.error("Error buying secondary ticket:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p>Loading festival...</p>
                </div>
            </div>
        );
    }

    if (!festival) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Festival not found</h2>
                    <button onClick={() => navigate("/")} className="btn-primary">
                        Go Back Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="festival-page">
            {/* Hero Banner Section */}
            <div className="festival-hero">
                <img
                    src={FESTIVAL_BANNERS[id || "1"] || "/trai.png"}
                    alt={festival.name}
                    className="festival-hero-image"
                    onError={(e) => {
                        // Fallback to default image if custom image fails to load
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/trai.png") {
                            target.src = "/trai.png";
                        }
                    }}
                />
                <div className="festival-hero-overlay">
                    <div className="festival-page-container">
                        <button onClick={() => navigate("/")} className="btn-outline btn-sm mb-3" style={{marginBottom: "16px"}}>
                            ← Quay lại
                        </button>
                        <h1 className="festival-hero-title">{festival.name}</h1>
                        <p className="festival-hero-subtitle">{festival.symbol}</p>
                        <p className="festival-hero-date">
                            📍 {FESTIVAL_DESCRIPTIONS[id || "1"]?.location || "Khu đô thị Vạn Phúc, TP. HCM"} • 📅{" "}
                            {FESTIVAL_DESCRIPTIONS[id || "1"]?.date || "27.12.2025"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="festival-page-container">
                {/* Main Content Grid */}
                <div className="grid-2-cols mb-4" style={{alignItems: "start"}}>
                    {/* Left Column - About & Description */}
                    <div>
                        <div className="card mb-3">
                            <h2 className="card-title">Giới thiệu sự kiện</h2>
                            <div className="card-content">
                                <p style={{marginBottom: "16px"}}>
                                    {FESTIVAL_DESCRIPTIONS[id || "1"]?.description || FESTIVAL_DESCRIPTIONS["1"].description}
                                </p>
                                <p style={{marginBottom: "16px"}}>
                                    {(FESTIVAL_DESCRIPTIONS[id || "1"]?.features || FESTIVAL_DESCRIPTIONS["1"].features).map((feature, idx) => (
                                        <React.Fragment key={idx}>
                                            {feature}
                                            {idx < (FESTIVAL_DESCRIPTIONS[id || "1"]?.features || FESTIVAL_DESCRIPTIONS["1"].features).length - 1 && (
                                                <br />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="card card-stats">
                            <div className="stat-item">
                                <div className="stat-value">{festival.totalTickets}</div>
                                <div className="stat-label">Tổng vé</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{festival.ticketsForSale}</div>
                                <div className="stat-label">Vé còn lại</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">3</div>
                                <div className="stat-label">Loại vé</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Ticket Purchase Card */}
                    <div>
                        <div className="card card-highlight" style={{position: "sticky", top: "100px"}}>
                            <h3 className="card-title">Thông tin vé</h3>

                            {/* Primary Tickets */}
                            <div style={{marginBottom: "24px"}}>
                                <div
                                    style={{
                                        padding: "16px",
                                        backgroundColor: "rgba(99, 102, 241, 0.05)",
                                        borderRadius: "8px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <span style={{fontWeight: "600", color: "#fff"}}>VIP Pass</span>
                                        <span
                                            style={{
                                                fontSize: "24px",
                                                fontWeight: "700",
                                                color: "#6366f1",
                                            }}
                                        >
                                            100 FEST
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#b0b0b0",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        Vị trí gần sân khấu nhất, ưu đãi đặc biệt
                                    </p>
                                    <button onClick={() => setShowBuyModal(true)} className="btn-primary" style={{width: "100%"}}>
                                        Mua vé ngay
                                    </button>
                                </div>

                                <div
                                    style={{
                                        padding: "16px",
                                        backgroundColor: "rgba(99, 102, 241, 0.05)",
                                        borderRadius: "8px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <span style={{fontWeight: "600", color: "#fff"}}>Standard</span>
                                        <span
                                            style={{
                                                fontSize: "24px",
                                                fontWeight: "700",
                                                color: "#6366f1",
                                            }}
                                        >
                                            50 FEST
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#b0b0b0",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        Vị trí tiêu chuẩn, trải nghiệm đầy đủ
                                    </p>
                                    <button onClick={() => setShowBuyModal(true)} className="btn-primary" style={{width: "100%"}}>
                                        Mua vé ngay
                                    </button>
                                </div>
                            </div>

                            {/* Organizer Info */}
                            <div
                                style={{
                                    padding: "16px",
                                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    color: "#888",
                                }}
                            >
                                <div style={{marginBottom: "8px"}}>
                                    <strong style={{color: "#b0b0b0"}}>Đơn vị tổ chức:</strong>
                                </div>
                                <div
                                    style={{
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                        fontSize: "12px",
                                    }}
                                >
                                    {festival.organiser}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Market Section */}
                <div className="mt-4">
                    <h2 className="card-title" style={{fontSize: "32px", marginBottom: "24px"}}>
                        Thị trường vé thứ cấp
                    </h2>

                    {isLoadingSecondary ? (
                        <div className="card text-center" style={{padding: "60px 40px"}}>
                            <div className="loading-spinner mx-auto mb-4 w-12 h-12 border-4"></div>
                            <p style={{color: "#888", fontSize: "16px"}}>Đang tải vé thứ cấp...</p>
                        </div>
                    ) : secondaryTickets && secondaryTickets.length > 0 ? (
                        <div className="grid-3-cols">
                            {secondaryTickets.map((ticket) => {
                                const isOwnTicket = !!(currentUserAddress && ticket.owner.toLowerCase() === currentUserAddress);
                                return (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        onBuy={() => handleBuySecondaryTicket(ticket)}
                                        loading={buySecondaryMutation.isPending}
                                        isOwnTicket={isOwnTicket}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card text-center" style={{padding: "60px 40px"}}>
                            <div style={{fontSize: "64px", marginBottom: "16px", opacity: 0.3}}>🎫</div>
                            <p
                                style={{
                                    color: "#888",
                                    marginBottom: "24px",
                                    fontSize: "16px",
                                }}
                            >
                                Chưa có vé nào trên thị trường thứ cấp
                            </p>
                            <button onClick={() => setShowBuyModal(true)} className="btn-primary">
                                Mua vé sơ cấp
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Buy Ticket Modal */}
            {showBuyModal && (
                <BuyTicketModal
                    onClose={() => {
                        setShowBuyModal(false);
                        setSelectedTicketType(null);
                    }}
                    selectedType={selectedTicketType}
                    onSelectType={(typeId) => {
                        setSelectedTicketType(typeId);
                        const selected = currentTicketTypes.find((t) => t.id === typeId);
                        if (selected) {
                            setTicketData({
                                name: selected.name,
                                description: selected.description,
                                price: selected.price,
                                image: null, // Will be generated automatically
                            });
                        }
                    }}
                    onBuy={handleBuyPrimaryTicket}
                    loading={buyTicketMutation.isPending}
                    ticketTypes={currentTicketTypes}
                />
            )}
        </div>
    );
}

interface TicketCardProps {
    ticket: Ticket;
    onBuy: () => void;
    loading: boolean;
    isOwnTicket?: boolean;
}

function TicketCard({ticket, onBuy, loading, isOwnTicket = false}: TicketCardProps) {
    const priceIncrease = (
        ((parseFloat(ticket.sellingPrice || "0") - parseFloat(ticket.purchasePrice || "0")) / parseFloat(ticket.purchasePrice || "1")) *
        100
    ).toFixed(1);

    return (
        <div className="card" style={{overflow: "hidden", position: "relative"}}>
            {isOwnTicket && (
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        zIndex: 10,
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                    }}
                >
                    ✅ Vé của bạn
                </div>
            )}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        color: "white",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <div style={{fontSize: "48px", fontWeight: "700", marginBottom: "8px"}}>#{ticket.tokenId}</div>
                    <div style={{fontSize: "14px", opacity: 0.9}}>{ticket.festival.symbol}</div>
                </div>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                        transform: "translateX(-100%)",
                        transition: "transform 0.6s ease",
                    }}
                />
            </div>

            <div style={{marginBottom: "16px"}}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                    }}
                >
                    <span style={{fontSize: "14px", color: "#888"}}>Giá gốc:</span>
                    <span style={{fontSize: "16px", fontWeight: "600", color: "#b0b0b0"}}>{ticket.purchasePrice} FEST</span>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                    }}
                >
                    <span style={{fontSize: "14px", color: "#888"}}>Giá bán:</span>
                    <span style={{fontSize: "20px", fontWeight: "700", color: "#6366f1"}}>{ticket.sellingPrice} FEST</span>
                </div>
                <div
                    style={{
                        fontSize: "12px",
                        color: parseFloat(priceIncrease) > 0 ? "#16a34a" : "#6366f1",
                        textAlign: "right",
                    }}
                >
                    {parseFloat(priceIncrease) > 0 ? "+" : ""}
                    {priceIncrease}% so với giá gốc
                </div>
            </div>

            <div
                style={{
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "16px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                }}
            >
                Chủ sở hữu: {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
            </div>

            <button
                onClick={onBuy}
                disabled={loading || isOwnTicket}
                className="btn-primary"
                style={{
                    width: "100%",
                    opacity: isOwnTicket ? 0.6 : 1,
                    cursor: isOwnTicket ? "not-allowed" : "pointer",
                }}
            >
                {isOwnTicket ? "Vé của bạn (không thể mua)" : loading ? "Đang mua..." : `Mua với ${ticket.sellingPrice} FEST`}
            </button>
        </div>
    );
}

interface BuyTicketModalProps {
    onClose: () => void;
    selectedType: string | null;
    onSelectType: (typeId: string) => void;
    onBuy: () => void;
    loading: boolean;
    ticketTypes: Array<{
        id: string;
        name: string;
        description: string;
        price: string;
        icon: string;
        color: string;
    }>;
}

function BuyTicketModal({onClose, selectedType, onSelectType, onBuy, loading, ticketTypes}: BuyTicketModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <h3 className="modal-title">Chọn loại vé</h3>
                            <p className="modal-description">Chọn một trong các loại vé có sẵn bên dưới</p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "24px",
                                color: "#888",
                                cursor: "pointer",
                                padding: "8px",
                                lineHeight: 1,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        {Array.isArray(ticketTypes) &&
                            ticketTypes.map((ticketType) => (
                                <div
                                    key={ticketType.id}
                                    onClick={() => onSelectType(ticketType.id)}
                                    style={{
                                        background: selectedType === ticketType.id ? ticketType.color : "#1a1a1a",
                                        border: selectedType === ticketType.id ? "2px solid #6366f1" : "2px solid #2a2a2a",
                                        borderRadius: "16px",
                                        padding: "20px",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedType !== ticketType.id) {
                                            e.currentTarget.style.border = "2px solid #4a4a4a";
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedType !== ticketType.id) {
                                            e.currentTarget.style.border = "2px solid #2a2a2a";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }
                                    }}
                                >
                                    {selectedType === ticketType.id && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "12px",
                                                right: "12px",
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "50%",
                                                background: "#ffffff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "16px",
                                            }}
                                        >
                                            ✓
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            fontSize: "48px",
                                            marginBottom: "12px",
                                            filter: selectedType === ticketType.id ? "drop-shadow(0 0 8px rgba(255,255,255,0.5))" : "none",
                                        }}
                                    >
                                        {ticketType.icon}
                                    </div>

                                    <h4
                                        style={{
                                            fontSize: "20px",
                                            fontWeight: "700",
                                            marginBottom: "8px",
                                            color: "#ffffff",
                                        }}
                                    >
                                        {ticketType.name}
                                    </h4>

                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: selectedType === ticketType.id ? "#ffffff" : "#b0b0b0",
                                            marginBottom: "12px",
                                            lineHeight: "1.5",
                                            minHeight: "60px",
                                        }}
                                    >
                                        {ticketType.description}
                                    </p>

                                    <div
                                        style={{
                                            fontSize: "24px",
                                            fontWeight: "700",
                                            color: "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span>{ticketType.price}</span>
                                        <span style={{fontSize: "16px", opacity: 0.8}}>FEST</span>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {selectedType && (
                        <div
                            style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                border: "1px solid rgba(99, 102, 241, 0.3)",
                                borderRadius: "12px",
                                padding: "16px",
                                marginTop: "16px",
                            }}
                        >
                            <p style={{color: "#e0e0e0", fontSize: "14px", margin: 0}}>
                                ✨ Bạn đã chọn: <strong style={{color: "#ffffff"}}>{ticketTypes.find((t) => t.id === selectedType)?.name}</strong> với
                                giá <strong style={{color: "#ffffff"}}>{ticketTypes.find((t) => t.id === selectedType)?.price} FEST</strong>
                            </p>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-outline">
                        Hủy
                    </button>
                    <button
                        onClick={onBuy}
                        disabled={loading || !selectedType}
                        className="btn-primary"
                        style={{
                            opacity: !selectedType && !loading ? 0.5 : 1,
                            cursor: !selectedType && !loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Đang xử lý..." : "Mua vé"}
                    </button>
                </div>
            </div>
        </div>
    );
}
