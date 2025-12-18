/*
Usage:
  node scripts/test-metadata-uri.js --uri ipfs://CID[/path]
  node scripts/test-metadata-uri.js --uri data:application/json;base64,...

Or fetch tokenURI from chain:
  node scripts/test-metadata-uri.js --rpc http://127.0.0.1:8545 --nft 0x... --tokenId 1

Exit codes:
  0 = successfully fetched & parsed metadata
  1 = failed to fetch/parse metadata
*/

const { ethers } = require("ethers");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--uri") args.uri = argv[++i];
    else if (a === "--rpc") args.rpc = argv[++i];
    else if (a === "--nft") args.nft = argv[++i];
    else if (a === "--tokenId") args.tokenId = argv[++i];
    else if (!args.uri && !a.startsWith("--")) args.uri = a;
  }
  return args;
}

function ipfsUriToCidPath(uri) {
  let cidPath = uri.replace(/^ipfs:\/\//, "");
  cidPath = cidPath.replace(/^ipfs\//, "");
  cidPath = cidPath.replace(/^\/+/, "");
  if (!cidPath) throw new Error("Invalid IPFS URI");
  return cidPath;
}

function buildGatewayUrls(cidPath) {
  return [
    `https://ipfs.io/ipfs/${cidPath}`,
    `https://dweb.link/ipfs/${cidPath}`,
    `https://nftstorage.link/ipfs/${cidPath}`,
    `https://cloudflare-ipfs.com/ipfs/${cidPath}`,
  ];
}

function decodeDataJson(uri) {
  const comma = uri.indexOf(",");
  if (comma === -1) throw new Error("Invalid data URI");
  const payload = uri.slice(comma + 1);
  if (uri.includes(";base64,")) {
    const jsonText = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(jsonText);
  }
  return JSON.parse(decodeURIComponent(payload));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "metadata-tester/1.0",
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();

  return { res, contentType, bodyText };
}

async function main() {
  const args = parseArgs(process.argv);

  let uri = args.uri;
  if (!uri && args.rpc && args.nft && args.tokenId != null) {
    const provider = new ethers.JsonRpcProvider(args.rpc);
    const abi = ["function tokenURI(uint256 tokenId) view returns (string)"];
    const nft = new ethers.Contract(args.nft, abi, provider);
    uri = await nft.tokenURI(BigInt(args.tokenId));
    console.log("tokenURI:", uri);
  }

  if (!uri) {
    console.error("Missing --uri (or --rpc + --nft + --tokenId)");
    process.exit(1);
  }

  try {
    if (uri.startsWith("data:application/json")) {
      const obj = decodeDataJson(uri);
      console.log("OK: data: URI parsed as JSON");
      console.log("keys:", Object.keys(obj));
      process.exit(0);
    }

    if (uri.startsWith("ipfs://")) {
      const cidPath = ipfsUriToCidPath(uri);
      const urls = buildGatewayUrls(cidPath);

      let lastErr = null;
      for (const url of urls) {
        try {
          const { res, contentType, bodyText } = await fetchJson(url);
          console.log(
            `GET ${url} -> ${res.status} ${res.statusText} (${
              contentType || "no content-type"
            })`
          );

          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status}`);
            continue;
          }

          // Try JSON parse
          const parsed = JSON.parse(bodyText);
          console.log("OK: JSON parsed");
          console.log("keys:", Object.keys(parsed));
          process.exit(0);
        } catch (e) {
          lastErr = e;
          console.log(`FAILED ${url}:`, e && e.message ? e.message : String(e));
        }
      }

      console.error("All gateways failed.");
      if (lastErr)
        console.error("Last error:", lastErr.message || String(lastErr));
      process.exit(1);
    }

    // http(s)
    const { res, contentType, bodyText } = await fetchJson(uri);
    console.log(
      `GET ${uri} -> ${res.status} ${res.statusText} (${
        contentType || "no content-type"
      })`
    );
    if (!res.ok) process.exit(1);
    JSON.parse(bodyText);
    console.log("OK: JSON parsed");
    process.exit(0);
  } catch (e) {
    console.error("Failed:", e && e.message ? e.message : String(e));
    process.exit(1);
  }
}

main();
