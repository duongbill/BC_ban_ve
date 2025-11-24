import { NFTStorage, File } from 'nft.storage';
import { TicketMetadata } from '@/types';

const client = new NFTStorage({ token: import.meta.env.VITE_NFT_STORAGE_API_KEY });

export interface UploadMetadataParams {
  name: string;
  description: string;
  image: File;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Upload ticket metadata and image to IPFS
 * @param data Metadata and image to upload
 * @returns Promise<string> The IPFS URI for the metadata
 */
export async function uploadMetadata(data: UploadMetadataParams): Promise<string> {
  try {
    // Validate input
    if (!data.name || !data.description || !data.image) {
      throw new Error('Name, description, and image are required');
    }

    // Create metadata object
    const metadata: TicketMetadata = {
      name: data.name,
      description: data.description,
      image: '', // Will be set after image upload
      attributes: data.attributes || [],
    };

    // Upload to NFT.Storage
    const result = await client.store({
      ...metadata,
      image: data.image,
    });

    // Return the metadata URI
    return result.url;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

/**
 * Upload just an image to IPFS
 * @param image Image file to upload
 * @returns Promise<string> The IPFS URI for the image
 */
export async function uploadImage(image: File): Promise<string> {
  try {
    const result = await client.storeBlob(image);
    return `ipfs://${result}`;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}

/**
 * Fetch metadata from IPFS URI
 * @param uri IPFS URI (ipfs://... or https://...)
 * @returns Promise<TicketMetadata> The metadata object
 */
export async function fetchMetadata(uri: string): Promise<TicketMetadata> {
  try {
    // Convert IPFS URI to HTTP gateway URL if needed
    const httpUrl = uri.startsWith('ipfs://')
      ? `https://${uri.slice(7)}.ipfs.nftstorage.link`
      : uri;

    const response = await fetch(httpUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    throw new Error('Failed to fetch metadata from IPFS');
  }
}

/**
 * Convert IPFS URI to HTTP gateway URL
 * @param uri IPFS URI
 * @returns HTTP gateway URL
 */
export function ipfsToHttp(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `https://${uri.slice(7)}.ipfs.nftstorage.link`;
  }
  return uri;
}