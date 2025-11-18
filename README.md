# Arkham Oracle SDK (JavaScript/TypeScript)

The `arkham-oracle-sdk` provides a robust and verifiable off-chain oracle solution for JavaScript and TypeScript environments. It enables you to securely sign real-world price data, ensuring authenticity and integrity when delivering it to critical applications like smart contracts. This SDK simplifies the process of creating and interacting with a custom oracle that can serve cryptographically signed data, crucial for decentralized applications requiring trusted external information.

## Installation

```bash
pnpm add arkham-oracle-sdk
```

## For Servers: Creating an Oracle API

You can easily create an API endpoint to serve signed price data using the `createOracleHandler`. This handler is designed to be compatible with modern serverless environments (like Next.js App Router) and can be adapted for traditional Node.js servers (like Express.js).

### Next.js App Router Example

Configure your Next.js App Router API route (`app/api/price/route.ts`) to use the handler.

**`app/api/price/route.ts`**
```typescript
import { createOracleHandler } from 'arkham-oracle-sdk/server';

// 1. Parse the 64-byte oracle private key from your environment.
//    Example: ORACLE_PRIVATE_KEY="[194,18,35,...,62,121]"
const oraclePrivateKey = new Uint8Array(JSON.parse(process.env.ORACLE_PRIVATE_KEY!));

// 2. (Optional) Parse trusted client keys from your environment.
//    Example: TRUSTED_CLIENT_KEYS="key1,key2,key3"
//    Tip: Generate strong keys with `openssl rand -base64 48`
const trustedClientKeys = process.env.TRUSTED_CLIENT_KEYS?.split(',');

// 3. Create and export the GET handler
export const GET = createOracleHandler({
  oraclePrivateKey,
  trustedClientKeys, // Omit this property to make the endpoint public
  // dataSourceUrl: "https://my-custom-price-api.com/prices" // Optional: use a custom data source
});
```
**Note:** The `trustedClientKeys` option is optional. If you omit it, the API endpoint will not require an API key. The `dataSourceUrl` is also optional; if omitted, CoinGecko will be used by default.

### Express.js Server Example

You can integrate the `createOracleHandler` into an Express.js application.

```typescript
import express from 'express';
import { createOracleHandler } from 'arkham-oracle-sdk/server';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

// Load environment variables (e.g., using dotenv)
require('dotenv').config();

// Parse the 64-byte oracle private key from your environment.
const oraclePrivateKey = new Uint8Array(JSON.parse(process.env.ORACLE_PRIVATE_KEY!));

// (Optional) Parse trusted client keys from your environment.
const trustedClientKeys = process.env.TRUSTED_CLIENT_KEYS?.split(',');

// Create the core handler function
const oracleApiHandler = createOracleHandler({
  oraclePrivateKey,
  trustedClientKeys,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Express.js adapter for the universal handler
app.get('/api/price', async (req: ExpressRequest, res: ExpressResponse) => {
  // Convert Express.js Request to standard Request for the handler
  const url = new URL(req.url, `http://${req.headers.host}`);
  const standardRequest = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as HeadersInit,
  });

  // Call the universal handler
  const response = await oracleApiHandler(standardRequest);

  // Convert standard Response back to Express.js Response
  res.status(response.status);
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.send(await response.json());
});

app.listen(PORT, () => {
  console.log(`Express Oracle Server running on port ${PORT}`);
});
```

## For Clients: Fetching Signed Prices

You can use the `OracleClient` to easily fetch signed price data from any compatible oracle endpoint.

```typescript
import { OracleClient } from 'arkham-oracle-sdk/client';

async function main() {
  const oracle = new OracleClient("https://arkham-dvpn.vercel.app/api/price");

  try {
    // Fetch from a protected endpoint
    const signedPriceProtected = await oracle.fetchSignedPrice(
      'solana',
      'your-trusted-client-key'
    );
    console.log('Protected Price:', signedPriceProtected.price);

    // Fetch from a public endpoint (if the server is configured as such)
    const signedPricePublic = await oracle.fetchSignedPrice('ethereum');
    console.log('Public Price:', signedPricePublic.price);

    // This data can now be used to build a transaction for the Arkham smart contract.
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Use Cases

This SDK is ideal for scenarios where:

*   **Decentralized Finance (DeFi):** Providing tamper-proof price feeds for lending protocols, stablecoins, or derivatives on Solana and other blockchains.
*   **Decentralized VPNs (dVPNs):** As implememted in the (Arkham dVPN Protocol)[https://github.com/Arkham-dVPN], for securely valuing staked assets or bandwidth payments.
*   **Gaming & NFTs:** Integrating real-world asset prices or dynamic game parameters into blockchain-based games or NFT marketplaces.
*   **Supply Chain & Logistics:** Verifying real-time commodity prices or sensor data on-chain.
*   **Any Smart Contract Requiring External Data:** When a smart contract needs to react to off-chain information, this oracle provides a cryptographically secure bridge.


## Author: (David Nzube)[https://x.com/DavidNzubee]
