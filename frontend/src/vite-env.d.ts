/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_BICONOMY_BUNDLER_URL: string;
  readonly VITE_BICONOMY_PAYMASTER_URL: string;
  readonly VITE_NFT_STORAGE_API_KEY: string;
  readonly VITE_FEST_TOKEN_ADDRESS: string;
  readonly VITE_FACTORY_ADDRESS: string;
  readonly VITE_ENABLE_TESTNETS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}