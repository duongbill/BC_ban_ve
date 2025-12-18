// Festival API service
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

export interface Festival {
  id: string;
  name: string;
  symbol: string;
  nftContract: string;
  marketplace: string;
  organiser: string;
  totalTickets: number;
  ticketsForSale: number;
  maxTicketsPerWallet: number;
  maxResalePercentage: number;
  royaltyPercentage: number;
}

export interface Ticket {
  tokenId: number;
  tokenURI: string;
  purchasePrice: string;
  sellingPrice: string;
  isForSale: boolean;
  owner: string;
  festivalId: string;
  isGifted: boolean;
  isVerified: boolean;
}

export const festivalApi = {
  // Festival endpoints
  getAllFestivals: async (): Promise<Festival[]> => {
    const res = await axios.get(`${BASE_URL}/festivals`);
    return res.data;
  },

  getFestivalById: async (id: string): Promise<Festival> => {
    const res = await axios.get(`${BASE_URL}/festivals/${id}`);
    return res.data;
  },

  createFestival: async (festival: Partial<Festival>): Promise<Festival> => {
    const res = await axios.post(`${BASE_URL}/festivals`, festival);
    return res.data;
  },

  deleteFestival: async (id: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/festivals/${id}`);
  },

  // Ticket endpoints
  getAllTickets: async (festivalId?: string): Promise<Ticket[]> => {
    const url = festivalId 
      ? `${BASE_URL}/tickets?festivalId=${festivalId}`
      : `${BASE_URL}/tickets`;
    const res = await axios.get(url);
    return res.data;
  },

  getTicketById: async (tokenId: number): Promise<Ticket> => {
    const res = await axios.get(`${BASE_URL}/tickets/${tokenId}`);
    return res.data;
  },

  createTicket: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    const res = await axios.post(`${BASE_URL}/tickets`, ticket);
    return res.data;
  },

  updateTicket: async (tokenId: number, update: Partial<Ticket>): Promise<Ticket> => {
    const res = await axios.put(`${BASE_URL}/tickets/${tokenId}`, update);
    return res.data;
  },

  deleteTicket: async (tokenId: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/tickets/${tokenId}`);
  },
};
