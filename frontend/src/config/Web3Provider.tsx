import React from "react";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygon, polygonMumbai, hardhat } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "Festival Marketplace 2.0",
  projectId:
    import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ||
    "dummy-project-id-for-local-dev",
  chains: [
    hardhat,
    polygonMumbai,
    ...(import.meta.env.NODE_ENV === "production" ? [polygon] : []),
  ],
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={{
            lightMode: {
              colors: {
                accentColor: "#3b82f6",
                accentColorForeground: "white",
              },
            },
          }}
          showRecentTransactions={true}
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
