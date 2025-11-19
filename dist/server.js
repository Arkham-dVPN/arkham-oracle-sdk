"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOracleHandler = createOracleHandler;
const js_sha3_1 = require("js-sha3");
const ed25519_1 = require("@noble/ed25519");
// --- Core Logic ---
/**
 * The core logic for fetching, signing, and returning price data.
 * This is framework-agnostic and uses the standard Request and Response objects.
 */
async function handlePriceRequest(request, options) {
    const { searchParams } = new URL(request.url);
    const trustedClientKey = searchParams.get('trustedClientKey');
    const token = searchParams.get('token');
    // 1. Security Validation (Optional)
    if (options.trustedClientKeys && options.trustedClientKeys.length > 0) {
        if (!trustedClientKey || !options.trustedClientKeys.includes(trustedClientKey)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
    }
    // If trustedClientKeys is not provided, the check is skipped, and the endpoint is public.
    if (!token) {
        return new Response(JSON.stringify({ error: 'Token parameter is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    try {
        // 2. Fetch Price from Data Source (CoinGecko by default)
        let priceResponse;
        if (options.dataSourceUrl) {
            // Assuming the custom data source uses similar query parameters and response structure
            priceResponse = await fetch(`${options.dataSourceUrl}?ids=${token}&vs_currencies=usd`);
        }
        else {
            priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
        }
        if (!priceResponse.ok) {
            throw new Error(`Data source API failed with status: ${priceResponse.status}`);
        }
        const data = (await priceResponse.json());
        const priceFloat = data[token]?.usd;
        if (typeof priceFloat !== 'number') {
            throw new Error(`Price for token '${token}' not found in data source response`);
        }
        // 3. Prepare Data for Signing
        const priceU64 = BigInt(Math.round(priceFloat * 1000000));
        const timestampI64 = BigInt(Math.floor(Date.now() / 1000));
        const messageBuffer = Buffer.alloc(16);
        messageBuffer.writeBigUInt64LE(priceU64, 0);
        messageBuffer.writeBigInt64LE(timestampI64, 8);
        const messageHash = Buffer.from(js_sha3_1.keccak256.digest(messageBuffer));
        // 4. Sign the Message Hash
        const privateKeySeed = options.oraclePrivateKey.slice(0, 32);
        const signature = await (0, ed25519_1.sign)(messageHash, privateKeySeed);
        const responsePayload = {
            price: priceU64.toString(),
            timestamp: timestampI64.toString(),
            signature: Buffer.from(signature).toString('hex'),
        };
        // 5. Return the Data
        return new Response(JSON.stringify(responsePayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error in Oracle Handler:", error);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
/**
 * Creates a request handler compatible with modern serverless environments (Next.js, Cloudflare, etc.).
 * @param options The configuration for the oracle handler.
 *
 * @example
 * // In your app/api/price/route.ts
 * import { createOracleHandler } from 'arkham-oracle-sdk/server';
 *
 * // The private key can be parsed from a string in your .env file
 * const privateKey = new Uint8Array(JSON.parse(process.env.ORACLE_PRIVATE_KEY!));
 * const trustedKeys = process.env.TRUSTED_CLIENT_KEYS?.split(',');
 *
 * export const GET = createOracleHandler({
 *   oraclePrivateKey: privateKey,
 *   trustedClientKeys: trustedKeys, // Omit this property to make the endpoint public
 *   // dataSourceUrl: "https://my-custom-price-api.com/prices" // Optional: use a custom data source
 * });
 */
function createOracleHandler(options) {
    if (!options.oraclePrivateKey || options.oraclePrivateKey.length !== 64) {
        throw new Error("A 64-byte 'oraclePrivateKey' must be provided in the handler options.");
    }
    return (request) => handlePriceRequest(request, options);
}
