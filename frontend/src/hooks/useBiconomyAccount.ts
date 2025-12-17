import { useState, useEffect, useCallback } from 'react';
import { useWalletClient, useChainId } from 'wagmi';
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account';
import { Bundler } from '@biconomy/bundler';
import { BiconomyPaymaster } from '@biconomy/paymaster';
import { ECDSAOwnershipValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE } from '@biconomy/modules';
import { SmartAccountData } from '@/types';

export function useBiconomyAccount(): SmartAccountData {
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const createSmartAccount = useCallback(async () => {
    if (!walletClient) return;

    try {
      setLoading(true);
      setError(null);

      // Initialize Bundler
      const bundler = new Bundler({
        bundlerUrl: import.meta.env.VITE_BICONOMY_BUNDLER_URL,
        chainId: chainId,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      });

      // Initialize Paymaster
      const paymaster = new BiconomyPaymaster({
        paymasterUrl: import.meta.env.VITE_BICONOMY_PAYMASTER_URL,
      });

      // Create module
      const module = await ECDSAOwnershipValidationModule.create({
        signer: walletClient,
        moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
      });

      // Create Smart Account
      const smartAccount = await BiconomySmartAccountV2.create({
        chainId: chainId,
        bundler: bundler as any,
        paymaster: paymaster,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        defaultValidationModule: module as any,
        activeValidationModule: module as any,
      });

      const address = await smartAccount.getAccountAddress();

      setSmartAccount(smartAccount);
      setSmartAccountAddress(address);
    } catch (err) {
      console.error('Error creating smart account:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [walletClient, chainId]);

  useEffect(() => {
    if (walletClient) {
      createSmartAccount();
    } else {
      setSmartAccount(null);
      setSmartAccountAddress('');
    }
  }, [walletClient, createSmartAccount]);

  return {
    smartAccount,
    smartAccountAddress,
    loading,
    error,
  };
}