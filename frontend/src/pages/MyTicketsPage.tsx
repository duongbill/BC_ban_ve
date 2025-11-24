import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useBiconomyAccount } from "@/hooks/useBiconomyAccount";
import { useListTicketForSale } from "@/hooks/useFestivalMutations";
import { Ticket } from "@/types";
import { ipfsToHttp } from "@/services/ipfs";
import toast from "react-hot-toast";
import "../styles/my-tickets-page.css";

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

export function MyTicketsPage() {
  const { address } = useAccount();
  const { smartAccountAddress } = useBiconomyAccount();
  const [sellModalData, setSellModalData] = useState<{
    ticket: Ticket | null;
    price: string;
  }>({
    ticket: null,
    price: "",
  });
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const listTicketMutation = useListTicketForSale();

  const {
    data: tickets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myTickets", smartAccountAddress || address],
    queryFn: async () => {
      if (!smartAccountAddress && !address) return [];

      // Simulate API call to fetch user's tickets
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Filter tickets owned by the user
      return mockTickets.filter(
        (ticket) =>
          ticket.owner.toLowerCase() ===
          (smartAccountAddress || address)?.toLowerCase()
      );
    },
    enabled: !!(smartAccountAddress || address),
  });

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
      await listTicketMutation.mutateAsync({
        nftAddress: ticket.festival.nftContract,
        tokenId: ticket.tokenId,
        sellingPrice: price,
      });

      setSellModalData({ ticket: null, price: "" });
      toast.success("Ticket listed for sale successfully!");
    } catch (error) {
      console.error("Error listing ticket:", error);
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
              <span className="address-mono">
                {smartAccountAddress || address
                  ? `${(smartAccountAddress || address)?.slice(0, 6)}...${(
                      smartAccountAddress || address
                    )?.slice(-4)}`
                  : "Not connected"}
              </span>
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
          <h4 className="nav-section-title">Thông tin tài khoản</h4>
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
          </a>
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
          </a>
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
          </div>
        </div>

        {/* Tickets Display */}
        <div className="tickets-section">
          {filteredTickets && filteredTickets.length > 0 ? (
            <div className="tickets-grid">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onSell={() => setSellModalData({ ticket, price: "" })}
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
      </main>
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  onSell: () => void;
}

function TicketCard({ ticket, onSell }: TicketCardProps) {
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
            <span className="token-label">Token</span>
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
              <button className="btn-remove-sale">❌ Gỡ bán</button>
            </div>
          )}

          <button
            onClick={() => window.open(ipfsToHttp(ticket.tokenURI), "_blank")}
            className="btn-view-metadata"
          >
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Xem chi tiết
          </button>
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
