import { ConnectButton } from "@rainbow-me/rainbowkit";
import "../styles/portal.css";

export function ConnectWalletCard() {
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
                    onClick={openConnectModal}
                    type="button"
                    className="portal-card gradient-pink"
                    style={{ width: "100%", cursor: "pointer" }}
                  >
                    <div className="portal-card-content">
                      <h3 className="portal-card-title">KẾT NỐI VÍ</h3>
                      <p className="portal-card-desc">
                        Kết nối ví Web3 của bạn
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

              return (
                <div
                  className="portal-card gradient-blue"
                  style={{ width: "100%" }}
                >
                  <div className="portal-card-content">
                    <h3 className="portal-card-title">ĐÃ KẾT NỐI VÍ</h3>
                    <p
                      className="portal-card-desc"
                      style={{ marginBottom: "1rem" }}
                    >
                      {account.displayName}
                    </p>
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
