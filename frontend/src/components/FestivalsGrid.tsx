import { Festival } from "@/types";
import { FestivalCard } from "./FestivalCard";

interface FestivalsGridProps {
  festivals?: Festival[];
  isLoading?: boolean;
}

export function FestivalsGrid({ festivals, isLoading }: FestivalsGridProps) {
  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-slate-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-slate-200 rounded-2xl"></div>
                    <div className="h-20 bg-slate-200 rounded-2xl"></div>
                  </div>
                  <div className="h-12 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Featured Festivals
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Explore upcoming festivals and secure your tickets with blockchain
            technology.
          </p>
        </div>

        {/* Festivals Grid */}
        {festivals && festivals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {festivals.map((festival) => (
              <FestivalCard key={festival.id} festival={festival} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl shadow-2xl p-16 text-center border border-slate-200 max-w-2xl mx-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-6xl">🎪</span>
          </div>
        </div>
      </div>
      <div className="mt-16">
        <h3 className="text-4xl font-black text-slate-900 mb-4">
          No Festivals Yet
        </h3>
        <p className="text-xl text-slate-600 mb-8 max-w-md mx-auto">
          Be the pioneer! Create the first festival and start your blockchain
          ticketing journey.
        </p>
        <button className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <span className="relative flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Create the First Festival
          </span>
        </button>
      </div>
    </div>
  );
}
