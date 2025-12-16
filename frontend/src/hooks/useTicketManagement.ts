import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useWriteContract, usePublicClient, useAccount} from "wagmi";
import {parseEther} from "viem";
import toast from "react-hot-toast";

// NFT ABI for ticket management functions
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
    {
        name: "removeTicketFromSale",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{name: "tokenId", type: "uint256"}],
    },
    {
        name: "giftTicket",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {name: "to", type: "address"},
            {name: "tokenId", type: "uint256"},
        ],
    },
    {
        name: "verifyTicket",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "bool"}],
    },
    {
        name: "isTicketVerified",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "bool"}],
    },
    {
        name: "isTicketGifted",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "bool"}],
    },
    {
        name: "getTicketsOwnedBy",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "owner", type: "address"}],
        outputs: [{name: "", type: "uint256[]"}],
    },
    {
        name: "getTicketPurchasePrice",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "uint256"}],
    },
    {
        name: "isTicketForSale",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "bool"}],
    },
    {
        name: "getTicketSellingPrice",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "uint256"}],
    },
    {
        name: "tokenURI",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "string"}],
    },
    {
        name: "getTicketsForSale",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{name: "", type: "uint256[]"}],
    },
    {
        name: "ownerOf",
        type: "function",
        stateMutability: "view",
        inputs: [{name: "tokenId", type: "uint256"}],
        outputs: [{name: "", type: "address"}],
    },
] as const;

/**
 * Hook to list ticket for resale
 */
export function useListTicketForSale() {
    const {writeContractAsync} = useWriteContract();
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({nftAddress, tokenId, sellingPrice}: {nftAddress: string; tokenId: number; sellingPrice: string}) => {
            const priceInWei = parseEther(sellingPrice);

            const hash = await writeContractAsync({
                address: nftAddress as `0x${string}`,
                abi: NFT_ABI,
                functionName: "setTicketForSale",
                args: [BigInt(tokenId), priceInWei],
            });

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({hash});
                if (receipt.status !== "success") {
                    throw new Error("Transaction failed");
                }
            }

            return {hash};
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["myTickets"]});
            toast.success("✅ Đã niêm yết vé thành công!");
        },
        onError: (error: any) => {
            console.error("List ticket error:", error);
            let errorMessage = "❌ Niêm yết vé thất bại";

            if (error?.message?.includes("User rejected") || error?.message?.includes("user rejected")) {
                errorMessage = "❌ Bạn đã từ chối giao dịch";
            } else if (error?.message?.includes("exceeds 110%") || error?.message?.includes("Price exceeds 110%")) {
                errorMessage = "❌ Giá vượt quá 110% giá gốc";
            } else if (error?.message?.includes("Not authorized") || error?.message?.includes("not authorized")) {
                errorMessage = "❌ Bạn không có quyền bán vé này. Đảm bảo bạn là chủ sở hữu vé.";
            } else if (error?.message?.includes("Event not active")) {
                errorMessage = "❌ Sự kiện không còn active. Không thể bán vé.";
            } else if (error?.message?.includes("already used") || error?.message?.includes("Ticket already used")) {
                errorMessage = "❌ Vé đã được sử dụng. Không thể bán vé đã sử dụng.";
            } else if (error?.message) {
                errorMessage = `❌ ${error.message}`;
            }

            toast.error(errorMessage);
        },
    });
}

/**
 * Hook to remove ticket from sale
 */
export function useUnlistTicket() {
    const {writeContractAsync} = useWriteContract();
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({nftAddress, tokenId}: {nftAddress: string; tokenId: number}) => {
            const hash = await writeContractAsync({
                address: nftAddress as `0x${string}`,
                abi: NFT_ABI,
                functionName: "removeTicketFromSale",
                args: [BigInt(tokenId)],
            });

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({hash});
                if (receipt.status !== "success") {
                    throw new Error("Transaction failed");
                }
            }

            return {hash};
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["myTickets"]});
            toast.success("✅ Đã gỡ vé khỏi chợ!");
        },
        onError: (error: any) => {
            console.error("Unlist ticket error:", error);
            if (error.message?.includes("User rejected")) {
                toast.error("❌ Bạn đã từ chối giao dịch");
            } else {
                toast.error("❌ Gỡ vé thất bại");
            }
        },
    });
}

/**
 * Hook to gift ticket (free transfer)
 */
export function useGiftTicket() {
    const {writeContractAsync} = useWriteContract();
    const publicClient = usePublicClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({nftAddress, tokenId, toAddress}: {nftAddress: string; tokenId: number; toAddress: string}) => {
            const hash = await writeContractAsync({
                address: nftAddress as `0x${string}`,
                abi: NFT_ABI,
                functionName: "giftTicket",
                args: [toAddress as `0x${string}`, BigInt(tokenId)],
            });

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({hash});
                if (receipt.status !== "success") {
                    throw new Error("Transaction failed");
                }
            }

            return {hash};
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["myTickets"]});
            toast.success("🎁 Đã tặng vé thành công!");
        },
        onError: (error: any) => {
            console.error("Gift ticket error:", error);
            if (error.message?.includes("User rejected")) {
                toast.error("❌ Bạn đã từ chối giao dịch");
            } else if (error.message?.includes("already used")) {
                toast.error("❌ Vé đã được sử dụng");
            } else if (error.message?.includes("Invalid recipient")) {
                toast.error("❌ Địa chỉ người nhận không hợp lệ");
            } else {
                toast.error("❌ Tặng vé thất bại");
            }
        },
    });
}

/**
 * Hook to verify ticket (for organisers/verifiers)
 */
export function useVerifyTicket() {
    const {writeContractAsync} = useWriteContract();
    const publicClient = usePublicClient();

    return useMutation({
        mutationFn: async ({nftAddress, tokenId}: {nftAddress: string; tokenId: number}) => {
            const hash = await writeContractAsync({
                address: nftAddress as `0x${string}`,
                abi: NFT_ABI,
                functionName: "verifyTicket",
                args: [BigInt(tokenId)],
            });

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({hash});
                if (receipt.status !== "success") {
                    throw new Error("Transaction failed");
                }
            }

            return {hash};
        },
        onSuccess: () => {
            toast.success("✅ Vé đã được xác thực!");
        },
        onError: (error: any) => {
            console.error("Verify ticket error:", error);
            if (error.message?.includes("User rejected")) {
                toast.error("❌ Bạn đã từ chối giao dịch");
            } else if (error.message?.includes("already verified")) {
                toast.error("❌ Vé đã được xác thực rồi");
            } else if (error.message?.includes("not active")) {
                toast.error("❌ Sự kiện chưa diễn ra");
            } else {
                toast.error("❌ Xác thực vé thất bại");
            }
        },
    });
}

/**
 * Hook to fetch user's tickets - Now using Query for real-time updates
 * This uses Blockchain Query (Critical/Real-time Data) pattern
 */
export function useMyTickets(nftAddress: string, userAddress: string | undefined) {
    const publicClient = usePublicClient();

    return useQuery({
        queryKey: ["myTickets", nftAddress, userAddress],
        queryFn: async () => {
            if (!userAddress || !publicClient || !nftAddress) {
                return [];
            }

            try {
                console.log("🔍 Fetching tickets for:", {
                    nftAddress,
                    userAddress,
                    publicClientExists: !!publicClient,
                });

                // Get token IDs owned by user
                const tokenIds = (await publicClient.readContract({
                    address: nftAddress as `0x${string}`,
                    abi: NFT_ABI,
                    functionName: "getTicketsOwnedBy",
                    args: [userAddress as `0x${string}`],
                })) as bigint[];

                console.log("🎫 Token IDs found:", tokenIds);

                if (!tokenIds || tokenIds.length === 0) {
                    console.log("ℹ️ No tickets found for user");
                    return [];
                }

                // Fetch details for each token
                const tickets = await Promise.all(
                    tokenIds.map(async (tokenId) => {
                        const [tokenURI, purchasePrice, isForSale, sellingPrice, isGifted, isVerified] = await Promise.all([
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "tokenURI",
                                args: [tokenId],
                            }) as Promise<string>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "getTicketPurchasePrice",
                                args: [tokenId],
                            }) as Promise<bigint>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "isTicketForSale",
                                args: [tokenId],
                            }) as Promise<boolean>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "getTicketSellingPrice",
                                args: [tokenId],
                            }) as Promise<bigint>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "isTicketGifted",
                                args: [tokenId],
                            }) as Promise<boolean>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "isTicketVerified",
                                args: [tokenId],
                            }) as Promise<boolean>,
                        ]);

                        return {
                            tokenId: Number(tokenId),
                            tokenURI,
                            purchasePrice: purchasePrice.toString(),
                            isForSale,
                            sellingPrice: sellingPrice.toString(),
                            isGifted,
                            isVerified,
                            owner: userAddress,
                        };
                    })
                );

                console.log("✅ Successfully fetched tickets:", tickets.length);
                return tickets;
            } catch (error: any) {
                console.error("❌ Error fetching tickets from blockchain:", error);
                // Log more details about the error
                if (error?.message) {
                    console.error("Error message:", error.message);
                }
                if (error?.cause) {
                    console.error("Error cause:", error.cause);
                }
                return [];
            }
        },
        enabled: !!(userAddress && publicClient && nftAddress),
        // Real-time polling: refetch every 5 seconds to catch new purchases
        refetchInterval: 5000,
        // Also refetch when window regains focus
        refetchOnWindowFocus: true,
        // Refetch when network reconnects
        refetchOnReconnect: true,
    });
}

/**
 * Hook to fetch all tickets for sale on secondary market
 * Excludes tickets owned by current user (can't buy your own ticket)
 */
export function useSecondaryMarketTickets(nftAddress: string, excludeOwner?: string | undefined) {
    const publicClient = usePublicClient();

    return useQuery({
        queryKey: ["secondaryMarketTickets", nftAddress, excludeOwner],
        queryFn: async () => {
            if (!publicClient || !nftAddress) {
                return [];
            }

            try {
                console.log("🔍 Fetching secondary market tickets:", {
                    nftAddress,
                    excludeOwner,
                });

                // Get all token IDs that are for sale
                const tokenIds = (await publicClient.readContract({
                    address: nftAddress as `0x${string}`,
                    abi: NFT_ABI,
                    functionName: "getTicketsForSale",
                    args: [],
                })) as bigint[];

                console.log("🎫 Tickets for sale found:", tokenIds);

                if (!tokenIds || tokenIds.length === 0) {
                    console.log("ℹ️ No tickets for sale");
                    return [];
                }

                // Fetch details for each ticket
                const tickets = await Promise.all(
                    tokenIds.map(async (tokenId) => {
                        const [tokenURI, purchasePrice, sellingPrice, owner, isGifted, isVerified] = await Promise.all([
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "tokenURI",
                                args: [tokenId],
                            }) as Promise<string>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "getTicketPurchasePrice",
                                args: [tokenId],
                            }) as Promise<bigint>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "getTicketSellingPrice",
                                args: [tokenId],
                            }) as Promise<bigint>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "ownerOf",
                                args: [tokenId],
                            }) as Promise<`0x${string}`>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "isTicketGifted",
                                args: [tokenId],
                            }) as Promise<boolean>,
                            publicClient.readContract({
                                address: nftAddress as `0x${string}`,
                                abi: NFT_ABI,
                                functionName: "isTicketVerified",
                                args: [tokenId],
                            }) as Promise<boolean>,
                        ]);

                        return {
                            tokenId: Number(tokenId),
                            tokenURI,
                            purchasePrice,
                            sellingPrice,
                            owner: owner.toLowerCase(),
                            isForSale: true,
                            isGifted,
                            isVerified,
                        };
                    })
                );

                // Filter out tickets owned by current user (can't buy your own ticket)
                const filteredTickets = excludeOwner ? tickets.filter((ticket) => ticket.owner !== excludeOwner.toLowerCase()) : tickets;

                console.log("✅ Secondary market tickets:", filteredTickets.length);
                return filteredTickets;
            } catch (error) {
                console.error("❌ Error fetching secondary market tickets:", error);
                return [];
            }
        },
        enabled: !!(publicClient && nftAddress),
        // Real-time polling: refetch every 5 seconds
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });
}

export {NFT_ABI};
