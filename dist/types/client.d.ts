import { SignedPriceData } from './server.js';
export declare class OracleClient {
    private readonly baseUrl;
    /**
     * Creates a new OracleClient.
     * @param baseUrl - The base URL of the oracle API endpoint (e.g., "https://arkham-dvpn.vercel.app/api/price").
     */
    constructor(baseUrl: string);
    /**
     * Fetches the signed price data from the oracle.
     * @param token - The token to get the price for (e.g., 'solana', 'usd-coin').
     * @param trustedKey - The trusted client key for authentication.
     * @returns A promise that resolves to the signed price data.
     */
    fetchSignedPrice(token: string, trustedKey?: string): Promise<SignedPriceData>;
}
//# sourceMappingURL=client.d.ts.map