import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useWaitForTransactionReceipt, useWriteContract, usePublicClient, useAccount} from "wagmi";
import {parseEther, encodeFunctionData} from "viem";
import {useBiconomyAccount} from "./useBiconomyAccount";
import {uploadMetadata} from "@/services/ipfs";
import toast from "react-hot-toast";

// ABI fragments for contract interactions
const FACTORY_ABI = [
    {
        name: "createNewFest",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {name: "name", type: "string"},
            {name: "symbol", type: "string"},
            {name: "organiser", type: "address"},
        ],
        outputs: [
            {name: "nftContract", type: "address"},
            {name: "marketplaceContract", type: "address"},
        ],
    },
] as const;

const MARKETPLACE_ABI = [
    {
        name: "buyFromOrganiser",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {name: "nftContractAddress", type: "address"},
            {name: "buyer", type: "address"},
            {name: "tokenURI", type: "string"},
            {name: "price", type: "uint256"},
        ],
    },
    {
        name: "buyFromCustomer",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {name: "nftContractAddress", type: "address"},
            {name: "ticketId", type: "uint256"},
            {name: "buyer", type: "address"},
        ],
    },
] as const;

const FEST_TOKEN_ABI = [
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {name: "spender", type: "address"},
            {name: "amount", type: "uint256"},
        ],
    },
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "account", type: "address"}],
        outputs: [{name: "", type: "uint256"}],
    },
] as const;

const NFT_ABI = [
    {
        name: "setTicketForSale",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {name: "tokenId", type: "uint256"},
            {name: "sellingPrice", type: "uint256"},
        ],
    },
] as const;

// Hook for creating a new festival
export function useCreateFestival() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (_params: {name: string; symbol: string; organiser: string}) => {
            // This would need to be implemented with proper contract writing
            // For now, return a placeholder
            return {nftContract: "0x...", marketplace: "0x..."};
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["festivals"]});
            toast.success("Festival created successfully!");
        },
        onError: (error) => {
            console.error("Error creating festival:", error);
            toast.error("Failed to create festival");
        },
    });
}

// Hook for buying tickets - Improved version with balance check and transaction waiting
export function useBuyTicket() {
    const {writeContractAsync} = useWriteContract();
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            nftAddress,
            marketplaceAddress,
            tokenAddress,
            price,
            ticketData,
            buyerAddress,
        }: {
            nftAddress: string;
            marketplaceAddress: string;
            tokenAddress: string;
            price: string;
            buyerAddress: string;
            ticketData: {
                name: string;
                description: string;
                image: File;
            };
        }) => {
            try {
                const priceInWei = parseEther(price);

                console.log("🔍 Debug Info:", {
                    tokenAddress,
                    marketplaceAddress,
                    buyerAddress,
                    price,
                    priceInWei: priceInWei.toString(),
                    publicClientExists: !!publicClient,
                });

                // 0. Check balance first
                if (!publicClient) {
                    throw new Error("Không thể kết nối với blockchain. Vui lòng kiểm tra MetaMask.");
                }

                // Validate contract address
                if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
                    throw new Error(
                        "❌ Địa chỉ contract không hợp lệ. Vui lòng deploy contracts trước:\n1. Chạy: npx hardhat run scripts/deploy.js --network localhost\n2. Refresh trang và thử lại"
                    );
                }

                toast.loading("Đang kiểm tra số dư...");
                let balance: bigint;
                try {
                    balance = (await publicClient.readContract({
                        address: tokenAddress as `0x${string}`,
                        abi: FEST_TOKEN_ABI,
                        functionName: "balanceOf",
                        args: [buyerAddress as `0x${string}`],
                    })) as bigint;
                } catch (error: any) {
                    toast.dismiss();
                    // Check if it's a connection error
                    if (error?.message?.includes("Failed to fetch") || error?.message?.includes("HTTP request failed")) {
                        throw new Error(
                            "❌ Không thể kết nối với Hardhat node. Vui lòng:\n1. Mở terminal và chạy: npx hardhat node\n2. Đảm bảo Hardhat node đang chạy trên http://127.0.0.1:8545\n3. Refresh trang và thử lại"
                        );
                    }
                    // Check if contract doesn't exist
                    if (error?.message?.includes("returned no data") || error?.message?.includes("not a contract")) {
                        throw new Error(
                            `❌ Contract tại địa chỉ ${tokenAddress} không tồn tại hoặc chưa được deploy.\nVui lòng:\n1. Đảm bảo Hardhat node đang chạy\n2. Deploy contracts: npx hardhat run scripts/deploy.js --network localhost\n3. Kiểm tra file deployedAddresses.json có địa chỉ đúng\n4. Refresh trang và thử lại`
                        );
                    }
                    throw error;
                }

                console.log("💰 Balance check:", {
                    buyerAddress,
                    balance: balance.toString(),
                    balanceInFEST: Number(balance) / 1e18,
                    required: price,
                    requiredInWei: priceInWei.toString(),
                });

                if (!balance || balance < priceInWei) {
                    toast.dismiss();
                    const currentBalance = Number(balance) / 1e18;
                    throw new Error(
                        `❌ Không đủ FEST tokens!\n\n` +
                            `Địa chỉ: ${buyerAddress}\n` +
                            `Cần: ${price} FEST\n` +
                            `Có: ${currentBalance} FEST\n\n` +
                            `💡 Giải pháp:\n` +
                            `1. Nếu đang dùng Smart Account, cần transfer FEST tokens vào Smart Account trước\n` +
                            `2. Hoặc chuyển về regular address (tắt Smart Account)\n` +
                            `3. Đảm bảo account có đủ FEST tokens (Account #1 có 10,000 FEST)`
                    );
                }
                toast.dismiss();

                // 1. Upload metadata to IPFS
                toast.loading("Đang tải metadata lên IPFS...");
                const tokenURI = await uploadMetadata(ticketData);
                toast.dismiss();
                toast.success("Metadata đã được tải lên!");

                // 2. Approve FestToken spending
                toast.loading("Đang approve tokens... Vui lòng xác nhận trong MetaMask");
                const approveHash = await writeContractAsync({
                    address: tokenAddress as `0x${string}`,
                    abi: FEST_TOKEN_ABI,
                    functionName: "approve",
                    args: [marketplaceAddress as `0x${string}`, priceInWei],
                });

                // Wait for approval transaction to be mined
                toast.loading("Đang chờ approve transaction được xác nhận...");
                const approveReceipt = await publicClient?.waitForTransactionReceipt({
                    hash: approveHash,
                });

                if (!approveReceipt || approveReceipt.status !== "success") {
                    throw new Error("Approve transaction thất bại");
                }
                toast.dismiss();
                toast.success("Tokens đã được approve!");

                // 3. Buy ticket from organiser
                console.log("🛒 Buying ticket with params:", {
                    nftAddress,
                    marketplaceAddress,
                    buyerAddress,
                    tokenURI,
                    price: priceInWei.toString(),
                });

                toast.loading("Đang mua vé... Vui lòng xác nhận trong MetaMask");
                const buyHash = await writeContractAsync({
                    address: marketplaceAddress as `0x${string}`,
                    abi: MARKETPLACE_ABI,
                    functionName: "buyFromOrganiser",
                    args: [nftAddress as `0x${string}`, buyerAddress as `0x${string}`, tokenURI, priceInWei],
                });

                // Wait for buy transaction to be mined
                toast.loading("Đang chờ buy transaction được xác nhận...");
                const buyReceipt = await publicClient?.waitForTransactionReceipt({
                    hash: buyHash,
                });

                if (!buyReceipt || buyReceipt.status !== "success") {
                    throw new Error("Buy transaction thất bại");
                }

                // Log transaction receipt to see events
                console.log("📄 Buy transaction receipt:", {
                    transactionHash: buyReceipt.transactionHash,
                    blockNumber: buyReceipt.blockNumber,
                    status: buyReceipt.status,
                    logs: buyReceipt.logs,
                });

                toast.dismiss();

                return {buyHash, tokenURI, approveHash, buyerAddress};
            } catch (error: any) {
                toast.dismiss();
                console.error("Error in useBuyTicket:", error);

                // Better error messages
                let errorMessage = "Không thể mua vé";
                if (error?.message?.includes("User rejected")) {
                    errorMessage = "Bạn đã từ chối giao dịch";
                } else if (error?.message?.includes("insufficient funds")) {
                    errorMessage = "Không đủ ETH để trả gas fee";
                } else if (error?.message?.includes("Không đủ FEST")) {
                    errorMessage = error.message;
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                throw new Error(errorMessage);
            }
        },
        onSuccess: (data) => {
            console.log("✅ Ticket purchase successful:", data);
            // Invalidate all ticket-related queries to refresh the list
            queryClient.invalidateQueries({queryKey: ["tickets"]});
            queryClient.invalidateQueries({queryKey: ["myTickets"]});
            // Force refetch immediately
            queryClient.refetchQueries({queryKey: ["myTickets"]});
            toast.success("🎉 Vé đã được mua thành công!");
        },
        onError: (error: any) => {
            console.error("Error buying ticket:", error);
            const message = error?.message || "Không thể mua vé";
            toast.error(message);
        },
    });
}

export function useBuySecondaryTicket() {
    // Dùng ví EOA hiện tại thay vì smart account (đảm bảo cùng nơi giữ FEST)
    const {address} = useAccount();
    const {writeContractAsync} = useWriteContract();
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            nftAddress,
            marketplaceAddress,
            tokenAddress,
            ticketId,
            price,
        }: {
            nftAddress: string;
            marketplaceAddress: string;
            tokenAddress: string;
            ticketId: number;
            price: string;
        }) => {
            if (!address) {
                throw new Error("Wallet not connected");
            }

            const amount = parseEther(price);

            // 1) Approve FEST cho marketplace
            const approveHash = await writeContractAsync({
                address: tokenAddress as `0x${string}`,
                abi: FEST_TOKEN_ABI,
                functionName: "approve",
                args: [marketplaceAddress as `0x${string}`, amount],
            });

            if (publicClient) {
                const approveReceipt = await publicClient.waitForTransactionReceipt({hash: approveHash});
                if (approveReceipt.status !== "success") {
                    throw new Error("Approve FEST failed");
                }
            }

            // 2) Gọi buyFromCustomer
            const buyHash = await writeContractAsync({
                address: marketplaceAddress as `0x${string}`,
                abi: MARKETPLACE_ABI,
                functionName: "buyFromCustomer",
                args: [nftAddress as `0x${string}`, BigInt(ticketId), address as `0x${string}`],
            });

            if (publicClient) {
                const buyReceipt = await publicClient.waitForTransactionReceipt({hash: buyHash});
                if (buyReceipt.status !== "success") {
                    throw new Error("Buy transaction failed");
                }
            }

            return {approveHash, buyHash};
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tickets"]});
            queryClient.invalidateQueries({queryKey: ["myTickets"]});
            toast.success("Secondary ticket purchased successfully!");
        },
        onError: (error) => {
            console.error("Error buying secondary ticket:", error);
            const message =
                (error as any)?.shortMessage ||
                (error as any)?.message ||
                "Failed to purchase secondary ticket. Kiểm tra lại số dư FEST và bạn không mua vé của chính mình.";
            toast.error(message);
        },
    });
}

// Hook for listing tickets for sale
export function useListTicketForSale() {
    const {smartAccount} = useBiconomyAccount();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({nftAddress, tokenId, sellingPrice}: {nftAddress: string; tokenId: number; sellingPrice: string}) => {
            if (!smartAccount) {
                throw new Error("Smart account not initialized");
            }

            // Create transaction data
            const sellData = encodeFunctionData({
                abi: NFT_ABI,
                functionName: "setTicketForSale",
                args: [BigInt(tokenId), parseEther(sellingPrice)],
            });

            // Create user operation
            const userOp = await smartAccount.buildUserOp([
                {
                    to: nftAddress,
                    data: sellData,
                    value: "0",
                },
            ]);

            // Send user operation
            const userOpResponse = await smartAccount.sendUserOp(userOp);

            // Wait for transaction to be mined
            const receipt = await userOpResponse.wait();

            return receipt;
        },
        onSuccess: () => {
            // Invalidate all ticket-related queries to refresh the list
            queryClient.invalidateQueries({queryKey: ["tickets"]});
            queryClient.invalidateQueries({queryKey: ["myTickets"]});
            toast.success("Ticket listed for sale successfully!");
        },
        onError: (error) => {
            console.error("Error listing ticket:", error);
            toast.error("Failed to list ticket for sale");
        },
    });
}
