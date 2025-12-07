import React from "react";
import {getDefaultConfig, RainbowKitProvider} from "@rainbow-me/rainbowkit";
import {WagmiProvider} from "wagmi";
import {polygon, polygonMumbai, hardhat} from "wagmi/chains";
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import "@rainbow-me/rainbowkit/styles.css";

// Override hardhat chain with explicit RPC URL for localhost
const localhostChain = {
    ...hardhat,
    rpcUrls: {
        default: {
            http: ["http://127.0.0.1:8545"],
        },
    },
};

const config = getDefaultConfig({
    appName: "Festival Marketplace 2.0",
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "dummy-project-id-for-local-dev",
    chains: [localhostChain, polygonMumbai, ...(import.meta.env.NODE_ENV === "production" ? [polygon] : [])],
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

export function Web3Provider({children}: Web3ProviderProps) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
                    {children}
                    <ReactQueryDevtools initialIsOpen={false} />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
