import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import toast from "react-hot-toast";
import deployedAddresses from "../../../deployedAddresses.json";
import { Ticket, Festival } from "@/types";
import { useBuySecondaryTicket } from "@/hooks/useFestivalMutations";
import { NFT_ABI } from "@/hooks/useTicketManagement";
import { fetchMetadata } from "@/services/ipfs";

const DEPLOYED_FEST_TOKEN_ADDRESS =
  (deployedAddresses as any).festToken ||
  "0x0000000000000000000000000000000000000000";

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

async function fetchTicketsForSale(publicClient: any, festival: Festival) {
  const tokenIds = (await publicClient.readContract({
    address: festival.nftContract as `0x${string}`,
    abi: NFT_ABI,
    functionName: "getTicketsForSale",
    args: [],
  })) as bigint[];

  if (!tokenIds || tokenIds.length === 0) return [];

  const tickets = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const [
        tokenURI,
        purchasePrice,
        sellingPrice,
        owner,
        isGifted,
        isVerified,
        approved,
      ] = await Promise.all([
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "tokenURI",
          args: [tokenId],
        }) as Promise<string>,
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "getTicketPurchasePrice",
          args: [tokenId],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "getTicketSellingPrice",
          args: [tokenId],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "ownerOf",
          args: [tokenId],
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "isTicketGifted",
          args: [tokenId],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "isTicketVerified",
          args: [tokenId],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: festival.nftContract as `0x${string}`,
          abi: NFT_ABI,
          functionName: "getApproved",
          args: [tokenId],
        }) as Promise<`0x${string}`>,
      ]);

      const approvedForAll = (await publicClient.readContract({
        address: festival.nftContract as `0x${string}`,
        abi: NFT_ABI,
        functionName: "isApprovedForAll",
        args: [owner, festival.marketplace as `0x${string}`],
      })) as boolean;

      // Parse event metadata from tokenURI
      let eventId = festival.id || "1";
      let eventName = festival.name || "Sample Festival";
      let ticketTypeName = "Standard";

      try {
        // Fetch metadata from IPFS/localStorage
        console.log(
          "🔍 Fetching metadata for secondary ticket",
          Number(tokenId),
          "tokenURI:",
          tokenURI
        );
        const metadata = await fetchMetadata(tokenURI);
        console.log("📦 Metadata retrieved:", metadata);

        // Parse event info from description
        // Format: "...\n\nEvent: Jazz Festival Hà Nội\nEvent ID: 4\nTicket Type: VIP Jazz Lounge\n..."
        if (metadata.description) {
          console.log("📝 Description:", metadata.description);
          const eventIdMatch = metadata.description.match(/Event ID: (\d+)/);
          const eventNameMatch = metadata.description.match(/Event: ([^\n]+)/);
          const ticketTypeMatch = metadata.description.match(
            /Ticket Type: ([^\n]+)/
          );

          if (eventIdMatch && eventIdMatch[1]) {
            eventId = eventIdMatch[1];
            console.log("✅ Parsed Event ID:", eventId);
          }
          if (eventNameMatch && eventNameMatch[1]) {
            eventName = eventNameMatch[1].trim();
            console.log("✅ Parsed Event Name:", eventName);
          }
          if (ticketTypeMatch && ticketTypeMatch[1]) {
            ticketTypeName = ticketTypeMatch[1].trim();
            console.log("✅ Parsed Ticket Type:", ticketTypeName);
          }
        } else {
          console.warn("⚠️ No description in metadata");
        }

        // Also try to get from metadata.name if available
        if (metadata.name && !ticketTypeName) {
          ticketTypeName = metadata.name;
        }
      } catch (e) {
        console.warn(
          "❌ Could not fetch metadata for secondary ticket",
          Number(tokenId),
          ":",
          e
        );
      }

      console.log("🎫 Final ticket info:", {
        eventId,
        eventName,
        ticketTypeName,
        tokenId: Number(tokenId),
      });

      const asTicket: Ticket = {
        id: `${eventId}-${Number(tokenId)}`,
        tokenId: Number(tokenId),
        tokenURI,
        purchasePrice: (BigInt(purchasePrice) / BigInt(10 ** 18)).toString(),
        sellingPrice: (BigInt(sellingPrice) / BigInt(10 ** 18)).toString(),
        isForSale: true,
        owner: owner.toLowerCase(),
        festival: {
          ...festival,
          id: eventId,
          name: eventName,
          symbol: eventId === "1" ? festival.symbol : `EVENT${eventId}`,
        },
        ticketTypeName, // Add ticket type name to ticket object
      } as any;

      const isMarketplaceApproved =
        approved?.toLowerCase?.() === festival.marketplace.toLowerCase() ||
        approvedForAll;

      return {
        ticket: asTicket,
        isGifted,
        isVerified,
        isMarketplaceApproved,
      };
    })
  );

  return tickets;
}

function SecondaryTicketCard({
  ticket,
  onBuy,
  loading,
  isOwnTicket,
  isMarketplaceApproved,
  isVerified,
}: {
  ticket: Ticket;
  onBuy: () => void;
  loading: boolean;
  isOwnTicket: boolean;
  isMarketplaceApproved: boolean;
  isVerified: boolean;
}) {
  const disabledReason = isOwnTicket
    ? "Vé của bạn (không thể mua)"
    : isVerified
    ? "Vé đã được sử dụng"
    : !isMarketplaceApproved
    ? "Seller chưa approve marketplace"
    : null;

  const isDisabled = loading || !!disabledReason;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Ticket Type Badge */}
      {(ticket as any).ticketTypeName && (
        <div
          style={{
            marginBottom: "10px",
            padding: "8px 12px",
            background:
              "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.3)",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#a78bfa",
            textAlign: "center",
          }}
        >
          🎫 {(ticket as any).ticketTypeName}
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "14px",
            color: "#b0b0b0",
            marginBottom: "6px",
          }}
        >
          {ticket.festival.name} • {ticket.festival.symbol}
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>
          Vé #{ticket.tokenId}
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#888" }}>Giá gốc:</span>
          <span style={{ fontSize: "13px", color: "#b0b0b0" }}>
            {ticket.purchasePrice} FEST
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#888" }}>Giá bán:</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#6366f1" }}>
            {ticket.sellingPrice} FEST
          </span>
        </div>
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginBottom: "12px",
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}
      >
        Chủ sở hữu: {ticket.owner.slice(0, 6)}...{ticket.owner.slice(-4)}
      </div>

      <button
        onClick={onBuy}
        disabled={isDisabled}
        className="btn-primary"
        style={{ width: "100%", opacity: isDisabled ? 0.6 : 1 }}
      >
        {loading
          ? "Đang mua..."
          : disabledReason
          ? disabledReason
          : `Mua với ${ticket.sellingPrice} FEST`}
      </button>

      {!isVerified && !isOwnTicket && !isMarketplaceApproved && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#888" }}>
          Vé này đang được niêm yết nhưng seller chưa approve marketplace nên
          mua sẽ bị lỗi. Seller chỉ cần niêm yết lại từ “Vé của tôi”.
        </div>
      )}
    </div>
  );
}

export function SecondaryMarketPage() {
  const { festivalId } = useParams<{ festivalId?: string }>();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const buySecondaryMutation = useBuySecondaryTicket();
  const queryClient = useQueryClient();

  const festivals = React.useMemo(() => getFestivalsFromDeployment(), []);

  // Force refetch all data when component mounts
  useEffect(() => {
    // Invalidate all secondary market queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ["secondaryMarketTickets"] });
  }, [queryClient]);

  // Query ALL festivals to get all tickets
  const queries = useQueries({
    queries: festivals.map((festival) => ({
      queryKey: ["secondaryMarketTickets", festival.nftContract],
      queryFn: async () => {
        if (!publicClient) return [];
        return fetchTicketsForSale(publicClient, festival);
      },
      enabled: !!publicClient && !!festival.nftContract,
      refetchOnMount: "always",
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const allListings = React.useMemo(() => {
    const combined: Array<{
      ticket: Ticket;
      isMarketplaceApproved: boolean;
      isVerified: boolean;
    }> = [];
    for (const q of queries) {
      const data = (q.data || []) as Array<{
        ticket: Ticket;
        isMarketplaceApproved: boolean;
        isVerified: boolean;
      }>;
      combined.push(
        ...data.map((x) => ({
          ticket: x.ticket,
          isMarketplaceApproved: !!x.isMarketplaceApproved,
          isVerified: !!x.isVerified,
        }))
      );
    }

    // Filter by festivalId if provided
    if (festivalId) {
      console.log("🔍 Filtering tickets for festival ID:", festivalId);
      const filtered = combined.filter((item) => {
        const ticketEventId = item.ticket.festival?.id;
        const matches = ticketEventId === festivalId;
        console.log(
          `Ticket #${item.ticket.tokenId}: eventId=${ticketEventId}, matches=${matches}`
        );
        return matches;
      });
      console.log(
        `✅ Filtered ${filtered.length} tickets from ${combined.length} total`
      );
      return filtered;
    }

    return combined;
  }, [queries, festivalId]);

  const handleBuy = async (ticket: Ticket) => {
    if (!address) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    if (!ticket.sellingPrice) return;

    try {
      await buySecondaryMutation.mutateAsync({
        nftAddress: ticket.festival.nftContract,
        marketplaceAddress: ticket.festival.marketplace,
        tokenAddress: DEPLOYED_FEST_TOKEN_ADDRESS,
        ticketId: ticket.tokenId,
        price: ticket.sellingPrice,
      });
    } catch (e) {
      // handled by mutation
    }
  };

  // Filter and search states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedEventFilter, setSelectedEventFilter] =
    React.useState<string>("all");
  const [priceRange, setPriceRange] = React.useState<{
    min: string;
    max: string;
  }>({ min: "", max: "" });
  const [sortBy, setSortBy] = React.useState<
    "price-asc" | "price-desc" | "newest"
  >("newest");

  // Debug: Log state changes
  React.useEffect(() => {
    console.log("🔄 Filter state updated:", {
      searchQuery,
      selectedEventFilter,
      priceRange,
      sortBy,
    });
  }, [searchQuery, selectedEventFilter, priceRange, sortBy]);

  // Get unique events from all tickets
  const uniqueEvents = React.useMemo(() => {
    const eventMap = new Map<string, string>();
    allListings.forEach((item) => {
      const eventId = item.ticket.festival?.id;
      const eventName = item.ticket.festival?.name;
      if (eventId && eventName && !eventMap.has(eventId)) {
        eventMap.set(eventId, eventName);
      }
    });
    return Array.from(eventMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allListings]);

  // Apply filters and search
  const filteredAndSortedListings = React.useMemo(() => {
    let filtered = [...allListings];

    console.log("🔍 Applying filters:", {
      searchQuery,
      selectedEventFilter,
      priceRange,
      sortBy,
      totalTickets: filtered.length,
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      console.log("🔎 Search query:", query);

      filtered = filtered.filter((item) => {
        const eventName = item.ticket.festival?.name?.toLowerCase() || "";
        const ticketType =
          (item.ticket as any).ticketTypeName?.toLowerCase() || "";
        const tokenId = item.ticket.tokenId.toString();

        const matches =
          eventName.includes(query) ||
          ticketType.includes(query) ||
          tokenId.includes(query);

        console.log(`Ticket #${item.ticket.tokenId}:`, {
          eventName,
          ticketType,
          tokenId,
          matches,
        });

        return matches;
      });

      console.log("✅ After search filter:", filtered.length, "tickets");
    }

    // Event filter
    if (selectedEventFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.ticket.festival?.id === selectedEventFilter
      );
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(
        (item) =>
          parseFloat(item.ticket.sellingPrice || "0") >=
          parseFloat(priceRange.min)
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(
        (item) =>
          parseFloat(item.ticket.sellingPrice || "0") <=
          parseFloat(priceRange.max)
      );
    }

    // Sort
    if (sortBy === "price-asc") {
      filtered.sort(
        (a, b) =>
          parseFloat(a.ticket.sellingPrice || "0") -
          parseFloat(b.ticket.sellingPrice || "0")
      );
    } else if (sortBy === "price-desc") {
      filtered.sort(
        (a, b) =>
          parseFloat(b.ticket.sellingPrice || "0") -
          parseFloat(a.ticket.sellingPrice || "0")
      );
    }

    return filtered;
  }, [allListings, searchQuery, selectedEventFilter, priceRange, sortBy]);

  // Get festival name for display
  const displayFestivalName = React.useMemo(() => {
    if (!festivalId || allListings.length === 0) return null;
    // Get festival name from first ticket
    return allListings[0]?.ticket?.festival?.name || null;
  }, [festivalId, allListings]);

  return (
    <div className="festival-page">
      <div className="festival-page-container">
        <div className="card mb-3">
          <h2 className="card-title">
            {festivalId && displayFestivalName
              ? `Vé bán lại - ${displayFestivalName}`
              : festivalId
              ? `Vé bán lại - Sự kiện #${festivalId}`
              : "Thị trường chuyển nhượng vé"}
          </h2>

          {/* Filter Section - Only show when not filtered by festivalId */}
          {!festivalId && allListings.length > 0 && (
            <div
              style={{
                marginBottom: "24px",
                padding: "20px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Search Bar */}
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm theo tên sự kiện, loại vé hoặc số vé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Filters Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* Event Filter */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "#888",
                    }}
                  >
                    Sự kiện
                  </label>
                  <select
                    value={selectedEventFilter}
                    onChange={(e) => setSelectedEventFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">Tất cả sự kiện</option>
                    {uniqueEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "#888",
                    }}
                  >
                    Giá từ (FEST)
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, min: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "#888",
                    }}
                  >
                    Giá đến (FEST)
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, max: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "#888",
                    }}
                  >
                    Sắp xếp
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá thấp → cao</option>
                    <option value="price-desc">Giá cao → thấp</option>
                  </select>
                </div>
              </div>

              {/* Results Count & Clear Button */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", color: "#888" }}>
                  Hiển thị {filteredAndSortedListings.length} /{" "}
                  {allListings.length} vé
                </span>
                {(searchQuery ||
                  selectedEventFilter !== "all" ||
                  priceRange.min ||
                  priceRange.max) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedEventFilter("all");
                      setPriceRange({ min: "", max: "" });
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "6px",
                      color: "#ef4444",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="card-content">
            {festivals.length === 0 ? (
              <div style={{ padding: "12px 0", color: "#888" }}>
                Chưa có festival nào trong deployedAddresses.json.
              </div>
            ) : isLoading ? (
              <div style={{ padding: "12px 0", color: "#888" }}>
                Đang tải danh sách vé đang bán...
              </div>
            ) : isError ? (
              <div style={{ padding: "12px 0", color: "#888" }}>
                Không thể tải vé bán lại. Hãy kiểm tra Hardhat node và địa chỉ
                contracts.
              </div>
            ) : allListings.length === 0 ? (
              <div style={{ padding: "12px 0", color: "#888" }}>
                {festivalId
                  ? `Hiện chưa có vé bán lại nào cho sự kiện này.`
                  : "Hiện chưa có vé nào được niêm yết bán lại."}
              </div>
            ) : filteredAndSortedListings.length === 0 ? (
              <div
                style={{
                  padding: "16px 0",
                  color: "#888",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#e0e0e0",
                  }}
                >
                  Không tìm thấy vé
                </div>
                <div style={{ fontSize: "14px" }}>
                  Không có vé nào phù hợp với bộ lọc của bạn
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {filteredAndSortedListings.map(
                  ({ ticket, isMarketplaceApproved, isVerified }) => {
                    const isOwnTicket =
                      !!address && ticket.owner === address.toLowerCase();

                    return (
                      <SecondaryTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        loading={buySecondaryMutation.isPending}
                        isOwnTicket={isOwnTicket}
                        isMarketplaceApproved={isMarketplaceApproved}
                        isVerified={isVerified}
                        onBuy={() => handleBuy(ticket)}
                      />
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
