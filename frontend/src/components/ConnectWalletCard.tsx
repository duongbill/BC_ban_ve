import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEventSignature } from "@/hooks/useEventSignature";
import { useReadContract } from "wagmi";
import deployedAddresses from "../../../deployedAddresses.json";
import "../styles/portal.css";

interface ConnectWalletCardProps {
  eventData?: {
    eventName: string;
    eventDate: number;
    location: string;
    eventId: string;
    nftContract: string;
  };
  onEventConnected?: () => void;
}

// FEST Token ABI for balance check
const FEST_TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function ConnectWalletCard({
  eventData,
  onEventConnected,
}: ConnectWalletCardProps = {}) {
  const signEventConnection = useEventSignature();

  const handleConnect = async (address: string) => {
    if (eventData && address) {
      try {
        await signEventConnection.mutateAsync({
          ...eventData,
          userAddress: address,
          timestamp: Date.now(),
        });
        onEventConnected?.();
      } catch (error) {
        console.error("Failed to sign event connection:", error);
      }
    }
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={async () => {
                      await openConnectModal();
                      // After wallet is connected, sign event connection if event data provided
                      if (eventData && account?.address) {
                        await handleConnect(account.address);
                      }
                    }}
                    type="button"
                    className="portal-card gradient-pink"
                    style={{ width: "100%", cursor: "pointer" }}
                  >
                    <div className="portal-card-content">
                      <h3 className="portal-card-title">
                        {eventData
                          ? `KẾT NỐI VÀO ${eventData.eventName}`
                          : "KẾT NỐI VÍ"}
                      </h3>
                      <p className="portal-card-desc">
                        {eventData
                          ? `Ký xác nhận để tham gia sự kiện tại ${eventData.location}`
                          : "Kết nối ví Web3 của bạn"}
                      </p>
                    </div>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="portal-card gradient-orange"
                    style={{ width: "100%", cursor: "pointer" }}
                  >
                    <div className="portal-card-content">
                      <h3 className="portal-card-title">SAI MẠNG</h3>
                      <p className="portal-card-desc">
                        Vui lòng chuyển sang mạng đúng
                      </p>
                    </div>
                  </button>
                );
              }

              // Fetch FEST token balance
              const { data: festBalance } = useReadContract({
                address: deployedAddresses.festToken as `0x${string}`,
                abi: FEST_TOKEN_ABI,
                functionName: "balanceOf",
                args: [account.address as `0x${string}`],
              });

              const festBalanceFormatted = festBalance
                ? (Number(festBalance) / 1e18).toFixed(2)
                : "0";

              return (
                <div
                  className="portal-card gradient-blue"
                  style={{ width: "100%" }}
                >
                  <div className="portal-card-content">
                    <h3 className="portal-card-title">ĐÃ KẾT NỐI VÍ</h3>
                    <p
                      className="portal-card-desc"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      {account.displayName}
                    </p>

                    {/* FEST Balance Display */}
                    <div
                      style={{
                        padding: "0.75rem",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "rgba(255,255,255,0.7)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Số dư FEST
                      </div>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        {festBalanceFormatted}{" "}
                        <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                          FEST
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={openChainModal}
                        type="button"
                        style={{
                          padding: "0.5rem 1rem",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {chain.hasIcon && chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        {chain.name}
                      </button>
                      <button
                        onClick={openAccountModal}
                        type="button"
                        style={{
                          padding: "0.5rem 1rem",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        XEM VÍ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
