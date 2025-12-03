import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useBuyTicket,
  useBuySecondaryTicket,
} from "@/hooks/useFestivalMutations";
import { uploadMetadata } from "@/services/ipfs";
import { Festival, Ticket } from "@/types";
import toast from "react-hot-toast";
import "../styles/festival-page.css";

// Mock data - in real app this would fetch from blockchain
// Use deployed contract addresses from environment variables for localhost testing
const DEPLOYED_NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";
const DEPLOYED_MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || "0x0000000000000000000000000000000000000000";
const DEPLOYED_ORGANISER_ADDRESS = import.meta.env.VITE_ORGANISER_ADDRESS || "0x0000000000000000000000000000000000000000";

const mockFestival: Festival = {
  id: "1",
  name: "Đêm Nhạc Sài Gòn 2025",
  symbol: "SGM",
  nftContract: DEPLOYED_NFT_ADDRESS,
  marketplace: DEPLOYED_MARKETPLACE_ADDRESS,
  organiser: DEPLOYED_ORGANISER_ADDRESS,
  totalTickets: 1000,
  ticketsForSale: 250,
};

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

export function FestivalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBuyModal, setShowBuyModal] = useState(false);
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
      return mockFestival;
    },
  });

  const { data: secondaryTickets } = useQuery({
    queryKey: ["secondaryTickets", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockSecondaryTickets;
    },
  });

  const handleBuyPrimaryTicket = async () => {
    if (
      !festival ||
      !ticketData.name ||
      !ticketData.description ||
      !ticketData.price ||
      !ticketData.image
    ) {
      toast.error("Please fill all fields and select an image");
      return;
    }

    try {
      const result = await buyTicketMutation.mutateAsync({
        nftAddress: festival.nftContract,
        marketplaceAddress: festival.marketplace,
        tokenAddress: import.meta.env.VITE_FEST_TOKEN_ADDRESS,
        price: ticketData.price,
        ticketData: {
          name: ticketData.name,
          description: ticketData.description,
          image: ticketData.image,
        },
      });
      console.log("Ticket purchased:", result);
      setShowBuyModal(false);
      setTicketData({ name: "", description: "", price: "", image: null }); 
      
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
        tokenAddress: import.meta.env.VITE_FEST_TOKEN_ADDRESS,
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
          src="/trai.png"
          alt={festival.name}
          className="festival-hero-image"
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
              📍 Khu đô thị Vạn Phúc, TP. HCM • 📅 27.12.2025
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
                  Đêm Nhạc Sài Gòn 2025 - Cùng hoà mình vào không gian âm nhạc
                  sôi động với dàn nghệ sĩ hàng đầu Việt Nam. Một đêm nhạc đáng
                  nhớ với âm thanh, ánh sáng và hiệu ứng sân khấu hoành tráng
                  nhất.
                </p>
                <p style={{ marginBottom: "16px" }}>
                  ✨ Dàn line-up nghệ sĩ khủng
                  <br />
                  🎵 Hệ thống âm thanh, ánh sáng đẳng cấp quốc tế
                  <br />
                  🍔 Khu ẩm thực phong phú
                  <br />
                  🎁 Nhiều hoạt động minigame hấp dẫn
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

              {/* Primary Tickets */}
              <div style={{ marginBottom: "24px" }}>
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
                    <span style={{ fontWeight: "600", color: "#fff" }}>
                      VIP Pass
                    </span>
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
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="btn-primary"
                    style={{ width: "100%" }}
                  >
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
                    <span style={{ fontWeight: "600", color: "#fff" }}>
                      Standard
                    </span>
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
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="btn-primary"
                    style={{ width: "100%" }}
                  >
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

        {/* Secondary Market Section */}
        <div className="mt-4">
          <h2
            className="card-title"
            style={{ fontSize: "32px", marginBottom: "24px" }}
          >
            Thị trường vé thứ cấp
          </h2>

          {secondaryTickets && secondaryTickets.length > 0 ? (
            <div className="grid-3-cols">
              {secondaryTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onBuy={() => handleBuySecondaryTicket(ticket)}
                  loading={buySecondaryMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center" style={{ padding: "60px 40px" }}>
              <div
                style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}
              >
                🎫
              </div>
              <p
                style={{
                  color: "#888",
                  marginBottom: "24px",
                  fontSize: "16px",
                }}
              >
                Chưa có vé nào trên thị trường thứ cấp
              </p>
              <button
                onClick={() => setShowBuyModal(true)}
                className="btn-primary"
              >
                Mua vé sơ cấp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Buy Ticket Modal */}
      {showBuyModal && (
        <BuyTicketModal
          onClose={() => setShowBuyModal(false)}
          ticketData={ticketData}
          onDataChange={setTicketData}
          onBuy={handleBuyPrimaryTicket}
          loading={buyTicketMutation.isPending}
        />
      )}
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  onBuy: () => void;
  loading: boolean;
}

function TicketCard({ ticket, onBuy, loading }: TicketCardProps) {
  const priceIncrease = (
    ((parseFloat(ticket.sellingPrice) - parseFloat(ticket.purchasePrice)) /
      parseFloat(ticket.purchasePrice)) *
    100
  ).toFixed(1);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
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
        disabled={loading}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {loading ? "Đang mua..." : `Mua với ${ticket.sellingPrice} FEST`}
      </button>
    </div>
  );
}

interface BuyTicketModalProps {
  onClose: () => void;
  ticketData: {
    name: string;
    description: string;
    price: string;
    image: File | null;
  };
  onDataChange: (data: any) => void;
  onBuy: () => void;
  loading: boolean;
}

function BuyTicketModal({
  onClose,
  ticketData,
  onDataChange,
  onBuy,
  loading,
}: BuyTicketModalProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDataChange({ ...ticketData, image: file });
    }
  };

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
              <h3 className="modal-title">Mua vé sơ cấp</h3>
              <p className="modal-description">
                Điền thông tin vé của bạn để tiếp tục
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
          <div className="input-group">
            <label className="input-label input-label-required">Tên vé</label>
            <input
              type="text"
              value={ticketData.name}
              onChange={(e) =>
                onDataChange({ ...ticketData, name: e.target.value })
              }
              className="input-field"
              placeholder="VD: VIP Access, Standard..."
            />
          </div>

          <div className="input-group">
            <label className="input-label input-label-required">Mô tả</label>
            <textarea
              value={ticketData.description}
              onChange={(e) =>
                onDataChange({ ...ticketData, description: e.target.value })
              }
              className="input-field"
              placeholder="Mô tả về vé của bạn..."
            />
          </div>

          <div className="input-group">
            <label className="input-label input-label-required">
              Giá (FEST)
            </label>
            <input
              type="number"
              value={ticketData.price}
              onChange={(e) =>
                onDataChange({ ...ticketData, price: e.target.value })
              }
              className="input-field"
              placeholder="50"
            />
            <p className="input-helper">Nhập giá vé bằng token FEST</p>
          </div>

          <div className="input-group">
            <label className="input-label input-label-required">
              Hình ảnh vé
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-field"
              style={{ padding: "8px 12px" }}
            />
            <p className="input-helper">
              Chọn hình ảnh đại diện cho vé (JPG, PNG)
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-outline">
            Hủy
          </button>
          <button onClick={onBuy} disabled={loading} className="btn-primary">
            {loading ? "Đang xử lý..." : "Mua vé"}
          </button>
        </div>
      </div>
    </div>
  );
}
