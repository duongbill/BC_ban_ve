import React from "react";
import { Festival } from "@/types";

interface StatsSectionProps {
  festivals?: Festival[];
}

export function StatsSection({ festivals }: StatsSectionProps) {
  const totalFestivals = festivals?.length || 0;
  const totalTickets =
    festivals?.reduce((sum, f) => sum + (f.totalTickets || 0), 0) || 0;
  const availableTickets =
    festivals?.reduce((sum, f) => sum + (f.ticketsForSale || 0), 0) || 0;

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-24 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Platform Statistics 📊
          </h2>
          <p className="text-blue-200 text-lg">Real-time blockchain data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Active Festivals */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center transform group-hover:scale-105 transition-all duration-500 hover:bg-white/15">
              <div className="mb-4">
                <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform duration-500">
                  🎭
                </div>
              </div>
              <div className="text-6xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                {totalFestivals}
              </div>
              <div className="text-blue-200 font-semibold text-lg tracking-wide">
                Active Festivals
              </div>
              <div className="mt-3 text-xs text-blue-300 opacity-75">
                Live on blockchain
              </div>
            </div>
          </div>

          {/* Total Tickets */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center transform group-hover:scale-105 transition-all duration-500 hover:bg-white/15">
              <div className="mb-4">
                <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform duration-500">
                  🎫
                </div>
              </div>
              <div className="text-6xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                {totalTickets.toLocaleString()}
              </div>
              <div className="text-purple-200 font-semibold text-lg tracking-wide">
                Total Tickets
              </div>
              <div className="mt-3 text-xs text-purple-300 opacity-75">
                NFTs minted
              </div>
            </div>
          </div>

          {/* Available Now */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center transform group-hover:scale-105 transition-all duration-500 hover:bg-white/15">
              <div className="mb-4">
                <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform duration-500">
                  ✨
                </div>
              </div>
              <div className="text-6xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                {availableTickets}
              </div>
              <div className="text-pink-200 font-semibold text-lg tracking-wide">
                Available Now
              </div>
              <div className="mt-3 text-xs text-pink-300 opacity-75">
                Ready to purchase
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
