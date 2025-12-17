export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 min-h-[600px]">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 rounded-full mb-8 animate-fade-in-down">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-white text-sm font-semibold">
              Powered by Blockchain Technology
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 animate-fade-in leading-tight">
            Festival Marketplace 2.0
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-blue-100 mb-12 max-w-2xl mx-auto animate-fade-in-up leading-relaxed">
            Discover, buy, and trade festival tickets with secure blockchain
            technology. Your tickets are NFTs - truly yours.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-200">
            <button className="group bg-white text-blue-700 font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95">
              <span className="flex items-center gap-2">
                Create Festival
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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

            <button className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-xl transition-all duration-200">
              Learn More
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Secure</h3>
              <p className="text-blue-200 text-sm">
                Blockchain-powered security for your tickets
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Fast</h3>
              <p className="text-blue-200 text-sm">
                Instant transfers and gasless transactions
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-pink-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Unique NFTs</h3>
              <p className="text-blue-200 text-sm">
                Each ticket is a unique NFT collectible
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Separator */}
      <div className="absolute bottom-0 w-full">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="rgb(248 250 252)"
          />
        </svg>
      </div>
    </div>
  );
}
