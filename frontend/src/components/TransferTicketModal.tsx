import React, { useState } from "react";
import { Ticket } from "@/types";
import { isAddress } from "viem";
import toast from "react-hot-toast";

interface TransferTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tokenId: number, toAddress: string) => Promise<void>;
  isLoading?: boolean;
  estimatedGas?: string;
}

export function TransferTicketModal({
  ticket,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  estimatedGas = "0.001",
}: TransferTicketModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen || !ticket) return null;

  const isValidAddress = recipientAddress && isAddress(recipientAddress);
  const isSameAsOwner =
    isValidAddress &&
    recipientAddress.toLowerCase() === ticket.owner.toLowerCase();

  const handleNext = () => {
    if (!isValidAddress) {
      toast.error("Địa chỉ ví không hợp lệ!");
      return;
    }
    if (isSameAsOwner) {
      toast.error("Không thể chuyển cho chính mình!");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(ticket.tokenId, recipientAddress);
      setRecipientAddress("");
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setShowConfirmation(false);
      setRecipientAddress("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                🎁 {showConfirmation ? "Xác Nhận" : "Tặng Vé"}
              </h2>
              <p className="text-blue-100 text-sm">
                {ticket.festival.name} • Token #{ticket.tokenId}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
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
        <div className="p-6">
          {!showConfirmation ? (
            // Step 1: Enter Address
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎵</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">
                      {ticket.festival.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Giá mua: {ticket.purchasePrice} FEST
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-900 font-semibold mb-1">
                      Lưu Ý Quan Trọng
                    </p>
                    <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
                      <li>Giao dịch này KHÔNG THỂ hoàn tác</li>
                      <li>Vé sẽ thuộc về địa chỉ người nhận</li>
                      <li>Bạn sẽ mất quyền sở hữu vé</li>
                      <li>Không có phí giao dịch marketplace</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Address Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Địa Chỉ Ví Người Nhận
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border-2 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    recipientAddress
                      ? isValidAddress
                        ? isSameAsOwner
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50"
                          : "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50"
                        : "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                />
                {recipientAddress && !isValidAddress && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Địa chỉ ví không hợp lệ
                  </p>
                )}
                {isSameAsOwner && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Không thể chuyển cho chính mình
                  </p>
                )}
                {isValidAddress && !isSameAsOwner && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Địa chỉ hợp lệ
                  </p>
                )}
              </div>

              {/* Gas Estimate */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span>⛽</span>
                  Phí Gas Ước Tính
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">
                    Network: Hardhat (local)
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    ~{estimatedGas} ETH
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Phí thực tế phụ thuộc vào tình trạng mạng
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isValidAddress || isSameAsOwner || isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp Theo →
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Confirmation
            <div className="space-y-6">
              {/* Confirmation Message */}
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <span className="text-4xl">🎁</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Xác Nhận Chuyển Vé
                </h3>
                <p className="text-slate-600">
                  Vui lòng kiểm tra kỹ thông tin trước khi xác nhận
                </p>
              </div>

              {/* Transfer Details */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Vé Chuyển</p>
                  <p className="font-semibold text-slate-800">
                    {ticket.festival.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Token ID: #{ticket.tokenId}
                  </p>
                </div>

                <div className="border-t border-slate-300 pt-4">
                  <p className="text-xs text-slate-500 mb-1">Từ (Bạn)</p>
                  <p className="font-mono text-sm text-slate-800 break-all">
                    {ticket.owner}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="text-blue-500 text-2xl">↓</div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Đến (Người Nhận)</p>
                  <p className="font-mono text-sm text-green-600 break-all font-semibold">
                    {recipientAddress}
                  </p>
                </div>

                <div className="border-t border-slate-300 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Phí Gas</span>
                    <span className="text-sm font-semibold text-slate-800">
                      ~{estimatedGas} ETH
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Warning */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-semibold">
                    Hành động này không thể hoàn tác!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  ← Quay Lại
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Chuyển...</span>
                    </div>
                  ) : (
                    "Xác Nhận Chuyển"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
