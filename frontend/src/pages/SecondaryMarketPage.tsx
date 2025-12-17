import React from "react";
import { useQueries } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import toast from "react-hot-toast";
import deployedAddresses from "../../../deployedAddresses.json";
import { Ticket, Festival } from "@/types";
import { useBuySecondaryTicket } from "@/hooks/useFestivalMutations";
import { NFT_ABI } from "@/hooks/useTicketManagement";

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

      const asTicket: Ticket = {
        id: `${festival.id}-${Number(tokenId)}`,
        tokenId: Number(tokenId),
        tokenURI,
        purchasePrice: (BigInt(purchasePrice) / BigInt(10 ** 18)).toString(),
        sellingPrice: (BigInt(sellingPrice) / BigInt(10 ** 18)).toString(),
        isForSale: true,
        owner: owner.toLowerCase(),
        festival,
      };

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
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const buySecondaryMutation = useBuySecondaryTicket();

  const festivals = React.useMemo(() => getFestivalsFromDeployment(), []);

  const queries = useQueries({
    queries: festivals.map((festival) => ({
      queryKey: ["secondaryMarketTickets", festival.nftContract],
      queryFn: async () => {
        if (!publicClient) return [];
        return fetchTicketsForSale(publicClient, festival);
      },
      enabled: !!publicClient && !!festival.nftContract,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
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
    return combined;
  }, [queries]);

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

  return (
    <div className="festival-page">
      <div className="festival-page-container">
        <div className="card mb-3">
          <h2 className="card-title">Thị trường chuyển nhượng vé</h2>
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
                Hiện chưa có vé nào được niêm yết bán lại.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {allListings.map(
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
