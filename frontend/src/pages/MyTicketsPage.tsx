import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits, parseAbiItem } from "viem";
import { useBiconomyAccount } from "@/hooks/useBiconomyAccount";
import {
  useListTicketForSale,
  useMyTickets,
  useUnlistTicket,
} from "@/hooks/useTicketManagement";
import { Festival, Ticket, TicketMetadata } from "@/types";
import { ipfsToHttp, fetchMetadata } from "@/services/ipfs";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/my-tickets-page.css";

// Import deployed addresses
import deployedAddresses from "../../../deployedAddresses.json";

// Mock tickets - in real app this would fetch from blockchain
const mockTickets: Ticket[] = [
  {
    id: "1",
    tokenId: 1,
    tokenURI: "ipfs://QmTest1",
    purchasePrice: "50",
    sellingPrice: undefined,
    isForSale: false,
    owner: "0x123...",
    festival: {
      id: "1",
      name: "Đêm Nhạc Sài Gòn 2025",
      symbol: "SGM",
      nftContract: "0x1234...",
      marketplace: "0x5678...",
      organiser: "0xabcd...",
    },
  },
  {
    id: "2",
    tokenId: 3,
    tokenURI: "ipfs://QmTest3",
    purchasePrice: "75",
    sellingPrice: "82",
    isForSale: true,
    owner: "0x123...",
    festival: {
      id: "2",
      name: "Hòa Nhạc Giao Hưởng 2025",
      symbol: "HGH",
      nftContract: "0x2345...",
      marketplace: "0x6789...",
      organiser: "0xbcde...",
    },
  },
];

type SoldTicket = {
  id: string;
  tokenId: number;
  nftContract: string;
  marketplace: string;
  seller: string;
  buyer: string;
  price: string; // FEST
  blockNumber: bigint;
  transactionHash: string;
  festival?: Festival;
};

function getFestivalsFromDeployment(): Festival[] {
  const raw = (deployedAddresses as any).festivals;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((f: any) => ({
      id: String(f.id ?? f.symbol ?? "unknown"),
      name: String(f.name ?? "Festival"),
      symbol: String(f.symbol ?? "FEST"),
      nftContract: String(f.nftContract),
      marketplace: String(f.marketplace),
      organiser: String(f.organiser ?? (deployedAddresses as any).organiser),
      maxTicketsPerWallet: f.maxTicketsPerWallet,
      maxResalePercentage: f.maxResalePercentage,
      royaltyPercentage: f.royaltyPercentage,
    }));
  }

  const sampleNFT = (deployedAddresses as any).sampleNFT;
  const sampleMarketplace = (deployedAddresses as any).sampleMarketplace;
  const organiser = (deployedAddresses as any).organiser;

  if (sampleNFT && sampleMarketplace) {
    return [
      {
        id: "1",
        name: "Sample Festival",
        symbol: "SAMPLE",
        nftContract: sampleNFT,
        marketplace: sampleMarketplace,
        organiser: organiser || "0x0000000000000000000000000000000000000000",
      },
    ];
  }

  return [];
}

export function MyTicketsPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { smartAccountAddress } = useBiconomyAccount();
  const [sellModalData, setSellModalData] = useState<{
    ticket: Ticket | null;
    price: string;
  }>({
    ticket: null,
    price: "",
  });
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [resolvingMetadataId, setResolvingMetadataId] = useState<string | null>(
    null
  );
  const [qrCodeModal, setQRCodeModal] = useState<{
    isOpen: boolean;
    ticket: Ticket | null;
    eventName: string | null;
    eventId: string | null;
  }>({
    isOpen: false,
    ticket: null,
    eventName: null,
    eventId: null,
  });

  const listTicketMutation = useListTicketForSale();
  const unlistTicketMutation = useUnlistTicket();

  const festivals = useMemo(() => getFestivalsFromDeployment(), []);
  const festivalByNft = useMemo(() => {
    const map = new Map<string, Festival>();
    festivals.forEach((f) => map.set(f.nftContract.toLowerCase(), f));
    return map;
  }, [festivals]);

  const marketplaces = useMemo(() => {
    const set = new Set<string>();
    festivals.forEach((f) => {
      if (f.marketplace) set.add(f.marketplace);
    });
    const sampleMarketplace = (deployedAddresses as any).sampleMarketplace;
    if (sampleMarketplace) set.add(String(sampleMarketplace));
    return Array.from(set);
  }, [festivals]);

  const sellerAddresses = useMemo(() => {
    const list = [address, smartAccountAddress].filter(Boolean) as string[];
    const set = new Set(list.map((a) => a.toLowerCase()));
    return Array.from(set);
  }, [address, smartAccountAddress]);

  const {
    data: soldTickets,
    isLoading: isLoadingSoldTickets,
    error: soldTicketsError,
  } = useQuery({
    queryKey: ["soldTickets", marketplaces, sellerAddresses],
    enabled:
      Boolean(publicClient) &&
      marketplaces.length > 0 &&
      sellerAddresses.length > 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async (): Promise<SoldTicket[]> => {
      if (
        !publicClient ||
        marketplaces.length === 0 ||
        sellerAddresses.length === 0
      ) {
        return [];
      }

      const event = parseAbiItem(
        "event TicketPurchasedFromCustomer(address indexed buyer,address indexed seller,address indexed nftContract,uint256 tokenId,uint256 price,uint256 commission,uint256 royalty)"
      );

      const logsNested = await Promise.all(
        marketplaces.flatMap((marketplace) =>
          sellerAddresses.map((seller) =>
            publicClient.getLogs({
              address: marketplace as `0x${string}`,
              event,
              args: { seller: seller as `0x${string}` },
              fromBlock: 0n,
              toBlock: "latest",
            })
          )
        )
      );

      const logs = logsNested.flat();

      const parsed: SoldTicket[] = logs
        .map((log) => {
          const buyer = String((log as any).args?.buyer ?? "");
          const seller = String((log as any).args?.seller ?? "");
          const nftContract = String((log as any).args?.nftContract ?? "");
          const tokenId = (log as any).args?.tokenId as bigint;
          const price = (log as any).args?.price as bigint;

          const festival = festivalByNft.get(nftContract.toLowerCase());

          return {
            id: `${String(
              log.address
            )}-${nftContract}-${tokenId.toString()}-${String(
              (log as any).transactionHash
            )}`,
            tokenId: Number(tokenId),
            nftContract,
            marketplace: String(log.address),
            seller,
            buyer,
            price: formatUnits(price, 18),
            blockNumber: (log as any).blockNumber as bigint,
            transactionHash: String((log as any).transactionHash),
            festival,
          };
        })
        .sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1));

      // Dedupe in case the same marketplace+seller got queried twice
      const seen = new Set<string>();
      return parsed.filter((t) => {
        const key = t.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
  });

  // Fetch real tickets from blockchain using Query (real-time updates)
  // Use regular address to match with FestivalPage (which uses regular address for buying)
  const {
    data: blockchainTickets,
    isLoading: isLoadingTickets,
    error: ticketsError,
  } = useMyTickets(deployedAddresses.sampleNFT, address);

  const queryClient = useQueryClient();

  // Force refetch all data when component mounts
  useEffect(() => {
    // Invalidate all queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ["soldTickets"] });
    queryClient.invalidateQueries({ queryKey: ["myTickets"] });
  }, [queryClient]);

  // State to hold metadata for each ticket
  const [ticketsWithMetadata, setTicketsWithMetadata] = useState<Ticket[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Fetch metadata for blockchain tickets
  useEffect(() => {
    async function loadMetadata() {
      if (!blockchainTickets || blockchainTickets.length === 0) {
        return;
      }

      setIsLoadingMetadata(true);
      const ticketsWithMeta = await Promise.all(
        blockchainTickets.map(async (ticket) => {
          let eventId = "1";
          let eventName = "Summer Music Festival";
          let ticketTypeName = "";

          try {
            // Fetch metadata from IPFS (localStorage for mock mode)
            const metadata = await fetchMetadata(ticket.tokenURI);
            console.log(
              "📦 Fetched metadata for token",
              ticket.tokenId,
              ":",
              metadata
            );

            // Parse event info from description
            // Description format: "...\n\nEvent: Jazz Festival Hà Nội\nEvent ID: 4\nTicket Type: VIP Pass\n..."
            if (metadata.description) {
              const eventIdMatch =
                metadata.description.match(/Event ID: (\d+)/);
              const eventNameMatch =
                metadata.description.match(/Event: ([^\n]+)/);
              const ticketTypeMatch = metadata.description.match(
                /Ticket Type: ([^\n]+)/
              );

              if (eventIdMatch && eventIdMatch[1]) {
                eventId = eventIdMatch[1];
              }
              if (eventNameMatch && eventNameMatch[1]) {
                eventName = eventNameMatch[1].trim();
              }
              if (ticketTypeMatch && ticketTypeMatch[1]) {
                ticketTypeName = ticketTypeMatch[1].trim();
              }
            }
          } catch (e) {
            console.warn(
              "Could not fetch metadata for token",
              ticket.tokenId,
              ":",
              e
            );
          }

          return {
            id: ticket.tokenId.toString(),
            tokenId: ticket.tokenId,
            tokenURI: ticket.tokenURI,
            purchasePrice: (
              BigInt(ticket.purchasePrice) / BigInt(10 ** 18)
            ).toString(),
            sellingPrice: ticket.isForSale
              ? (BigInt(ticket.sellingPrice) / BigInt(10 ** 18)).toString()
              : undefined,
            isForSale: ticket.isForSale,
            owner: ticket.owner,
            isGifted: ticket.isGifted,
            isVerified: ticket.isVerified,
            ticketTypeName,
            festival: {
              id: eventId,
              name: eventName,
              symbol: eventId === "1" ? "SUMMER" : `EVENT${eventId}`,
              nftContract: deployedAddresses.sampleNFT,
              marketplace: deployedAddresses.sampleMarketplace,
              organiser: deployedAddresses.organiser,
            },
          };
        })
      );

      setTicketsWithMetadata(ticketsWithMeta);
      setIsLoadingMetadata(false);
    }

    loadMetadata();
  }, [blockchainTickets]);

  // Use tickets with metadata or fallback to mock data
  const tickets = React.useMemo(() => {
    console.log("📋 Blockchain tickets data:", {
      blockchainTickets,
      hasTickets: !!blockchainTickets,
      ticketCount: blockchainTickets?.length || 0,
      ticketsWithMetadata: ticketsWithMetadata.length,
      userAddress: smartAccountAddress || address,
      nftAddress: deployedAddresses.sampleNFT,
    });

    if (blockchainTickets && blockchainTickets.length > 0) {
      return ticketsWithMetadata;
    }

    console.log("⚠️ No blockchain tickets found, using mock data");
    // Fallback to mock data if no real tickets
    return mockTickets.filter(
      (ticket) =>
        ticket.owner.toLowerCase() ===
        (smartAccountAddress || address)?.toLowerCase()
    );
  }, [blockchainTickets, ticketsWithMetadata, smartAccountAddress, address]);

  // Use loading and error from blockchain query (including metadata loading)
  const isLoading = isLoadingTickets || isLoadingMetadata;
  const error = ticketsError;

  const handleSellTicket = async () => {
    if (!sellModalData.ticket || !sellModalData.price) {
      toast.error("Please enter a valid price");
      return;
    }

    const { ticket, price } = sellModalData;

    // Validate price (must be <= 110% of purchase price)
    const maxPrice = parseFloat(ticket.purchasePrice) * 1.1;
    if (parseFloat(price) > maxPrice) {
      toast.error(
        `Price cannot exceed ${maxPrice.toFixed(
          2
        )} FEST (110% of purchase price)`
      );
      return;
    }

    try {
      console.log("🛒 Listing ticket for sale:", {
        nftAddress: ticket.festival.nftContract,
        tokenId: ticket.tokenId,
        sellingPrice: price,
        purchasePrice: ticket.purchasePrice,
        maxPrice: (parseFloat(ticket.purchasePrice) * 1.1).toFixed(2),
      });

      await listTicketMutation.mutateAsync({
        nftAddress: ticket.festival.nftContract,
        tokenId: ticket.tokenId,
        sellingPrice: price,
        marketplaceAddress: ticket.festival.marketplace,
      });

      setSellModalData({ ticket: null, price: "" });
      // Success toast is handled by the hook
    } catch (error: any) {
      console.error("Error listing ticket:", error);
      // Error toast is handled by the hook, but log for debugging
      if (error?.message) {
        console.error("Error details:", error.message);
      }
    }
  };

  const handleUnlistTicket = async (ticket: Ticket) => {
    try {
      await unlistTicketMutation.mutateAsync({
        nftAddress: deployedAddresses.sampleNFT,
        tokenId: ticket.tokenId,
      });
    } catch (error) {
      console.error("Unlist ticket failed", error);
    }
  };

  const handleShowQRCode = async (ticket: Ticket) => {
    setResolvingMetadataId(ticket.id);

    try {
      // Fetch metadata để lấy event name và event ID
      const metadata = await fetchMetadata(ticket.tokenURI);

      // Parse event info from metadata description
      const eventIdMatch = metadata?.description?.match(/Event ID: (\d+)/);
      const eventNameMatch = metadata?.description?.match(/Event: ([^\n]+)/);

      const eventId = eventIdMatch ? eventIdMatch[1] : ticket.festival.id;
      const eventName = eventNameMatch
        ? eventNameMatch[1].trim()
        : ticket.festival.name;

      setQRCodeModal({
        isOpen: true,
        ticket,
        eventName,
        eventId,
      });
    } catch (error) {
      console.error("Error loading ticket metadata:", error);
      // Fallback to festival data if metadata fetch fails
      setQRCodeModal({
        isOpen: true,
        ticket,
        eventName: ticket.festival.name,
        eventId: ticket.festival.id,
      });
    } finally {
      setResolvingMetadataId(null);
    }
  };

  if (!smartAccountAddress && !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-6xl">🔒</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl animate-pulse"></div>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-slate-600 mb-6 text-lg">
            Please connect your wallet to view and manage your festival tickets
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secure blockchain authentication</span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="loading-spinner mx-auto mb-4 w-16 h-16 border-4"></div>
              <div className="absolute inset-0 loading-spinner w-16 h-16 border-4 animate-ping opacity-20"></div>
            </div>
            <p className="text-xl font-medium text-slate-700 animate-pulse">
              Loading your tickets...
            </p>
            <p className="text-sm text-slate-500 mt-2">
              🎫 Fetching from blockchain
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-xl text-red-600 font-semibold mb-2">
              Error loading tickets
            </p>
            <p className="text-slate-600">Please try again later</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-6"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const copyAddress = () => {
    const addr = smartAccountAddress || address || "";
    navigator.clipboard.writeText(addr);
    toast.success("Đã sao chép địa chỉ!");
  };

  // Filter tickets based on active filter
  const filteredTickets = tickets?.filter((ticket) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "for-sale") return ticket.isForSale;
    if (activeFilter === "not-listed") return !ticket.isForSale;
    if (activeFilter === "sold") return false;
    return true;
  });

  return (
    <div className="my-tickets-page-layout">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">
            <span className="avatar-text">
              {address ? address.slice(2, 4).toUpperCase() : "FM"}
            </span>
          </div>
          <div className="user-info">
            <h3 className="user-name">Tài khoản của bạn</h3>
            <div className="user-address">
              {/* <span className="address-mono">
                {smartAccountAddress || address
                  ? `${(smartAccountAddress || address)?.slice(0, 6)}...${(
                      smartAccountAddress || address
                    )?.slice(-4)}`
                  : "Not connected"}
              </span> */}
              <button
                onClick={copyAddress}
                className="copy-icon"
                title="Sao chép địa chỉ"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            {smartAccountAddress && (
              <div className="smart-account-indicator">
                <span className="pulse-dot-small"></span>
                <span className="smart-text">⚡ Smart Account</span>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* <h4 className="nav-section-title">Thông tin tài khoản</h4>
          <a href="#" className="nav-item">
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Thông tin tài khoản
          </a> */}
          <a href="#" className="nav-item active">
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            Vé của tôi
          </a>
          {/* <a href="#" className="nav-item">
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Sự kiện của tôi
          </a>
          <a href="#" className="nav-item">
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Cài đặt
          </a> */}
        </nav>

        <div className="sidebar-stats">
          <div className="stat-item">
            <div className="stat-value">{tickets?.length || 0}</div>
            <div className="stat-label">Tổng số vé</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {tickets?.filter((t) => t.isForSale).length || 0}
            </div>
            <div className="stat-label">Đang bán</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <div className="header-top">
            <h1 className="page-title">🎫 Vé của tôi</h1>
            <p className="page-description">
              Quản lý vé sự kiện và NFT của bạn
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              Tất cả
              <span className="tab-count">{tickets?.length || 0}</span>
            </button>
            <button
              className={`filter-tab ${
                activeFilter === "for-sale" ? "active" : ""
              }`}
              onClick={() => setActiveFilter("for-sale")}
            >
              Đang bán
              <span className="tab-count">
                {tickets?.filter((t) => t.isForSale).length || 0}
              </span>
            </button>
            <button
              className={`filter-tab ${
                activeFilter === "not-listed" ? "active" : ""
              }`}
              onClick={() => setActiveFilter("not-listed")}
            >
              Chưa bán
              <span className="tab-count">
                {tickets?.filter((t) => !t.isForSale).length || 0}
              </span>
            </button>

            <button
              className={`filter-tab ${
                activeFilter === "sold" ? "active" : ""
              }`}
              onClick={() => setActiveFilter("sold")}
            >
              Đã bán
              <span className="tab-count">{soldTickets?.length || 0}</span>
            </button>
          </div>
        </div>

        {/* Tickets Display */}
        <div className="tickets-section">
          {activeFilter === "sold" ? (
            <>
              {isLoadingSoldTickets ? (
                <div className="text-center py-16">
                  <div className="loading-spinner mx-auto mb-4 w-12 h-12 border-4"></div>
                  <p className="text-slate-600">Đang tải lịch sử đã bán...</p>
                </div>
              ) : soldTicketsError ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-red-600 font-semibold">
                    Không tải được lịch sử đã bán
                  </p>
                  <p className="text-slate-600 mt-1">Vui lòng thử lại sau</p>
                </div>
              ) : soldTickets && soldTickets.length > 0 ? (
                <div className="tickets-grid">
                  {soldTickets.map((sold) => (
                    <SoldTicketCard key={sold.id} sold={sold} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <svg
                      className="empty-icon"
                      viewBox="0 0 200 200"
                      fill="none"
                    >
                      <circle cx="100" cy="100" r="80" fill="#f0f0f0" />
                      <path
                        d="M70 90 L130 90 L130 110 L70 110 Z"
                        fill="#d0d0d0"
                      />
                      <circle cx="85" cy="100" r="8" fill="#fff" />
                      <circle cx="115" cy="100" r="8" fill="#fff" />
                    </svg>
                    <span className="empty-emoji">🧾</span>
                  </div>
                  <h3 className="empty-title">Chưa có vé nào đã bán</h3>
                  <p className="empty-description">
                    Lịch sử sẽ hiển thị các giao dịch bán lại (secondary market)
                    mà bạn là người bán.
                  </p>
                </div>
              )}
            </>
          ) : filteredTickets && filteredTickets.length > 0 ? (
            <div className="tickets-grid">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onSell={() => setSellModalData({ ticket, price: "" })}
                  onShowQRCode={handleShowQRCode}
                  onUnlist={handleUnlistTicket}
                  resolvingMetadataId={resolvingMetadataId}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-illustration">
                <svg className="empty-icon" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" fill="#f0f0f0" />
                  <path d="M70 90 L130 90 L130 110 L70 110 Z" fill="#d0d0d0" />
                  <circle cx="85" cy="100" r="8" fill="#fff" />
                  <circle cx="115" cy="100" r="8" fill="#fff" />
                </svg>
                <span className="empty-emoji">🎫</span>
              </div>
              <h3 className="empty-title">
                {activeFilter === "all"
                  ? "Chưa có vé nào"
                  : activeFilter === "for-sale"
                  ? "Không có vé đang bán"
                  : "Không có vé chưa niêm yết"}
              </h3>
              <p className="empty-description">
                {activeFilter === "all"
                  ? "Bạn chưa sở hữu vé sự kiện nào. Hãy bắt đầu hành trình của bạn bằng cách khám phá và mua vé từ các sự kiện có sẵn!"
                  : activeFilter === "for-sale"
                  ? "Bạn chưa có vé nào đang được niêm yết bán. Hãy chọn vé và bắt đầu bán!"
                  : "Tất cả vé của bạn đang được niêm yết. Thử lọc 'Tất cả' để xem!"}
              </p>
              {activeFilter === "all" && (
                <button
                  onClick={() => (window.location.href = "/")}
                  className="btn-explore"
                >
                  🔍 Khám phá sự kiện
                  <svg
                    className="btn-arrow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sell Ticket Modal */}
        {sellModalData.ticket && (
          <SellTicketModal
            ticket={sellModalData.ticket}
            price={sellModalData.price}
            onPriceChange={(price) =>
              setSellModalData({ ...sellModalData, price })
            }
            onClose={() => setSellModalData({ ticket: null, price: "" })}
            onConfirm={handleSellTicket}
            loading={listTicketMutation.isPending}
          />
        )}

        {qrCodeModal.isOpen && qrCodeModal.ticket && (
          <TicketQRCodeModal
            ticket={qrCodeModal.ticket}
            eventName={qrCodeModal.eventName}
            eventId={qrCodeModal.eventId}
            ownerAddress={address || smartAccountAddress || ""}
            onClose={() =>
              setQRCodeModal({
                isOpen: false,
                ticket: null,
                eventName: null,
                eventId: null,
              })
            }
          />
        )}
      </main>
    </div>
  );
}

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function SoldTicketCard({ sold }: { sold: SoldTicket }) {
  const festivalName = sold.festival?.name || "Festival";
  const festivalSymbol = sold.festival?.symbol || "";

  const copyTxHash = async () => {
    try {
      await navigator.clipboard.writeText(sold.transactionHash);
      toast.success("Đã sao chép mã giao dịch!");
    } catch {
      toast.error("Không thể sao chép mã giao dịch");
    }
  };

  return (
    <div className="ticket-card">
      <div className="ticket-poster">
        <div className="poster-overlay"></div>
        <div className="poster-pattern"></div>
        <div className="poster-content">
          <div className="poster-icon">✅</div>
          <h3 className="poster-title">{festivalName}</h3>
          <div className="token-badge">
            <span className="token-label">Token</span>
            <span className="token-id">#{sold.tokenId}</span>
          </div>
        </div>
        <div className="sale-badge">
          <span className="sale-dot"></span>
          Đã bán
        </div>
        <div className="shine-effect"></div>
      </div>

      <div className="ticket-info">
        <div className="ticket-header">
          <h4 className="festival-name">{festivalName}</h4>
          <span className="festival-symbol">{festivalSymbol}</span>
        </div>

        <div className="pricing-card">
          <div className="price-row">
            <span className="price-label">Giá bán</span>
            <span className="price-value">{sold.price} FEST</span>
          </div>
          <div className="price-divider"></div>
          <div className="price-row">
            <span className="price-label">Người mua</span>
            <span className="price-value">{shortenAddress(sold.buyer)}</span>
          </div>
          <div className="price-divider"></div>
          <div className="price-row">
            <span className="price-label">Giao dịch</span>
            <span className="price-value">
              {shortenAddress(sold.transactionHash)}
            </span>
          </div>
        </div>

        <div className="ticket-actions">
          <button className="btn-view-metadata" onClick={copyTxHash}>
            Sao chép mã giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  onSell: () => void;
  onShowQRCode: (ticket: Ticket) => void;
  onUnlist: (ticket: Ticket) => void;
  resolvingMetadataId: string | null;
}

function TicketCard({
  ticket,
  onSell,
  onShowQRCode,
  onUnlist,
  resolvingMetadataId,
}: TicketCardProps) {
  const priceIncrease =
    ticket.isForSale && ticket.sellingPrice
      ? (
          ((parseFloat(ticket.sellingPrice) -
            parseFloat(ticket.purchasePrice)) /
            parseFloat(ticket.purchasePrice)) *
          100
        ).toFixed(1)
      : null;

  return (
    <div className="ticket-card">
      {/* Ticket Poster/Visual */}
      <div className="ticket-poster">
        <div className="poster-overlay"></div>

        {/* Pattern Background */}
        <div className="poster-pattern"></div>

        {/* Content */}
        <div className="poster-content">
          <div className="poster-icon">🎵</div>
          <h3 className="poster-title">{ticket.festival.name}</h3>
          <div className="token-badge">
            <span className="token-label">Mã vé</span>
            <span className="token-id">#{ticket.tokenId}</span>
          </div>
        </div>

        {/* Sale Badge */}
        {ticket.isForSale && (
          <div className="sale-badge">
            <span className="sale-dot"></span>
            Đang bán
          </div>
        )}

        {/* Shine Effect */}
        <div className="shine-effect"></div>
      </div>

      {/* Ticket Info */}
      <div className="ticket-info">
        <div className="ticket-header">
          <h4 className="festival-name">{ticket.festival.name}</h4>
          <span className="festival-symbol">{ticket.festival.symbol}</span>
        </div>

        {/* Ticket Type Badge */}
        {(ticket as any).ticketTypeName && (
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "6px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "16px" }}>🎫</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#a5b4fc",
              }}
            >
              {(ticket as any).ticketTypeName}
            </span>
          </div>
        )}

        {/* Pricing Info */}
        <div className="pricing-card">
          <div className="price-row">
            <span className="price-label">Giá mua</span>
            <span className="price-value">{ticket.purchasePrice} FEST</span>
          </div>

          {ticket.isForSale && ticket.sellingPrice && (
            <>
              <div className="price-divider"></div>
              <div className="price-row">
                <span className="price-label">Giá bán</span>
                <div className="selling-price">
                  <span className="price-icon">💰</span>
                  <span className="price-value-highlight">
                    {ticket.sellingPrice} FEST
                  </span>
                </div>
              </div>
              {priceIncrease && (
                <div className="price-increase">
                  +{priceIncrease}% so với giá gốc
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="ticket-actions">
          {!ticket.isForSale ? (
            <button onClick={onSell} className="btn-sell-ticket">
              <span className="btn-content">
                💸 Bán vé
                <svg
                  className="arrow-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>
          ) : (
            <div className="listed-actions">
              <div className="listed-indicator">
                <span className="pulse-dot"></span>
                Đã niêm yết
              </div>
              <button
                className="btn-remove-sale"
                onClick={() => onUnlist(ticket)}
              >
                ❌ Gỡ bán
              </button>
            </div>
          )}

          {!ticket.isForSale && (
            <button
              onClick={() => onShowQRCode(ticket)}
              className="btn-view-metadata"
              disabled={resolvingMetadataId === ticket.id}
            >
              {resolvingMetadataId === ticket.id ? (
                <>
                  <div className="loading-dot"></div>
                  Đang mở...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Hiển thị QR Code
                </>
              )}
            </button>
          )}

          {ticket.isForSale && (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "#ef4444",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              🔒 Vé đang rao bán - Không thể check-in
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SellTicketModalProps {
  ticket: Ticket;
  price: string;
  onPriceChange: (price: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function SellTicketModal({
  ticket,
  price,
  onPriceChange,
  onClose,
  onConfirm,
  loading,
}: SellTicketModalProps) {
  const maxPrice = parseFloat(ticket.purchasePrice) * 1.1;
  const currentPrice = parseFloat(price) || 0;
  const isValidPrice = currentPrice > 0 && currentPrice <= maxPrice;
  const priceIncrease =
    currentPrice > 0
      ? ((currentPrice / parseFloat(ticket.purchasePrice) - 1) * 100).toFixed(1)
      : "0";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Bán vé sự kiện</h3>
            <p className="modal-subtitle">Đặt giá bán cho vé của bạn</p>
          </div>
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Ticket Info Card */}
          <div className="ticket-info-card">
            <div className="ticket-info-header">
              <div className="ticket-icon">🎫</div>
              <div>
                <h4 className="ticket-modal-name">{ticket.festival.name}</h4>
                <p className="ticket-modal-meta">
                  Token #{ticket.tokenId} • {ticket.festival.symbol}
                </p>
              </div>
            </div>
            <div className="original-price-display">
              <span className="original-price-label">Giá mua ban đầu</span>
              <span className="original-price-value">
                {ticket.purchasePrice} FEST
              </span>
            </div>
          </div>

          {/* Warning Box - Prominent */}
          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4 className="warning-title">Quy định về giá bán</h4>
              <p className="warning-text">
                Giá bán không được vượt quá <strong>110%</strong> giá mua ban
                đầu.
                <br />
                <span className="max-price-highlight">
                  Giá tối đa: {maxPrice.toFixed(2)} FEST
                </span>
              </p>
            </div>
          </div>

          {/* Price Input */}
          <div className="input-group">
            <label className="input-label">Giá bán (FEST)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="input-field"
              placeholder={`Tối đa: ${maxPrice.toFixed(2)}`}
              step="0.01"
            />
            <p className="input-helper">Nhập giá bạn muốn bán vé này</p>
          </div>

          {/* Price Preview */}
          {price && (
            <div
              className={`price-preview ${isValidPrice ? "valid" : "invalid"}`}
            >
              {isValidPrice ? (
                <>
                  <div className="preview-icon">✅</div>
                  <div className="preview-content">
                    <div className="preview-title">Giá hợp lệ</div>
                    <div className="preview-details">
                      Tăng {priceIncrease}% so với giá gốc • Lợi nhuận:{" "}
                      {(
                        currentPrice - parseFloat(ticket.purchasePrice)
                      ).toFixed(2)}{" "}
                      FEST
                    </div>
                  </div>
                </>
              ) : currentPrice > maxPrice ? (
                <>
                  <div className="preview-icon error">❌</div>
                  <div className="preview-content">
                    <div className="preview-title error">
                      Giá vượt quá giới hạn
                    </div>
                    <div className="preview-details error">
                      Giá tối đa cho phép: {maxPrice.toFixed(2)} FEST (110%)
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="preview-icon error">❌</div>
                  <div className="preview-content">
                    <div className="preview-title error">Giá không hợp lệ</div>
                    <div className="preview-details error">
                      Giá phải lớn hơn 0
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !isValidPrice}
            className="btn-confirm"
          >
            {loading ? "Đang xử lý..." : "Niêm yết bán"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TicketQRCodeModalProps {
  ticket: Ticket;
  eventName: string | null;
  eventId: string | null;
  ownerAddress: string;
  onClose: () => void;
}

function TicketQRCodeModal({
  ticket,
  eventName,
  eventId,
  ownerAddress,
  onClose,
}: TicketQRCodeModalProps) {
  // State cho dynamic QR Code
  const [timeLeft, setTimeLeft] = useState(30);
  const [qrValue, setQrValue] = useState("");

  // Hàm tạo QR Code mới với expiresAt
  const generateNewQR = () => {
    const now = Date.now();
    const expiresAt = now + 30000; // 30 giây

    const data = {
      type: "TICKET_AUTH",
      eventId: eventId || ticket.festival.id,
      eventName: eventName || ticket.festival.name,
      tokenId: ticket.tokenId.toString(),
      nftContract: ticket.festival.nftContract,
      owner: ownerAddress.toLowerCase(),
      expiresAt: expiresAt,
      seed: Math.random(), // Đảm bảo QR thay đổi hình dạng
    };

    setQrValue(JSON.stringify(data));
    setTimeLeft(30);
  };

  // Effect để tự động làm mới QR mỗi 30 giây
  useEffect(() => {
    // Tạo QR lần đầu
    generateNewQR();

    // Countdown timer mỗi giây
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewQR(); // Hết 30s thì tạo mã mới
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    eventId,
    eventName,
    ticket.tokenId,
    ticket.festival.nftContract,
    ownerAddress,
  ]);

  return (
    <div
      className="metadata-modal-overlay"
      style={{
        backdropFilter: "blur(10px)",
        background: "rgba(0, 0, 0, 0.75)",
      }}
    >
      <div
        className="metadata-modal"
        style={{
          maxWidth: "600px",
          maxHeight: "85vh",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginTop: "5rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "1.5rem 2rem",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Animated background pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
              animation: "float 6s ease-in-out infinite",
            }}
          ></div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.transform = "scale(1.1) rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            }}
          >
            ✕
          </button>

          {/* Header content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              color: "white",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              🎫
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  margin: 0,
                  marginBottom: "0.25rem",
                  textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                }}
              >
                Vé #{ticket.tokenId}
              </h3>
              <p
                style={{
                  fontSize: "0.95rem",
                  margin: 0,
                  opacity: 0.95,
                  fontWeight: "500",
                }}
              >
                {eventName || ticket.festival.name}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "2rem",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* QR Code + Info Flex Layout */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            {/* QR Code Section */}
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "1.5rem",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "-10px",
                  right: "-10px",
                  bottom: "-10px",
                  background:
                    timeLeft <= 10
                      ? "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)"
                      : "linear-gradient(135deg, #8b5cf6, #6366f1, #ec4899)",
                  borderRadius: "1.5rem",
                  zIndex: -1,
                  opacity: 0.5,
                  filter: "blur(20px)",
                  transition: "all 0.5s ease",
                }}
              ></div>
              <QRCodeCanvas
                id="ticket-qr-code"
                value={qrValue}
                size={280}
                level="H"
                includeMargin={true}
              />

              {/* Warning overlay khi gần hết hạn */}
              {timeLeft <= 5 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "1rem",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      🔄
                    </div>
                    <span
                      style={{
                        color: "#dc2626",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      Đang làm mới...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown Timer & Progress Bar */}
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "1rem",
                padding: "1.25rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>⏱️</span>
                  <span
                    style={{
                      color: "#e2e8f0",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Mã tự động làm mới
                  </span>
                </div>
                <span
                  style={{
                    color: timeLeft <= 10 ? "#ef4444" : "#10b981",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                >
                  {timeLeft}s
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(timeLeft / 30) * 100}%`,
                    background:
                      timeLeft <= 10
                        ? "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                        : "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                    transition: "width 1s linear, background 0.3s ease",
                    borderRadius: "9999px",
                    boxShadow:
                      timeLeft <= 10
                        ? "0 0 10px rgba(239, 68, 68, 0.5)"
                        : "0 0 10px rgba(16, 185, 129, 0.5)",
                  }}
                ></div>
              </div>

              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                {timeLeft <= 10
                  ? "⚠️ QR Code sắp hết hạn và sẽ tự động làm mới"
                  : "✅ QR Code đang hoạt động"}
              </p>
            </div>

            {/* Status Badge */}
            <div
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "1.25rem 2rem",
                borderRadius: "1rem",
                boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                width: "100%",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  flexShrink: 0,
                }}
              >
                ✅
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "white",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Vé Hợp Lệ
                </div>
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "0.95rem",
                  }}
                >
                  Sẵn sàng check-in tại cổng
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "1rem",
                padding: "1.5rem",
                backdropFilter: "blur(10px)",
                width: "100%",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <InfoRow
                  icon="🎭"
                  label="Sự kiện"
                  value={eventName || ticket.festival.name}
                />
                <InfoRow
                  icon="🎟️"
                  label="Token ID"
                  value={`#${ticket.tokenId}`}
                />
                <InfoRow
                  icon="👤"
                  label="Chủ sở hữu"
                  value={shortenAddress(ownerAddress)}
                />
                <InfoRow
                  icon="📜"
                  label="NFT Contract"
                  value={shortenAddress(ticket.festival.nftContract)}
                />
              </div>
            </div>

            {/* Instructions */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "1rem",
                padding: "1.25rem",
                width: "100%",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  color: "#60a5fa",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>📱</span>
                Hướng dẫn sử dụng
              </div>
              <ol
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.9rem",
                  margin: 0,
                  paddingLeft: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <li>Mở màn hình này tại cổng check-in</li>
                <li>Nhân viên quét mã QR</li>
                <li>Hệ thống tự động xác thực trên blockchain</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer - Security Notice */}
        <div
          style={{
            padding: "1.25rem 2rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            flexShrink: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🔒</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#10b981",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                QR Code bảo mật cao
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                Mã được mã hóa và tự động làm mới mỗi 30 giây để tăng cường bảo
                mật
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "0.5rem",
        transition: "all 0.3s ease",
      }}
    >
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "0.75rem",
            marginBottom: "0.25rem",
          }}
        >
          {label}
        </div>
        <div
          style={{ color: "#e2e8f0", fontSize: "0.95rem", fontWeight: "500" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
