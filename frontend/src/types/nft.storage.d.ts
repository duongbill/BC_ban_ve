declare module "nft.storage" {
  export class NFTStorage {
    constructor(options: { token: string });

    store(data: unknown): Promise<{ url: string }>;

    storeBlob(blob: Blob): Promise<string>;
  }
}
