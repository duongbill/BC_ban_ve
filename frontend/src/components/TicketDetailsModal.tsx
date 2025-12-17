import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Ticket } from "@/types";
import toast from "react-hot-toast";
import { useAccount, usePublicClient } from "wagmi";
import { keccak256, toBytes } from "viem";
import { useVerifyTicket, NFT_ABI } from "@/hooks/useTicketManagement";

const ACCESS_CONTROL_ABI = [
  {
    name: "hasRole",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getVerificationTime",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const VERIFIER_ROLE = keccak256(toBytes("VERIFIER_ROLE"));

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (ticket: Ticket) => void;
  onResell: (ticket: Ticket) => void;
}

export function TicketDetailsModal({
  ticket,
  isOpen,
  onClose,
  onTransfer,
  onResell,
}: TicketDetailsModalProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const verifyMutation = useVerifyTicket();

  const [qrText, setQrText] = useState<string>("");
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(30);
  const [qrWindow, setQrWindow] = useState<number>(0);

  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationTime, setVerificationTime] = useState<bigint | null>(null);
  const [hasVerifierRole, setHasVerifierRole] = useState<boolean | null>(null);
  const [ownerOnChain, setOwnerOnChain] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  const verificationTimeText = useMemo(() => {
    if (!verificationTime || verificationTime <= 0n) return "";
    const seconds = Number(verificationTime);
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    try {
      return new Date(seconds * 1000).toLocaleString();
    } catch {
      return "";
    }
  }, [verificationTime]);

  useEffect(() => {
    if (!isOpen || !ticket) return;

    const tick = () => {
      const now = Date.now();
      const windowMs = 30_000;
      const windowIndex = Math.floor(now / windowMs);
      const windowStart = windowIndex * windowMs;
      const windowEnd = windowStart + windowMs;
      const secondsLeft = Math.max(0, Math.ceil((windowEnd - now) / 1000));

      setQrSecondsLeft(secondsLeft);
      setQrWindow(windowIndex);
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [isOpen, ticket]);

  useEffect(() => {
    if (!isOpen || !ticket) return;
    // Recompute QR payload only when the 30s window changes (or owner info updates)
    const windowMs = 30_000;
    const windowStart = qrWindow * windowMs;
    const windowEnd = windowStart + windowMs;

    const ownerForQr = (ownerOnChain || ticket.owner || "").toLowerCase();
    const payload = {
      v: 1,
      tokenId: ticket.tokenId,
      nftContract: ticket.festival.nftContract,
      owner: ownerForQr,
      eventName: ticket.festival.name,
      issuedAt: windowStart,
      expiresAt: windowEnd,
      window: qrWindow,
      ttlSeconds: 30,
    };

    // Keep the payload deterministic for a given window
    setQrText(JSON.stringify(payload));
  }, [isOpen, ticket, qrWindow, ownerOnChain]);

  useEffect(() => {
    if (!isOpen || !ticket || !qrCanvasRef.current || !qrText) return;

    QRCode.toCanvas(qrCanvasRef.current, qrText, {
      width: 200,
      margin: 2,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    });
  }, [isOpen, ticket, qrText]);

  const refreshCheckInStatus = async () => {
    if (!ticket || !publicClient) return;
    setCheckLoading(true);
    try {
      const nft = ticket.festival.nftContract as `0x${string}`;
      const tokenId = BigInt(ticket.tokenId);

      const [owner, verified, time, role] = await Promise.all([
        publicClient.readContract({
          address: nft,
          abi: NFT_ABI,
          functionName: "ownerOf",
          args: [tokenId],
        }) as Promise<string>,
        publicClient.readContract({
          address: nft,
          abi: NFT_ABI,
          functionName: "isTicketVerified",
          args: [tokenId],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: nft,
          abi: ACCESS_CONTROL_ABI,
          functionName: "getVerificationTime",
          args: [tokenId],
        }) as Promise<bigint>,
        address
          ? (publicClient.readContract({
              address: nft,
              abi: ACCESS_CONTROL_ABI,
              functionName: "hasRole",
              args: [VERIFIER_ROLE, address as `0x${string}`],
            }) as Promise<boolean>)
          : Promise.resolve(false),
      ]);

      setOwnerOnChain(owner);
      setIsVerified(verified);
      setVerificationTime(time);
      setHasVerifierRole(Boolean(role));
    } catch (err) {
      console.error(err);
      setOwnerOnChain(null);
      setIsVerified(null);
      setVerificationTime(null);
      setHasVerifierRole(null);
    } finally {
      setCheckLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !ticket) return;
    // Auto-check when opening the modal
    refreshCheckInStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    ticket?.festival?.nftContract,
    ticket?.tokenId,
    address,
    publicClient,
  ]);

  const handleVerifyTicket = async () => {
    if (!ticket) return;
    try {
      await verifyMutation.mutateAsync({
        nftAddress: ticket.festival.nftContract,
        tokenId: ticket.tokenId,
      });
      await refreshCheckInStatus();
    } catch {
      // handled in hook
    }
  };

  if (!isOpen || !ticket) return null;

  const copyQRData = () => {
    navigator.clipboard.writeText(qrText || "");
    toast.success("Đã sao chép thông tin vé!");
  };

  const downloadQR = () => {
    if (qrCanvasRef.current) {
      const url = qrCanvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `ticket-${ticket.tokenId}-qr.png`;
      link.href = url;
      link.click();
      toast.success("Đã tải xuống mã QR!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Chi Tiết Vé</h2>
              <p className="text-blue-100 text-sm">
                Token ID: #{ticket.tokenId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">
                  {ticket.festival.name}
                </h3>
                <p className="text-sm text-slate-600">
                  Symbol: {ticket.festival.symbol}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Giá Mua</p>
                <p className="text-lg font-bold text-blue-600">
                  {ticket.purchasePrice} FEST
                </p>
              </div>
              {ticket.isForSale && ticket.sellingPrice && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Đang Bán</p>
                  <p className="text-lg font-bold text-green-600">
                    {ticket.sellingPrice} FEST
                  </p>
                </div>
              )}
            </div>

            {ticket.isForSale && (
              <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Vé đang được rao bán
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>📱</span>
              Mã QR Xác Thực (30s)
            </h3>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-lg border-4 border-slate-200">
                <canvas ref={qrCanvasRef} />
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-500 max-w-xs">
                  Mã sẽ tự đổi sau mỗi 30 giây. Chỉ hợp lệ trong thời gian đếm
                  ngược.
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  Hiệu lực còn: {qrSecondsLeft}s
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={copyQRData}
                  disabled={!qrText}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  📋 Sao Chép
                </button>
                <button
                  onClick={downloadQR}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  💾 Tải Xuống
                </button>
              </div>
            </div>
          </div>

          {/* Check-in / On-chain verification */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>✅</span>
              Soát vé (On-chain)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                <p className="text-sm font-semibold text-slate-800">
                  {isVerified === null
                    ? "—"
                    : isVerified
                    ? "✅ Đã check-in"
                    : "⏳ Chưa check-in"}
                </p>
                {isVerified === true && verificationTimeText && (
                  <p className="text-xs text-slate-500 mt-2">
                    Thời gian: {verificationTimeText}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">
                  Chủ sở hữu (on-chain)
                </p>
                <p className="text-xs font-mono text-slate-800 break-all">
                  {ownerOnChain ? ownerOnChain : "—"}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Ví đang dùng</p>
                <p className="text-xs font-mono text-slate-800 break-all">
                  {address ? address : "Chưa kết nối"}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Quyền soát vé</p>
                <p className="text-sm font-semibold text-slate-800">
                  {hasVerifierRole === null
                    ? "—"
                    : hasVerifierRole
                    ? "✅ Có quyền (VERIFIER_ROLE)"
                    : "❌ Không có quyền"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={refreshCheckInStatus}
                disabled={checkLoading}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                {checkLoading ? "Đang kiểm tra..." : "🔄 Kiểm tra lại"}
              </button>

              <button
                onClick={handleVerifyTicket}
                disabled={
                  !address ||
                  hasVerifierRole !== true ||
                  isVerified !== false ||
                  verifyMutation.isPending
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {verifyMutation.isPending
                  ? "Đang xác thực..."
                  : "✅ Check-in / Xác thực"}
              </button>
            </div>

            {hasVerifierRole === false && (
              <p className="text-xs text-amber-700 mt-3">
                Ví hiện tại chưa có quyền VERIFIER_ROLE trên NFT này. Hãy cấp
                quyền cho ví soát vé.
              </p>
            )}
          </div>

          {/* Contract Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Thông Tin Hợp Đồng
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">NFT Contract:</span>
                <span className="text-slate-800 font-mono">
                  {ticket.festival.nftContract.slice(0, 10)}...
                  {ticket.festival.nftContract.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marketplace:</span>
                <span className="text-slate-800 font-mono">
                  {ticket.festival.marketplace.slice(0, 10)}...
                  {ticket.festival.marketplace.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Organiser:</span>
                <span className="text-slate-800 font-mono">
                  {ticket.festival.organiser.slice(0, 10)}...
                  {ticket.festival.organiser.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!ticket.isForSale && (
              <>
                <button
                  onClick={() => onResell(ticket)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  💰 Bán Lại Vé
                </button>
                <button
                  onClick={() => onTransfer(ticket)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  🎁 Tặng Vé
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
