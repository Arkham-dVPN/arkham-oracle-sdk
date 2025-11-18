# Arkham Oracle SDK (JavaScript/TypeScript)

This package provides reusable helpers to create and interact with a custom Arkham-compatible oracle.

## Installation

```bash
pnpm add arkham-oracle-sdk
```

## For Servers: Creating an Oracle API

You can easily create a Next.js App Router compatible API endpoint to serve signed price data.

**`app/api/price/route.ts`**
```typescript
import { createNextJsAppRouterHandler } from 'arkham-oracle-sdk/server';

// Ensure your environment variables are set in .env.local
// ORACLE_PRIVATE_KEY="[...]"
// TRUSTED_CLIENT_KEYS="..."

export const GET = createNextJsAppRouterHandler({
  oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
  trustedClientKeys: process.env.TRUSTED_CLIENT_KEYS,
});
```

## For Clients: Fetching Signed Prices

You can use the `OracleClient` to easily fetch signed price data from any compatible oracle endpoint.

```typescript
import { OracleClient } from 'arkham-oracle-sdk/client';

async function main() {
  const oracle = new OracleClient("https://arkham-dvpn.vercel.app/api/price");

  try {
    const signedPrice = await oracle.fetchSignedPrice(
      'solana',
      'your-trusted-client-key'
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
