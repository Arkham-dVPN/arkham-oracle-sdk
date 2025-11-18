/**
 * Configuration options for creating the oracle handler.
 */
export interface OracleHandlerOptions {
    /**
     * The 64-byte Ed25519 private key used for signing price data.
     * The first 32 bytes should be the private key seed.
     */
    oraclePrivateKey: Uint8Array;
    /**
     * Optional. An array of strings to use as API keys for authorization.
     * If this array is omitted or empty, the endpoint will be public.
     * Tip: You can generate strong keys using `openssl rand -base64 48`
     */
    trustedClientKeys?: string[];
}
export interface SignedPriceData {
    price: string;
    timestamp: string;
    signature: string;
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
 *   trustedClientKeys: trustedKeys, // Omit this line to make the endpoint public
 * });
 */
export declare function createOracleHandler(options: OracleHandlerOptions): (request: Request) => Promise<Response>;
