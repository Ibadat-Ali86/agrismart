/**
 * @typedef {Object} MarketPriceProvider
 * @property {() => Promise<Array<object>>} fetchAllMarketPrices
 * @property {(city: string) => Promise<Array<object>>} fetchPricesByCity
 * @property {(cropName: string) => Promise<Array<object>>} fetchPricesByCrop
 */

/**
 * @typedef {Object} MarketPriceRepository
 * @property {(prices: Array<object>) => Promise<{inserted: number, updated: number, skipped: number}>} upsertMany
 * @property {(filters: object) => Promise<object>} list
 * @property {(filters: object) => Promise<Array<object>>} latest
 * @property {(filters: object) => Promise<Array<object>>} trends
 */

export {};