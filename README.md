# Arkham Oracle SDK (JavaScript/TypeScript)

This package provides reusable helpers to create and interact with a custom Arkham-compatible oracle.

## Installation

```bash
pnpm add arkham-oracle-sdk
```

## For Servers: Creating an Oracle API

You can easily create a Next.js App Router compatible API endpoint to serve signed price data. The handler is configured by passing options directly, not by reading `process.env`.

**`app/api/price/route.ts`**
```typescript
import { createOracleHandler } from 'arkham-oracle-sdk/server';

// 1. Parse the private key from your .env.local file
// ORACLE_PRIVATE_KEY="[1,2,3,...]"
const privateKey = new Uint8Array(JSON.parse(process.env.ORACLE_PRIVATE_KEY!));

// 2. (Optional) Parse the trusted client keys
// TRUSTED_CLIENT_KEYS="key1,key2,key3"
const trustedKeys = process.env.TRUSTED_CLIENT_KEYS?.split(',');

// 3. Create the handler
export const GET = createOracleHandler({
  oraclePrivateKey: privateKey,
  trustedClientKeys: trustedKeys, // Omit this property to make the endpoint public
  // dataSourceUrl: "https://my-custom-price-api.com/prices" // Optional: use a custom data source
});
```
**Note:** The `trustedClientKeys` option is optional. If you omit it, the API endpoint will not require an API key. The `dataSourceUrl` is also optional; if omitted, CoinGecko will be used by default.

## For Clients: Fetching Signed Prices

You can use the `OracleClient` to easily fetch signed price data from any compatible oracle endpoint.

```typescript
import { OracleClient } from 'arkham-oracle-sdk/client';

async function main() {
  const oracle = new OracleClient("https://arkham-dvpn.vercel.app/api/price");

  try {
    const signedPrice = await oracle.fetchSignedPrice(
      'solana',
      'your-trusted-client-key' // This is not needed if the endpoint is public
    );

    console.log('Successfully fetched signed price data:');
    console.log('Price:', signedPrice.price);
    console.log('Timestamp:', signedPrice.timestamp);
    console.log('Signature:', signedPrice.signature);

    // This data can now be used to build a transaction for the Arkham smart contract.
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```
