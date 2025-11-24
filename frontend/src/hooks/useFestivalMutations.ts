import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
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

// Hook for buying tickets with Biconomy batch transactions
export function useBuyTicket() {
  const { smartAccount, smartAccountAddress } = useBiconomyAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftAddress,
      marketplaceAddress,
      tokenAddress,
      price,
      ticketData
    }: {
      nftAddress: string;
      marketplaceAddress: string;
      tokenAddress: string;
      price: string;
      ticketData: {
        name: string;
        description: string;
        image: File;
      };
    }) => {
      if (!smartAccount || !smartAccountAddress) {
        throw new Error('Smart account not initialized');
      }

      // 1. Upload metadata to IPFS
      const tokenURI = await uploadMetadata(ticketData);

      // 2. Create batch transaction data
      const approveData = encodeFunctionData({
        abi: FEST_TOKEN_ABI,
        functionName: 'approve',
        args: [marketplaceAddress as `0x${string}`, parseEther(price)]
      });

      const buyData = encodeFunctionData({
        abi: MARKETPLACE_ABI,
        functionName: 'buyFromOrganiser',
        args: [
          nftAddress as `0x${string}`,
          smartAccountAddress as `0x${string}`,
          tokenURI,
          parseEther(price)
        ]
      });

      // 3. Create user operation with batch transactions
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

      // 4. Send user operation
      const userOpResponse = await smartAccount.sendUserOp(userOp);
      
      // 5. Wait for transaction to be mined
      const receipt = await userOpResponse.wait();
      
      return { receipt, tokenURI };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket purchased successfully!');
    },
    onError: (error) => {
      console.error('Error buying ticket:', error);
      toast.error('Failed to purchase ticket');
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