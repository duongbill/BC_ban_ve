import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWaitForTransactionReceipt, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, encodeFunctionData } from 'viem';
import { useBiconomyAccount } from './useBiconomyAccount';
import { uploadMetadata } from '@/services/ipfs';
import toast from 'react-hot-toast';

// ABI fragments for contract interactions
const FACTORY_ABI = [
  {
    name: 'createNewFest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'organiser', type: 'address' }
    ],
    outputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'marketplaceContract', type: 'address' }
    ]
  }
] as const;

const MARKETPLACE_ABI = [
  {
    name: 'buyFromOrganiser',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContractAddress', type: 'address' },
      { name: 'buyer', type: 'address' },
      { name: 'tokenURI', type: 'string' },
      { name: 'price', type: 'uint256' }
    ]
  },
  {
    name: 'buyFromCustomer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContractAddress', type: 'address' },
      { name: 'ticketId', type: 'uint256' },
      { name: 'buyer', type: 'address' }
    ]
  }
] as const;

const FEST_TOKEN_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  }
] as const;

const NFT_ABI = [
  {
    name: 'setTicketForSale',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'sellingPrice', type: 'uint256' }
    ]
  }
] as const;

// Hook for creating a new festival
export function useCreateFestival() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, symbol, organiser }: {
      name: string;
      symbol: string;
      organiser: string;
    }) => {
      // This would need to be implemented with proper contract writing
      // For now, return a placeholder
      return { nftContract: '0x...', marketplace: '0x...' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      toast.success('Festival created successfully!');
    },
    onError: (error) => {
      console.error('Error creating festival:', error);
      toast.error('Failed to create festival');
    }
  });
}

// Hook for buying tickets - Improved version with balance check and transaction waiting
export function useBuyTicket() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      marketplaceAddress,
      tokenAddress,
      price,
      ticketData,
      buyerAddress
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
        
        console.log('🔍 Debug Info:', {
          tokenAddress,
          marketplaceAddress,
          buyerAddress,
          price,
          priceInWei: priceInWei.toString(),
          publicClientExists: !!publicClient
        });
        
        // 0. Check balance first
        if (!publicClient) {
          throw new Error('Không thể kết nối với blockchain. Vui lòng kiểm tra MetaMask.');
        }
        
        toast.loading('Đang kiểm tra số dư...');
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: FEST_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [buyerAddress as `0x${string}`]
        }) as bigint;
        
        console.log('💰 Balance check:', {
          balance: balance.toString(),
          balanceInFEST: Number(balance) / 1e18,
          required: price
        });
        
        if (!balance || balance < priceInWei) {
          toast.dismiss();
          throw new Error(`Không đủ FEST tokens. Cần ${price} FEST, chỉ có ${Number(balance) / 1e18} FEST`);
        }
        toast.dismiss();
        
        // 1. Upload metadata to IPFS
        toast.loading('Đang tải metadata lên IPFS...');
        const tokenURI = await uploadMetadata(ticketData);
        toast.dismiss();
        toast.success('Metadata đã được tải lên!');
        
        // 2. Approve FestToken spending
        toast.loading('Đang approve tokens... Vui lòng xác nhận trong MetaMask');
        const approveHash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: FEST_TOKEN_ABI,
          functionName: 'approve',
          args: [marketplaceAddress as `0x${string}`, priceInWei]
        });
        
        // Wait for approval transaction to be mined
        toast.loading('Đang chờ approve transaction được xác nhận...');
        const approveReceipt = await publicClient?.waitForTransactionReceipt({
          hash: approveHash
        });
        
        if (!approveReceipt || approveReceipt.status !== 'success') {
          throw new Error('Approve transaction thất bại');
        }
        toast.dismiss();
        toast.success('Tokens đã được approve!');

        // 3. Buy ticket from organiser
        toast.loading('Đang mua vé... Vui lòng xác nhận trong MetaMask');
        const buyHash = await writeContractAsync({
          address: marketplaceAddress as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'buyFromOrganiser',
          args: [
            nftAddress as `0x${string}`,
            buyerAddress as `0x${string}`,
            tokenURI,
            priceInWei
          ]
        });
        
        // Wait for buy transaction to be mined
        toast.loading('Đang chờ buy transaction được xác nhận...');
        const buyReceipt = await publicClient?.waitForTransactionReceipt({
          hash: buyHash
        });
        
        if (!buyReceipt || buyReceipt.status !== 'success') {
          throw new Error('Buy transaction thất bại');
        }
        toast.dismiss();
        
        return { buyHash, tokenURI, approveHash };
      } catch (error: any) {
        toast.dismiss();
        console.error('Error in useBuyTicket:', error);
        
        // Better error messages
        let errorMessage = 'Không thể mua vé';
        if (error?.message?.includes('User rejected')) {
          errorMessage = 'Bạn đã từ chối giao dịch';
        } else if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Không đủ ETH để trả gas fee';
        } else if (error?.message?.includes('Không đủ FEST')) {
          errorMessage = error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('🎉 Vé đã được mua thành công!');
    },
    onError: (error: any) => {
      console.error('Error buying ticket:', error);
      const message = error?.message || 'Không thể mua vé';
      toast.error(message);
    }
  });
}

// Hook for buying secondary tickets
export function useBuySecondaryTicket() {
  const { smartAccount, smartAccountAddress } = useBiconomyAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      marketplaceAddress,
      tokenAddress,
      ticketId,
      price
    }: {
      nftAddress: string;
      marketplaceAddress: string;
      tokenAddress: string;
      ticketId: number;
      price: string;
    }) => {
      if (!smartAccount || !smartAccountAddress) {
        throw new Error('Smart account not initialized');
      }

      // 1. Create batch transaction data
      const approveData = encodeFunctionData({
        abi: FEST_TOKEN_ABI,
        functionName: 'approve',
        args: [marketplaceAddress as `0x${string}`, parseEther(price)]
      });

      const buyData = encodeFunctionData({
        abi: MARKETPLACE_ABI,
        functionName: 'buyFromCustomer',
        args: [
          nftAddress as `0x${string}`,
          BigInt(ticketId),
          smartAccountAddress as `0x${string}`
        ]
      });

      // 2. Create user operation with batch transactions
      const userOp = await smartAccount.buildUserOp([
        {
          to: tokenAddress,
          data: approveData,
          value: '0'
        },
        {
          to: marketplaceAddress,
          data: buyData,
          value: '0'
        }
      ]);

      // 3. Send user operation
      const userOpResponse = await smartAccount.sendUserOp(userOp);
      
      // 4. Wait for transaction to be mined
      const receipt = await userOpResponse.wait();
      
      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Secondary ticket purchased successfully!');
    },
    onError: (error) => {
      console.error('Error buying secondary ticket:', error);
      toast.error('Failed to purchase secondary ticket');
    }
  });
}

// Hook for listing tickets for sale
export function useListTicketForSale() {
  const { smartAccount } = useBiconomyAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      tokenId,
      sellingPrice
    }: {
      nftAddress: string;
      tokenId: number;
      sellingPrice: string;
    }) => {
      if (!smartAccount) {
        throw new Error('Smart account not initialized');
      }

      // Create transaction data
      const sellData = encodeFunctionData({
        abi: NFT_ABI,
        functionName: 'setTicketForSale',
        args: [BigInt(tokenId), parseEther(sellingPrice)]
      });

      // Create user operation
      const userOp = await smartAccount.buildUserOp([{
        to: nftAddress,
        data: sellData,
        value: '0'
      }]);

      // Send user operation
      const userOpResponse = await smartAccount.sendUserOp(userOp);
      
      // Wait for transaction to be mined
      const receipt = await userOpResponse.wait();
      
      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket listed for sale successfully!');
    },
    onError: (error) => {
      console.error('Error listing ticket:', error);
      toast.error('Failed to list ticket for sale');
    }
  });
}