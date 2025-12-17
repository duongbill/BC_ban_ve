import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useBiconomyAccount } from "@/hooks/useBiconomyAccount";
import {
  useBuyTicket,
  useBuySecondaryTicket,
} from "@/hooks/useFestivalMutations";
import {
  useSecondaryMarketTickets,
  NFT_ABI,
} from "@/hooks/useTicketManagement";
import { Festival, Ticket } from "@/types";
import toast from "react-hot-toast";
import "../styles/festival-page.css";
import { usePublicClient } from "wagmi";
import deployedAddresses from "../../../deployedAddresses.json";

// FEST Token ABI for balance/allowance checks
const FEST_TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Use deployed contract addresses from JSON file (more reliable than env vars)
const DEPLOYED_NFT_ADDRESS =
  deployedAddresses.sampleNFT || "0x0000000000000000000000000000000000000000";
const DEPLOYED_MARKETPLACE_ADDRESS =
  deployedAddresses.sampleMarketplace ||
  "0x0000000000000000000000000000000000000000";
const DEPLOYED_ORGANISER_ADDRESS =
  deployedAddresses.organiser || "0x0000000000000000000000000000000000000000";
const DEPLOYED_FEST_TOKEN_ADDRESS =
  deployedAddresses.festToken || "0x0000000000000000000000000000000000000000";

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
    maxTicketsPerWallet: 5,
    maxResalePercentage: 110,
    royaltyPercentage: 5,
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
    maxTicketsPerWallet: 3,
    maxResalePercentage: 115,
    royaltyPercentage: 5,
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
    maxTicketsPerWallet: 10,
    maxResalePercentage: 120,
    royaltyPercentage: 5,
  },
  "4": {
    id: "4",
    name: "Jazz Festival Hà Nội",
    symbol: "JFHN",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 1500,
    ticketsForSale: 180,
    maxTicketsPerWallet: 4,
    maxResalePercentage: 110,
    royaltyPercentage: 5,
  },
  "5": {
    id: "5",
    name: "Rock Concert Sài Gòn",
    symbol: "RCSG",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 2500,
    ticketsForSale: 320,
    maxTicketsPerWallet: 6,
    maxResalePercentage: 110,
    royaltyPercentage: 5,
  },
  "6": {
    id: "6",
    name: "EDM Festival Hồ Chí Minh",
    symbol: "EDMHCM",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 5000,
    ticketsForSale: 450,
    maxTicketsPerWallet: 8,
    maxResalePercentage: 115,
    royaltyPercentage: 5,
  },
  "7": {
    id: "7",
    name: "Acoustic Night Đà Lạt",
    symbol: "ANDL",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 800,
    ticketsForSale: 95,
    maxTicketsPerWallet: 2,
    maxResalePercentage: 105,
    royaltyPercentage: 5,
  },
  "8": {
    id: "8",
    name: "Hip Hop Show Hà Nội",
    symbol: "HHSHN",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 1800,
    ticketsForSale: 210,
    maxTicketsPerWallet: 5,
    maxResalePercentage: 110,
    royaltyPercentage: 5,
  },
  "9": {
    id: "9",
    name: "Country Music Fest Nha Trang",
    symbol: "CMFNT",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 1200,
    ticketsForSale: 140,
  },
  "10": {
    id: "10",
    name: "Classical Music Night Huế",
    symbol: "CMNH",
    nftContract: DEPLOYED_NFT_ADDRESS,
    marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
    organiser: DEPLOYED_ORGANISER_ADDRESS,
    totalTickets: 600,
    ticketsForSale: 75,
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
      description:
        "VIP access to all areas including backstage, VIP lounge, and premium seating",
      price: "100",
      icon: "👑",
      color: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    },
    {
      id: "standard",
      name: "Standard Ticket",
      description:
        "General admission to the festival with access to main stage and food areas",
      price: "50",
      icon: "🎫",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: "early-bird",
      name: "Early Bird",
      description:
        "Discounted ticket for early supporters with standard access",
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
      description:
        "Private box with premium view, complimentary drinks, and exclusive access",
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
  "4": [
    {
      id: "vip",
      name: "VIP Jazz Lounge",
      description:
        "Exclusive VIP area with premium seating, complimentary drinks, and meet & greet with artists",
      price: "130",
      icon: "🎷",
      color: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
    },
    {
      id: "standard",
      name: "Standard Ticket",
      description:
        "General admission with access to all stages and performances",
      price: "65",
      icon: "🎺",
      color: "linear-gradient(135deg, #4B5563 0%, #6B7280 100%)",
    },
    {
      id: "student",
      name: "Student Pass",
      description: "Discounted rate for students with valid student ID",
      price: "45",
      icon: "🎓",
      color: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
    },
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Special early bird pricing for advance purchases",
      price: "55",
      icon: "🐦",
      color: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    },
  ],
  "5": [
    {
      id: "front-row",
      name: "Front Row",
      description:
        "Closest to the stage, ultimate rock experience with premium sound",
      price: "180",
      icon: "🎸",
      color: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
    },
    {
      id: "mosh-pit",
      name: "Mosh Pit",
      description:
        "Standing area near the stage for the ultimate rock concert experience",
      price: "120",
      icon: "🤘",
      color: "linear-gradient(135deg, #991B1B 0%, #DC2626 100%)",
    },
    {
      id: "general",
      name: "General Admission",
      description: "Standard standing area with great view and sound",
      price: "80",
      icon: "🎵",
      color: "linear-gradient(135deg, #4B5563 0%, #6B7280 100%)",
    },
    {
      id: "balcony",
      name: "Balcony View",
      description: "Elevated seating with panoramic view of the stage",
      price: "100",
      icon: "🎪",
      color: "linear-gradient(135deg, #7C2D12 0%, #F97316 100%)",
    },
  ],
  "6": [
    {
      id: "vip",
      name: "VIP Experience",
      description:
        "VIP area with premium sound, private bar, and exclusive access",
      price: "200",
      icon: "🎧",
      color: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
    },
    {
      id: "premium",
      name: "Premium Floor",
      description: "Premium standing area close to the main stage",
      price: "150",
      icon: "💿",
      color: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    },
    {
      id: "general",
      name: "General Admission",
      description: "Access to all stages and festival areas",
      price: "100",
      icon: "🎹",
      color: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
    },
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Special pricing for early ticket purchases",
      price: "80",
      icon: "⚡",
      color: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
    },
  ],
  "7": [
    {
      id: "vip",
      name: "VIP Cozy Corner",
      description:
        "Intimate VIP area with fireplace, premium seating, and complimentary hot drinks",
      price: "90",
      icon: "🔥",
      color: "linear-gradient(135deg, #92400E 0%, #D97706 100%)",
    },
    {
      id: "standard",
      name: "Standard Ticket",
      description: "General admission to the acoustic performances",
      price: "50",
      icon: "🎵",
      color: "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
    },
    {
      id: "student",
      name: "Student Pass",
      description: "Discounted rate for students",
      price: "35",
      icon: "🎓",
      color: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
    },
    {
      id: "couple",
      name: "Couple Package",
      description: "Special package for couples with romantic seating",
      price: "85",
      icon: "💑",
      color: "linear-gradient(135deg, #BE185D 0%, #EC4899 100%)",
    },
  ],
  "8": [
    {
      id: "vip",
      name: "VIP Backstage",
      description:
        "VIP access with backstage pass, meet & greet, and exclusive merchandise",
      price: "160",
      icon: "🎤",
      color: "linear-gradient(135deg, #1F2937 0%, #374151 100%)",
    },
    {
      id: "front-stage",
      name: "Front Stage",
      description: "Standing area right in front of the stage",
      price: "110",
      icon: "🎵",
      color: "linear-gradient(135deg, #7C2D12 0%, #DC2626 100%)",
    },
    {
      id: "general",
      name: "General Admission",
      description: "Access to all performances and areas",
      price: "75",
      icon: "🎧",
      color: "linear-gradient(135deg, #4B5563 0%, #6B7280 100%)",
    },
    {
      id: "student",
      name: "Student Pass",
      description: "Special rate for students",
      price: "50",
      icon: "🎓",
      color: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
    },
  ],
  "9": [
    {
      id: "vip",
      name: "VIP Beachfront",
      description:
        "VIP area with beachfront view, private bar, and premium seating",
      price: "140",
      icon: "🏖️",
      color: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
    },
    {
      id: "premium",
      name: "Premium Ticket",
      description: "Premium seating with great view of the stage",
      price: "95",
      icon: "🎸",
      color: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    },
    {
      id: "general",
      name: "General Admission",
      description: "Access to festival grounds and all stages",
      price: "65",
      icon: "🎵",
      color: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    },
    {
      id: "group",
      name: "Group Ticket (4+)",
      description: "Special group rate for 4 or more people",
      price: "55",
      icon: "👥",
      color: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
    },
  ],
  "10": [
    {
      id: "vip",
      name: "VIP Royal Box",
      description:
        "Exclusive VIP box with premium view, complimentary refreshments, and royal treatment",
      price: "170",
      icon: "👑",
      color: "linear-gradient(135deg, #78350F 0%, #B45309 100%)",
    },
    {
      id: "orchestra",
      name: "Orchestra Seat",
      description: "Best seats in the orchestra section with perfect acoustics",
      price: "110",
      icon: "🎼",
      color: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
    },
    {
      id: "balcony",
      name: "Balcony Seat",
      description: "Elevated view from balcony section",
      price: "75",
      icon: "🎭",
      color: "linear-gradient(135deg, #4B5563 0%, #6B7280 100%)",
    },
    {
      id: "student",
      name: "Student Pass",
      description: "Discounted rate for students",
      price: "50",
      icon: "🎓",
      color: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
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
  "4": "/jazz-hn-banner.webp", // Jazz Festival Hà Nội
  "5": "/rock-banner.webp", // Rock Concert Sài Gòn
  "6": "/edm-banner.jpg", // EDM Festival Hồ Chí Minh
  "7": "/acoustic-banner.jpg", // Acoustic Night Đà Lạt
  "8": "/hiphop-banner.jpg", // Hip Hop Show Hà Nội
  "9": "/nhatrang-banner.png", // Country Music Fest Nha Trang
  "10": "/hue-banner.jpg", // Classical Music Night Huế
};

// Festival descriptions
const FESTIVAL_DESCRIPTIONS: Record<
  string,
  { description: string; features: string[]; location: string; date: string }
> = {
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
  "4": {
    description:
      "Jazz Festival Hà Nội - Đắm chìm trong không gian jazz đầy cảm xúc với các nghệ sĩ jazz hàng đầu trong nước và quốc tế. Một đêm nhạc tinh tế với những giai điệu mượt mà, sâu lắng.",
    features: [
      "🎷 Dàn nhạc jazz chuyên nghiệp",
      "🍷 Không gian sang trọng với bar cao cấp",
      "🎹 Độc tấu piano và saxophone",
      "✨ Không khí ấm cúng, thân mật",
    ],
    location: "Nhà hát Tuổi Trẻ, Hà Nội",
    date: "10.03.2026",
  },
  "5": {
    description:
      "Rock Concert Sài Gòn - Bùng nổ với những giai điệu rock mạnh mẽ và đầy năng lượng. Trải nghiệm một đêm nhạc rock đích thực với các ban nhạc rock hàng đầu Việt Nam.",
    features: [
      "🎸 Các ban nhạc rock hàng đầu",
      "🤘 Mosh pit và không khí sôi động",
      "🎵 Hệ thống âm thanh cực mạnh",
      "🔥 Hiệu ứng ánh sáng hoành tráng",
    ],
    location: "Sân vận động Quân khu 7, TP. HCM",
    date: "25.03.2026",
  },
  "6": {
    description:
      "EDM Festival Hồ Chí Minh - Lễ hội âm nhạc điện tử lớn nhất năm với các DJ quốc tế hàng đầu. Hòa mình vào không khí EDM sôi động với ánh sáng laser và hiệu ứng đặc biệt.",
    features: [
      "🎧 Các DJ quốc tế hàng đầu",
      "💿 Nhiều sân khấu EDM đa dạng",
      "⚡ Hệ thống ánh sáng laser hiện đại",
      "🍻 Khu bar và giải trí phong phú",
    ],
    location: "Khu vui chơi giải trí Landmark 81, TP. HCM",
    date: "15.04.2026",
  },
  "7": {
    description:
      "Acoustic Night Đà Lạt - Đêm nhạc acoustic ấm áp giữa không gian núi rừng Đà Lạt. Thưởng thức những bản nhạc acoustic tình cảm trong không gian ấm cúng, thân mật.",
    features: [
      "🎵 Nhạc acoustic tình cảm, sâu lắng",
      "🔥 Không gian ấm cúng với lò sưởi",
      "☕ Đồ uống nóng miễn phí",
      "🌲 Khung cảnh núi rừng lãng mạn",
    ],
    location: "Quán cà phê Tùng, Đà Lạt",
    date: "05.05.2026",
  },
  "8": {
    description:
      "Hip Hop Show Hà Nội - Đêm nhạc hip hop đầy năng lượng với các rapper hàng đầu Việt Nam. Trải nghiệm văn hóa hip hop chân thực với beat mạnh mẽ và flow đỉnh cao.",
    features: [
      "🎤 Các rapper hàng đầu Việt Nam",
      "🎧 Beat và flow đỉnh cao",
      "💪 Không khí sôi động, đầy năng lượng",
      "🎁 Merchandise độc quyền",
    ],
    location: "CLB Rock, Hà Nội",
    date: "20.05.2026",
  },
  "9": {
    description:
      "Country Music Fest Nha Trang - Lễ hội nhạc đồng quê đầu tiên tại Việt Nam. Thưởng thức những giai điệu country đầy cảm xúc bên bãi biển Nha Trang tuyệt đẹp.",
    features: [
      "🎸 Nhạc đồng quê chân thực",
      "🏖️ Sân khấu bãi biển độc đáo",
      "🌅 Hoàng hôn tuyệt đẹp",
      "🍔 Ẩm thực BBQ phong phú",
    ],
    location: "Bãi biển Nha Trang",
    date: "10.06.2026",
  },
  "10": {
    description:
      "Classical Music Night Huế - Đêm nhạc cổ điển thanh lịch tại cố đô Huế. Trải nghiệm âm nhạc cổ điển đỉnh cao trong không gian di sản văn hóa độc đáo.",
    features: [
      "🎼 Dàn nhạc cổ điển chuyên nghiệp",
      "🏛️ Không gian di sản văn hóa",
      "🎹 Độc tấu piano và violin",
      "✨ Không gian sang trọng, thanh lịch",
    ],
    location: "Nhà hát Duyệt Thị Đường, Huế",
    date: "25.06.2026",
  },
};

export function FestivalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { smartAccountAddress } = useBiconomyAccount();

  // IMPORTANT: For now, use regular address for buying tickets
  // Smart account needs FEST tokens transferred to it first
  // Using regular address ensures FEST tokens are available
  // Tickets will still be queryable if we use the same address consistently
  const buyerAddress = address; // Use regular address to ensure FEST tokens are available

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(
    null
  );
  const [ticketData, setTicketData] = useState({
    name: "",
    description: "",
    price: "",
    image: null as File | null,
  });

  const buyTicketMutation = useBuyTicket();
  const buySecondaryMutation = useBuySecondaryTicket();

  const { data: festival, isLoading } = useQuery({
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
  const { data: blockchainSecondaryTickets, isLoading: isLoadingSecondary } =
    useSecondaryMarketTickets(
      DEPLOYED_NFT_ADDRESS,
      undefined // Don't exclude any tickets - show all including own
    );

  const currentUserAddress = (
    buyerAddress || smartAccountAddress
  )?.toLowerCase();

  // Transform blockchain tickets to UI format
  const secondaryTickets = React.useMemo(() => {
    if (
      !blockchainSecondaryTickets ||
      blockchainSecondaryTickets.length === 0
    ) {
      // Fallback to mock data if no real tickets
      return mockSecondaryTickets;
    }

    return blockchainSecondaryTickets.map((ticket) => ({
      id: ticket.tokenId.toString(),
      tokenId: ticket.tokenId,
      tokenURI: ticket.tokenURI,
      purchasePrice: (
        BigInt(ticket.purchasePrice) / BigInt(10 ** 18)
      ).toString(),
      sellingPrice: (BigInt(ticket.sellingPrice) / BigInt(10 ** 18)).toString(),
      isForSale: ticket.isForSale,
      owner: ticket.owner,
      isGifted: ticket.isGifted,
      isVerified: ticket.isVerified,
      festival: mockFestival,
    }));
  }, [blockchainSecondaryTickets]);

  const secondaryTicketsForSale = React.useMemo(() => {
    return secondaryTickets.filter((ticket) => ticket.isForSale);
  }, [secondaryTickets]);

  const handleBuyPrimaryTicket = async () => {
    if (!buyerAddress) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    if (!selectedTicketType) {
      toast.error("Vui lòng chọn loại vé");
      return;
    }

    if (
      !festival ||
      !ticketData.name ||
      !ticketData.description ||
      !ticketData.price
    ) {
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
        const selectedType = TICKET_TYPES.find(
          (t) => t.id === selectedTicketType
        );
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
      setTicketData({ name: "", description: "", price: "", image: null });
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  const handleBuySecondaryTicket = async (ticket: Ticket) => {
    if (!festival || !ticket.sellingPrice || !address || !publicClient) return;

    const marketplace = festival.marketplace;
    const ticketId = ticket.tokenId;
    console.log("Buyer address:", address);

    console.log("🔍 DEBUG BEFORE BUY SECONDARY");
    const debugInfo = await Promise.all([
      publicClient.readContract({
        address: DEPLOYED_FEST_TOKEN_ADDRESS as `0x${string}`,
        abi: FEST_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }),
      publicClient.readContract({
        address: DEPLOYED_FEST_TOKEN_ADDRESS as `0x${string}`,
        abi: FEST_TOKEN_ABI,
        functionName: "allowance",
        args: [address as `0x${string}`, marketplace as `0x${string}`],
      }),
      publicClient.readContract({
        address: DEPLOYED_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "getTicketSellingPrice",
        args: [ticketId],
      }),
      publicClient.readContract({
        address: DEPLOYED_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "ownerOf",
        args: [ticketId],
      }),
      publicClient.readContract({
        address: DEPLOYED_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "isTicketForSale",
        args: [ticketId],
      }),
      publicClient.readContract({
        address: DEPLOYED_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "getApproved",
        args: [ticketId],
      }),
      publicClient.readContract({
        address: DEPLOYED_NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: "isApprovedForAll",
        args: [
          (await publicClient.readContract({
            address: DEPLOYED_NFT_ADDRESS as `0x${string}`,
            abi: NFT_ABI,
            functionName: "ownerOf",
            args: [ticketId],
          })) as `0x${string}`,
          marketplace as `0x${string}`,
        ],
      }),
    ]);

    console.log({
      buyerBalance: debugInfo[0],
      allowance: debugInfo[1],
      price: debugInfo[2],
      owner: debugInfo[3],
      forSale: debugInfo[4],
      approved: debugInfo[5],
      approvedForAll: debugInfo[6],
    });

    const buyerBalance = debugInfo[0] as bigint;
    const allowance = debugInfo[1] as bigint;
    const price = debugInfo[2] as bigint;
    const owner = debugInfo[3] as string;
    const forSale = debugInfo[4] as boolean;
    const approved = debugInfo[5] as string;
    const approvedForAll = debugInfo[6] as boolean;

    if (buyerBalance < price) {
      alert(`❌ Không đủ FEST (cần ${Number(price) / 1e18} FEST)`);
      return;
    }

    if (allowance < price) {
      alert("❌ Bạn chưa approve đủ FEST");
      return;
    }

    if (!forSale) {
      alert("❌ Vé không còn bán");
      return;
    }

    if (owner.toLowerCase() === address.toLowerCase()) {
      alert("❌ Không thể mua vé của chính bạn");
      return;
    }

    const isMarketplaceApproved =
      approved?.toLowerCase?.() === marketplace.toLowerCase() || approvedForAll;
    if (!isMarketplaceApproved) {
      alert(
        "❌ Vé này chưa được seller approve cho marketplace.\n" +
          "Seller cần niêm yết vé (bán lại) và approve marketplace để marketplace có thể chuyển NFT khi bán."
      );
      return;
    }

    console.log("🛒 Buy secondary ticket click:", {
      ticketId,
      sellingPrice: ticket.sellingPrice,
      festivalNft: festival.nftContract,
      marketplace,
    });

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Festival not found
          </h2>
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
            <button
              onClick={() => navigate("/")}
              className="btn-outline btn-sm mb-3"
              style={{ marginBottom: "16px" }}
            >
              ← Quay lại
            </button>
            <h1 className="festival-hero-title">{festival.name}</h1>
            <p className="festival-hero-subtitle">{festival.symbol}</p>
            <p className="festival-hero-date">
              📍{" "}
              {FESTIVAL_DESCRIPTIONS[id || "1"]?.location ||
                "Khu đô thị Vạn Phúc, TP. HCM"}{" "}
              • 📅 {FESTIVAL_DESCRIPTIONS[id || "1"]?.date || "27.12.2025"}
            </p>
          </div>
        </div>
      </div>

      <div className="festival-page-container">
        {/* Main Content Grid */}
        <div className="grid-2-cols mb-4" style={{ alignItems: "start" }}>
          {/* Left Column - About & Description */}
          <div>
            <div className="card mb-3">
              <h2 className="card-title">Giới thiệu sự kiện</h2>
              <div className="card-content">
                <p style={{ marginBottom: "16px" }}>
                  {FESTIVAL_DESCRIPTIONS[id || "1"]?.description ||
                    FESTIVAL_DESCRIPTIONS["1"].description}
                </p>
                <p style={{ marginBottom: "16px" }}>
                  {(
                    FESTIVAL_DESCRIPTIONS[id || "1"]?.features ||
                    FESTIVAL_DESCRIPTIONS["1"].features
                  ).map((feature, idx) => (
                    <React.Fragment key={idx}>
                      {feature}
                      {idx <
                        (
                          FESTIVAL_DESCRIPTIONS[id || "1"]?.features ||
                          FESTIVAL_DESCRIPTIONS["1"].features
                        ).length -
                          1 && <br />}
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
            <div
              className="card card-highlight"
              style={{ position: "sticky", top: "100px" }}
            >
              <h3 className="card-title">Thông tin vé</h3>

              {/* Ticket Types Preview */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "rgba(99, 102, 241, 0.05)",
                    borderRadius: "12px",
                    border: "2px solid rgba(99, 102, 241, 0.2)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ marginBottom: "16px" }}>
                    <h4
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#fff",
                        marginBottom: "8px",
                      }}
                    >
                      🎫 Các hạng vé có sẵn
                    </h4>
                    <p style={{ fontSize: "14px", color: "#b0b0b0" }}>
                      {currentTicketTypes.length} loại vé với mức giá từ{" "}
                      {Math.min(
                        ...currentTicketTypes.map((t) => Number(t.price))
                      )}{" "}
                      -{" "}
                      {Math.max(
                        ...currentTicketTypes.map((t) => Number(t.price))
                      )}{" "}
                      FEST
                    </p>
                  </div>

                  {/* Quick Preview of ticket types */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "16px",
                    }}
                  >
                    {currentTicketTypes.slice(0, 4).map((ticketType) => (
                      <div
                        key={ticketType.id}
                        style={{
                          padding: "8px 12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "#e0e0e0",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{ticketType.icon}</span>
                        <span style={{ fontWeight: "500" }}>
                          {ticketType.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      fontSize: "16px",
                      padding: "14px",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
                    }}
                  >
                    🎟️ Chọn hạng vé
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
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ color: "#b0b0b0" }}>Đơn vị tổ chức:</strong>
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
      </div>

      {/* Secondary Market Tickets Section */}
      <div className="festival-page-container" style={{ marginTop: "24px" }}>
        <div className="card mb-3">
          <h2 className="card-title">Vé đang bán lại</h2>
          <div className="card-content">
            {isLoadingSecondary ? (
              <div style={{ padding: "16px 0", color: "#888" }}>
                Đang tải danh sách vé...
              </div>
            ) : secondaryTicketsForSale.length === 0 ? (
              <div style={{ padding: "16px 0", color: "#888" }}>
                Chưa có vé bán lại cho sự kiện này.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {secondaryTicketsForSale.map((ticket) => {
                  const isOwnTicket =
                    !!currentUserAddress &&
                    ticket.owner.toLowerCase() === currentUserAddress;

                  return (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      loading={buySecondaryMutation.isPending}
                      isOwnTicket={isOwnTicket}
                      onBuy={() => handleBuySecondaryTicket(ticket)}
                    />
                  );
                })}
              </div>
            )}
          </div>
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

function TicketCard({
  ticket,
  onBuy,
  loading,
  isOwnTicket = false,
}: TicketCardProps) {
  const priceIncrease = (
    ((parseFloat(ticket.sellingPrice || "0") -
      parseFloat(ticket.purchasePrice || "0")) /
      parseFloat(ticket.purchasePrice || "1")) *
    100
  ).toFixed(1);

  return (
    <div className="card" style={{ overflow: "hidden", position: "relative" }}>
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
          <div
            style={{ fontSize: "48px", fontWeight: "700", marginBottom: "8px" }}
          >
            #{ticket.tokenId}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            {ticket.festival.symbol}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
            transform: "translateX(-100%)",
            transition: "transform 0.6s ease",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#888" }}>Giá gốc:</span>
          <span
            style={{ fontSize: "16px", fontWeight: "600", color: "#b0b0b0" }}
          >
            {ticket.purchasePrice} FEST
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#888" }}>Giá bán:</span>
          <span
            style={{ fontSize: "20px", fontWeight: "700", color: "#6366f1" }}
          >
            {ticket.sellingPrice} FEST
          </span>
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
        {isOwnTicket
          ? "Vé của bạn (không thể mua)"
          : loading
          ? "Đang mua..."
          : `Mua với ${ticket.sellingPrice} FEST`}
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

function BuyTicketModal({
  onClose,
  selectedType,
  onSelectType,
  onBuy,
  loading,
  ticketTypes,
}: BuyTicketModalProps) {
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
              <p className="modal-description">
                Chọn một trong các loại vé có sẵn bên dưới
              </p>
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
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "24px",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            {Array.isArray(ticketTypes) &&
              ticketTypes.map((ticketType) => (
                <div
                  key={ticketType.id}
                  onClick={() => onSelectType(ticketType.id)}
                  style={{
                    background:
                      selectedType === ticketType.id
                        ? ticketType.color
                        : "#1a1a1a",
                    border:
                      selectedType === ticketType.id
                        ? "2px solid #6366f1"
                        : "2px solid #2a2a2a",
                    borderRadius: "16px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    flex: "1 1 calc(33.333% - 16px)",
                    minWidth: "250px",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedType !== ticketType.id) {
                      e.currentTarget.style.border = "2px solid #4a4a4a";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedType !== ticketType.id) {
                      e.currentTarget.style.border = "2px solid #2a2a2a";
                      e.currentTarget.style.transform = "scale(1)";
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
                      filter:
                        selectedType === ticketType.id
                          ? "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
                          : "none",
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
                      color:
                        selectedType === ticketType.id ? "#ffffff" : "#b0b0b0",
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
                    <span style={{ fontSize: "16px", opacity: 0.8 }}>FEST</span>
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
              <p style={{ color: "#e0e0e0", fontSize: "14px", margin: 0 }}>
                ✨ Bạn đã chọn:{" "}
                <strong style={{ color: "#ffffff" }}>
                  {ticketTypes.find((t) => t.id === selectedType)?.name}
                </strong>{" "}
                với giá{" "}
                <strong style={{ color: "#ffffff" }}>
                  {ticketTypes.find((t) => t.id === selectedType)?.price} FEST
                </strong>
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
