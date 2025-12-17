import { NFTStorage } from "nft.storage";
import {TicketMetadata} from "@/types";

// Check if we have a valid API key, otherwise use mock mode
const API_KEY = import.meta.env.VITE_NFT_STORAGE_API_KEY;
const USE_MOCK = !API_KEY || API_KEY === "your_nft_storage_api_key_here";

const client = USE_MOCK ? null : new NFTStorage({token: API_KEY});

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
 * For local testing without NFT.Storage API key, generates mock IPFS URI
 * @param data Metadata and image to upload
 * @returns Promise<string> The IPFS URI for the metadata
 */
export async function uploadMetadata(data: UploadMetadataParams): Promise<string> {
    // Mock mode for local testing
    if (USE_MOCK) {
        console.log("🔧 Using MOCK IPFS (no API key configured)");
        console.log("Metadata:", {name: data.name, description: data.description});

        // Generate a fake IPFS hash for testing
        const mockHash = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const mockUri = `ipfs://${mockHash}`;

        console.log("Mock IPFS URI:", mockUri);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return mockUri;
    }

    // Real NFT.Storage mode
    try {
        const result = await client!.store({
            name: data.name,
            description: data.description,
            image: data.image,
            attributes: data.attributes || [],
        });
        return result.url;
    } catch (error: any) {
        console.error("IPFS ERROR:", error);
        console.error("Error message:", error.message);
        throw new Error("Failed to upload metadata to IPFS: " + error.message);
    }
}

/**
 * Upload just an image to IPFS
 * @param image Image file to upload
 * @returns Promise<string> The IPFS URI for the image
 */
export async function uploadImage(image: File): Promise<string> {
    // Mock mode for local testing
    if (USE_MOCK) {
        console.log("🔧 Using MOCK IPFS for image upload");
        const mockHash = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return `ipfs://${mockHash}`;
    }

    // Real NFT.Storage mode
    try {
        const result = await client!.storeBlob(image);
        return `ipfs://${result}`;
    } catch (error) {
        console.error("Error uploading image to IPFS:", error);
        throw new Error("Failed to upload image to IPFS");
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
        const httpUrl = uri.startsWith("ipfs://") ? `https://${uri.slice(7)}.ipfs.nftstorage.link` : uri;

        const response = await fetch(httpUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const metadata = await response.json();
        return metadata;
    } catch (error) {
        console.error("Error fetching metadata from IPFS:", error);
        throw new Error("Failed to fetch metadata from IPFS");
    }
}

/**
 * Convert IPFS URI to HTTP gateway URL
 * @param uri IPFS URI
 * @returns HTTP gateway URL
 */
export function ipfsToHttp(uri: string): string {
    if (uri.startsWith("ipfs://")) {
        return `https://${uri.slice(7)}.ipfs.nftstorage.link`;
    }
    return uri;
}

// Preferred gateways (ordered)
const GATEWAYS = [
    (cid: string) => `https://${cid}.ipfs.nftstorage.link`,
    (cid: string) => `https://ipfs.io/ipfs/${cid}`,
    (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
    (cid: string) => `https://${cid}.ipfs.dweb.link`,
];

/**
 * Try multiple gateways and return the first reachable URL.
 * Falls back to default ipfsToHttp if all fail.
 */
export async function resolveIpfsWithFallback(uri: string): Promise<string> {
    if (!uri) throw new Error("Empty URI");

    // If already http(s), just return
    if (!uri.startsWith("ipfs://")) {
        return uri;
    }

    const cidPath = uri.replace("ipfs://", "").replace(/^ipfs\//, "");

    for (const build of GATEWAYS) {
        const url = build(cidPath);
        try {
            const res = await fetch(url, {method: "HEAD"});
            if (res.ok) return url;
        } catch (_) {
            // ignore and try next gateway
        }
    }

    // Last resort
    return ipfsToHttp(uri);
}
