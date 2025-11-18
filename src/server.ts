import { keccak256 } from 'js-sha3';
import { sign } from '@noble/ed25519';

// --- Interfaces ---

export interface OracleHandlerOptions {
  oraclePrivateKey: Uint8Array;
  trustedClientKeys: string[];
}

export interface SignedPriceData {
  price: string;
  timestamp: string;
  signature: string;
}

// --- Private Helper Functions ---

/**
 * Parses a private key from a JSON string representation of a byte array.
 */
function parseKey(keyString: string): Uint8Array {
  try {
    const keyArray = JSON.parse(keyString);
    if (Array.isArray(keyArray) && keyArray.every(b => typeof b === 'number')) {
      return new Uint8Array(keyArray);
    }
  } catch (e) {
    console.error("Failed to parse private key string:", e);
  }
  throw new Error("Invalid private key format. Expected a JSON array of numbers.");
}

/**
 * The core logic for fetching, signing, and returning price data.
 * This is framework-agnostic and uses the standard Request and Response objects.
 */
export async function handlePriceRequest(
  request: Request,
  options: { oraclePrivateKey: Uint8Array; trustedClientKeys: string[] }
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const trustedClientKey = searchParams.get('trustedClientKey');
  const token = searchParams.get('token');

  // 1. Security Validation
  if (!trustedClientKey || !options.trustedClientKeys.includes(trustedClientKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token parameter is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // 2. Fetch Price from CoinGecko
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
    if (!response.ok) {
      throw new Error(`CoinGecko API failed with status: ${response.status}`);
    }
    const data = await response.json();
    const priceFloat = data[token]?.usd;

    if (typeof priceFloat !== 'number') {
      throw new Error(`Price for token '${token}' not found in CoinGecko response`);
    }

    // 3. Prepare Data for Signing
    const priceU64 = BigInt(Math.round(priceFloat * 1_000_000));
    const timestampI64 = BigInt(Math.floor(Date.now() / 1000));

    const messageBuffer = Buffer.alloc(16);
    messageBuffer.writeBigUInt64LE(priceU64, 0);
    messageBuffer.writeBigInt64LE(timestampI64, 8);

    const messageHash = Buffer.from(keccak256.digest(messageBuffer));

    // 4. Sign the Message Hash
    const privateKeySeed = options.oraclePrivateKey.slice(0, 32);
    const signature = await sign(messageHash, privateKeySeed);

    const responsePayload: SignedPriceData = {
      price: priceU64.toString(),
      timestamp: timestampI64.toString(),
      signature: Buffer.from(signature).toString('hex'),
    };

    // 5. Return the Data
    return new Response(JSON.stringify(responsePayload), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error in Oracle Handler:", error);
    return new Response(JSON.stringify({ error: `Internal Server Error: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * Creates a Next.js App Router compatible handler.
 * @param options - Configuration including private key and trusted client keys.
 * @returns A GET handler for use in a Next.js route file.
 *
 * @example
 * // In your app/api/price/route.ts
 * import { createNextJsAppRouterHandler } from 'arkham-oracle-sdk/server';
 *
 * export const GET = createNextJsAppRouterHandler({
 *   oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
 *   trustedClientKeys: process.env.TRUSTED_CLIENT_KEYS,
 * });
 */
export function createNextJsAppRouterHandler(
    env: { oraclePrivateKey?: string; trustedClientKeys?: string }
) {
    if (!env.oraclePrivateKey || !env.trustedClientKeys) {
        throw new Error("Missing ORACLE_PRIVATE_KEY or TRUSTED_CLIENT_KEYS environment variables.");
    }

    const options = {
        oraclePrivateKey: parseKey(env.oraclePrivateKey),
        trustedClientKeys: env.trustedClientKeys.split(','),
    };

    return (request: Request) => handlePriceRequest(request, options);
}
