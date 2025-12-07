import { useMutation } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';

// NFTv2 ABI for new functions
const NFT_V2_ABI = [
  {
    name: 'setTicketForSale',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'sellingPrice', type: 'uint256' }
    ]
  },
  {
    name: 'removeTicketFromSale',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ]
  },
  {
    name: 'giftTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ]
  },
  {
    name: 'verifyTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },
  {
    name: 'isTicketVerified',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },
  {
    name: 'isTicketGifted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },
  {
    name: 'getTicketsOwnedBy',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256[]' }
    ]
  },
  {
    name: 'getTicketPurchasePrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    name: 'isTicketForSale',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },
  {
    name: 'getTicketSellingPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'string' }
    ]
  }
] as const;

/**
 * Hook to list ticket for resale
 */
export function useListTicketForSale() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      tokenId,
      sellingPrice,
    }: {
      nftAddress: string;
      tokenId: number;
      sellingPrice: string;
    }) => {
      const priceInWei = parseEther(sellingPrice);

      const hash = await writeContractAsync({
        address: nftAddress as `0x${string}`,
        abi: NFT_V2_ABI,
        functionName: 'setTicketForSale',
        args: [BigInt(tokenId), priceInWei],
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }
      }

      return { hash };
    },
    onSuccess: () => {
      toast.success('✅ Đã niêm yết vé thành công!');
    },
    onError: (error: any) => {
      console.error('List ticket error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('❌ Bạn đã từ chối giao dịch');
      } else if (error.message?.includes('exceeds 110%')) {
        toast.error('❌ Giá vượt quá 110% giá gốc');
      } else {
        toast.error('❌ Niêm yết vé thất bại');
      }
    },
  });
}

/**
 * Hook to remove ticket from sale
 */
export function useUnlistTicket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      tokenId,
    }: {
      nftAddress: string;
      tokenId: number;
    }) => {
      const hash = await writeContractAsync({
        address: nftAddress as `0x${string}`,
        abi: NFT_V2_ABI,
        functionName: 'removeTicketFromSale',
        args: [BigInt(tokenId)],
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }
      }

      return { hash };
    },
    onSuccess: () => {
      toast.success('✅ Đã gỡ vé khỏi chợ!');
    },
    onError: (error: any) => {
      console.error('Unlist ticket error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('❌ Bạn đã từ chối giao dịch');
      } else {
        toast.error('❌ Gỡ vé thất bại');
      }
    },
  });
}

/**
 * Hook to gift ticket (free transfer)
 */
export function useGiftTicket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      tokenId,
      toAddress,
    }: {
      nftAddress: string;
      tokenId: number;
      toAddress: string;
    }) => {
      const hash = await writeContractAsync({
        address: nftAddress as `0x${string}`,
        abi: NFT_V2_ABI,
        functionName: 'giftTicket',
        args: [toAddress as `0x${string}`, BigInt(tokenId)],
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }
      }

      return { hash };
    },
    onSuccess: () => {
      toast.success('🎁 Đã tặng vé thành công!');
    },
    onError: (error: any) => {
      console.error('Gift ticket error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('❌ Bạn đã từ chối giao dịch');
      } else if (error.message?.includes('already used')) {
        toast.error('❌ Vé đã được sử dụng');
      } else if (error.message?.includes('Invalid recipient')) {
        toast.error('❌ Địa chỉ người nhận không hợp lệ');
      } else {
        toast.error('❌ Tặng vé thất bại');
      }
    },
  });
}

/**
 * Hook to verify ticket (for organisers/verifiers)
 */
export function useVerifyTicket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      tokenId,
    }: {
      nftAddress: string;
      tokenId: number;
    }) => {
      const hash = await writeContractAsync({
        address: nftAddress as `0x${string}`,
        abi: NFT_V2_ABI,
        functionName: 'verifyTicket',
        args: [BigInt(tokenId)],
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }
      }

      return { hash };
    },
    onSuccess: () => {
      toast.success('✅ Vé đã được xác thực!');
    },
    onError: (error: any) => {
      console.error('Verify ticket error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('❌ Bạn đã từ chối giao dịch');
      } else if (error.message?.includes('already verified')) {
        toast.error('❌ Vé đã được xác thực rồi');
      } else if (error.message?.includes('not active')) {
        toast.error('❌ Sự kiện chưa diễn ra');
      } else {
        toast.error('❌ Xác thực vé thất bại');
      }
    },
  });
}

/**
 * Hook to fetch user's tickets
 */
export function useMyTickets(nftAddress: string, userAddress: string | undefined) {
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async () => {
      if (!userAddress || !publicClient) {
        return [];
      }

      // Get token IDs owned by user
      const tokenIds = await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_V2_ABI,
        functionName: 'getTicketsOwnedBy',
        args: [userAddress as `0x${string}`],
      }) as bigint[];

      // Fetch details for each token
      const tickets = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const [tokenURI, purchasePrice, isForSale, sellingPrice, isGifted, isVerified] = await Promise.all([
            publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: NFT_V2_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            }) as Promise<string>,
            publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: NFT_V2_ABI,
              functionName: 'getTicketPurchasePrice',
              args: [tokenId],
            }) as Promise<bigint>,
            publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: NFT_V2_ABI,
              functionName: 'isTicketForSale',
              args: [tokenId],
            }) as Promise<boolean>,
            publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: NFT_V2_ABI,
              functionName: 'getTicketSellingPrice',
              args: [tokenId],
            }) as Promise<bigint>,
            publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: NFT_V2_ABI,
              functionName: 'isTicketGifted',
              args: [tokenId],
            }) as Promise<boolean>,
            publicClient.readContract({
              address: nftAddress as `0x${string}`,
              abi: NFT_V2_ABI,
              functionName: 'isTicketVerified',
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

      return tickets;
    },
  });
}

export { NFT_V2_ABI };
