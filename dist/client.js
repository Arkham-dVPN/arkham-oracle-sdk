"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleClient = void 0;
class OracleClient {
    /**
     * Creates a new OracleClient.
     * @param baseUrl - The base URL of the oracle API endpoint (e.g., "https://arkham-dvpn.vercel.app/api/price").
     */
    constructor(baseUrl) {
        if (!baseUrl) {
            throw new Error("Oracle API base URL cannot be empty.");
        }
        this.baseUrl = baseUrl;
    }
    /**
     * Fetches the signed price data from the oracle.
     * @param token - The token to get the price for (e.g., 'solana', 'usd-coin').
     * @param trustedKey - The trusted client key for authentication.
     * @returns A promise that resolves to the signed price data.
     */
    async fetchSignedPrice(token, trustedKey) {
        const params = new URLSearchParams({
            token: token,
        });
        if (trustedKey) {
            params.append("trustedClientKey", trustedKey);
        }
        const response = await fetch(`${this.baseUrl}?${params.toString()}`);
        if (!response.ok) {
            const errorBody = (await response.json().catch(() => ({ error: 'Failed to parse error response' })));
            throw new Error(`Failed to fetch signed price: ${response.status} ${response.statusText} - ${errorBody.error || 'Unknown error'}`);
        }
        const data = (await response.json());
        return data;
    }
}
exports.OracleClient = OracleClient;
