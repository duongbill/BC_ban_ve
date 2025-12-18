import React from "react";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygon, polygonMumbai, hardhat } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@rainbow-me/rainbowkit/styles.css";

// Custom Vietnamese locale
const viLocale = {
  account: {
    disconnect: "Ngắt kết nối",
  },
  chain: {
    disconnect: "Ngắt kết nối",
    mismatch: {
      description: "Vui lòng chuyển sang {{chainName}} để tiếp tục.",
      title: "Sai mạng lưới",
    },
    switchNetwork: "Chuyển mạng",
    unknown: "Mạng không xác định",
    unsupported: "Mạng không hỗ trợ",
  },
  connect: {
    actionButton: {
      label: "Kết nối ví",
    },
    connectingWallet: {
      description: "Đang kết nối...",
      failedToConnect: "Không thể kết nối, vui lòng thử lại",
      heading: "Đang kết nối",
      tryAgain: "Thử lại",
    },
    downloadWallet: {
      description: "Tải ứng dụng {{wallet}} để tiếp tục",
      title: "Tải {{wallet}}",
    },
    getWallet: {
      label: "Tải {{wallet}}",
    },
    learnMore: {
      label: "Tìm hiểu thêm",
    },
    lookingForWallet: {
      title: "Tìm kiếm ví của bạn?",
    },
    onboardingScreen: {
      actionButton: {
        label: "Bắt đầu",
      },
      description: "Ví tiền điện tử giúp bạn quản lý tiền và NFT",
      heading: "Bắt đầu với ví",
    },
    recent: {
      title: "Đã kết nối gần đây",
    },
    scanScreen: {
      compact: {
        description: "Mở ứng dụng {{wallet}} và quét",
      },
      description: "Quét mã QR với ứng dụng {{wallet}}",
      heading: "Quét với điện thoại",
      instructions: {
        step1: {
          description: "Mở ứng dụng {{wallet}} hoặc thêm một ví mới",
          title: "Mở ứng dụng",
        },
        step2: {
          description: "Tạo hoặc nhập ví hiện có",
          title: "Tạo hoặc nhập ví",
        },
        step3: {
          description: "Chạm vào biểu tượng quét ở góc trên bên phải",
          title: "Chạm vào biểu tượng quét",
        },
      },
    },
    showOptions: {
      label: "Hiển thị tùy chọn",
    },
    title: "Kết nối ví",
    walletNotFound: {
      compact: {
        description: "{{wallet}} chưa được cài đặt",
      },
      description: "Vui lòng cài đặt {{wallet}} để tiếp tục",
      title: "Không tìm thấy {{wallet}}",
    },
  },
  profile: {
    balance: {
      title: "Số dư",
    },
    copy: {
      label: "Sao chép địa chỉ",
      successMessage: "Đã sao chép địa chỉ",
    },
    disconnect: {
      label: "Ngắt kết nối",
    },
    transactions: {
      clearAll: "Xóa tất cả",
      description: "Lịch sử giao dịch sẽ hiển thị ở đây",
      none: "Chưa có giao dịch nào",
      title: "Giao dịch",
    },
  },
  wallet: {
    connect: "Kết nối",
  },
};

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
  projectId:
    import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ||
    "dummy-project-id-for-local-dev",
  chains: [
    localhostChain,
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
          showRecentTransactions={true}
          locale={viLocale as any}
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
