export function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-24 h-24 border-8 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-200"
            style={{ animationDirection: "reverse" }}
          ></div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2 animate-pulse">
          Loading Festivals...
        </h3>
        <p className="text-slate-600 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
          <span className="inline-block w-2 h-2 bg-purple-600 rounded-full animate-bounce animation-delay-200"></span>
          <span className="inline-block w-2 h-2 bg-pink-600 rounded-full animate-bounce animation-delay-4000"></span>
        </p>
      </div>
    </div>
  );
}

export function ErrorState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-8xl mb-6 animate-bounce">⚠️</div>
        <h3 className="text-3xl font-bold text-red-600 mb-4">
          Oops! Something went wrong
        </h3>
        <p className="text-slate-600 mb-8">
          We couldn't load the festivals. Please check your connection and try
          again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <span className="relative flex items-center gap-2">
            <span className="text-xl">🔄</span>
            Retry
          </span>
        </button>
      </div>
    </div>
  );
}
