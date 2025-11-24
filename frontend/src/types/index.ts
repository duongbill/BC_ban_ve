export interface Festival {
  id: string;
  name: string;
  symbol: string;
  nftContract: string;
  marketplace: string;
  organiser: string;
  totalTickets?: number;
  ticketsForSale?: number;
}

export interface Ticket {
  id: string;
  tokenId: number;
  tokenURI: string;
  purchasePrice: string;
  sellingPrice?: string;
  isForSale: boolean;
  owner: string;
  festival: Festival;
}

export interface TicketMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface BiconomyConfig {
  bundlerUrl: string;
  paymasterUrl: string;
}

export interface SmartAccountData {
  smartAccount: any;
  smartAccountAddress: string;
  loading: boolean;
  error: Error | null;
}