import type React from "react";
import { Festival } from "@/types";

interface FestivalCardProps {
  festival: Festival;
}

export function FestivalCard({ festival }: FestivalCardProps) {
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(festival.nftContract);
  };

  const handleViewFestival = () => {
    window.location.href = `/festival/${festival.id}`;
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200">
      {/* Simple gradient header */}
      <div
        className="relative aspect-[16/9] bg-gradient-to-br from-blue-500 to-purple-600 cursor-pointer"
        onClick={handleViewFestival}
      >
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 text-center">
            {festival.name}
          </h3>

          {/* Symbol badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/30">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            {festival.symbol}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6 space-y-5">
        {/* Contract address */}
        <div>
          <p className="text-xs text-slate-600 font-medium mb-1.5">
            Contract Address
          </p>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-700 font-mono truncate flex-1">
              {festival.nftContract}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-slate-600 hover:bg-slate-200 p-1.5 rounded transition-colors"
              title="Copy address"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3">
            <div className="text-xs text-slate-500 mb-1">Total Supply</div>
            <div className="text-xl font-bold text-slate-900">
              {(festival.totalTickets || 0).toLocaleString()}
            </div>
          </div>

          <div className="text-center p-3">
            <div className="text-xs text-slate-500 mb-1">Available</div>
            <div className="text-xl font-bold text-blue-600">
              {festival.ticketsForSale}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleViewFestival}
            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            View Details
          </button>

          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
            Buy Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
