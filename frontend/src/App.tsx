import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "@/config/Web3Provider";
import { SearchProvider } from "@/contexts/SearchContext";
import { Navigation } from "@/components/Navigation";
import { HomePage } from "@/pages/HomePage";
import { FestivalPage } from "@/pages/FestivalPage";
import { MyTicketsPage } from "@/pages/MyTicketsPage";
import { SecondaryMarketPage } from "@/pages/SecondaryMarketPage";

function App() {
  return (
    <Web3Provider>
      <SearchProvider>
        <Router>
          <div className="min-h-screen bg-slate-950">
            <Navigation />

            <main className="pt-28 pb-16">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/festival/:id" element={<FestivalPage />} />
                <Route
                  path="/secondary-market"
                  element={<SecondaryMarketPage />}
                />
                <Route
                  path="/secondary-market/:festivalId"
                  element={<SecondaryMarketPage />}
                />
                <Route path="/my-tickets" element={<MyTicketsPage />} />
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                          404
                        </h1>
                        <p className="text-gray-600 mb-6">Page not found</p>
                        <a href="/" className="btn-primary">
                          Go Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </main>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#4ade80",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </div>
        </Router>
      </SearchProvider>
    </Web3Provider>
  );
}

export default App;
