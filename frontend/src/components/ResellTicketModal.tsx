import React, { useState, useEffect } from "react";
import { Ticket } from "@/types";
import { parseEther, formatEther } from "viem";
import toast from "react-hot-toast";

interface ResellTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tokenId: number, price: string) => Promise<void>;
  isLoading?: boolean;
}

export function ResellTicketModal({
  ticket,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ResellTicketModalProps) {
  const [price, setPrice] = useState("");
  const [priceHistory, setPriceHistory] = useState<
    { price: string; timestamp: number }[]
  >([]);

  useEffect(() => {
    if (ticket && isOpen) {
      // Mock price history - in real app fetch from blockchain events
      setPriceHistory([
        {
          price: ticket.purchasePrice,
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
      ]);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const purchasePrice = parseFloat(ticket.purchasePrice);
  const maxPrice = purchasePrice * 1.1;
  const currentPrice = price ? parseFloat(price) : 0;
  const profit = currentPrice - purchasePrice;
  const isValidPrice = currentPrice > 0 && currentPrice <= maxPrice;
  const exceedsLimit = currentPrice > maxPrice;

  const handleConfirm = async () => {
    if (!isValidPrice) {
      toast.error("Vui lòng nhập giá hợp lệ!");
      return;
    }

    try {
      await onConfirm(ticket.tokenId, price);
      setPrice("");
      onClose();
    } catch (error) {
      console.error("Resell error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">💰 Bán Lại Vé</h2>
              <p className="text-green-100 text-sm">
                {ticket.festival.name} • Token #{ticket.tokenId}
              </p>
            </div>
            <button
              onClick={onClose}
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
        <div className="p-6 space-y-6">
          {/* Purchase Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Giá Mua Gốc</span>
              <span className="text-lg font-bold text-blue-600">
                {ticket.purchasePrice} FEST
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Giá Tối Đa (110%)</span>
              <span className="text-lg font-bold text-orange-600">
                {maxPrice.toFixed(2)} FEST
              </span>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Giá Bán (FEST tokens)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={maxPrice}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={`Tối đa ${maxPrice.toFixed(2)} FEST`}
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-20 border-2 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                  exceedsLimit
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50"
                    : currentPrice > 0
                    ? "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                FEST
              </div>
            </div>
          </div>

          {/* Price Indicator */}
          {currentPrice > 0 && (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    exceedsLimit
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : "bg-gradient-to-r from-green-500 to-emerald-600"
                  }`}
                  style={{
                    width: `${Math.min((currentPrice / maxPrice) * 100, 100)}%`,
                  }}
                />
              </div>

              {/* Warnings & Info */}
              {exceedsLimit && (
                <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-red-800 font-semibold mb-1">
                        Vượt Giới Hạn 110%
                      </p>
                      <p className="text-red-700 text-sm">
                        Giá bán không được vượt quá {maxPrice.toFixed(2)} FEST
                        (110% giá gốc) theo quy định của hợp đồng.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!exceedsLimit && currentPrice > 0 && (
                <div
                  className={`rounded-xl p-4 ${
                    profit >= 0
                      ? "bg-green-100 border-2 border-green-300"
                      : "bg-orange-100 border-2 border-orange-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      {profit >= 0 ? "Lợi Nhuận" : "Lỗ"}
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        profit >= 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {profit.toFixed(2)} FEST
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {((profit / purchasePrice) * 100).toFixed(1)}% so với giá
                    mua
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price History */}
          {priceHistory.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>📊</span>
                Lịch Sử Giá
              </h4>
              <div className="space-y-2">
                {priceHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-600">
                      {index === 0 ? "Mua lần đầu" : "Bán lần " + index}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {entry.price} FEST
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(entry.timestamp).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fee Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              💡 Phí Giao Dịch
            </h4>
            <div className="text-sm text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Phí marketplace (10%):</span>
                <span className="font-medium">
                  {(currentPrice * 0.1).toFixed(2)} FEST
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí organiser (5%):</span>
                <span className="font-medium">
                  {(currentPrice * 0.05).toFixed(2)} FEST
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-semibold">Bạn nhận được:</span>
                <span className="font-bold text-green-600">
                  {(currentPrice * 0.85).toFixed(2)} FEST
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValidPrice || isLoading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang Xử Lý...</span>
                </div>
              ) : (
                "Xác Nhận Bán"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
