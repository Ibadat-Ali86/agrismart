export const openapi = {
  openapi: "3.0.3",
  info: { title: "AgriSmart Market Price API", version: "1.0.0", description: "Daily Pakistan wholesale crop prices sourced from AMIS with PostgreSQL snapshot and optional Redis caching." },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      MarketPrice: { type: "object", properties: { cropName: { type: "string" }, city: { type: "string" }, market: { type: "string" }, minPrice: { type: "number", nullable: true }, maxPrice: { type: "number", nullable: true }, avgPrice: { type: "number" }, previousAvgPrice: { type: "number", nullable: true }, changePercent: { type: "number", nullable: true }, unit: { type: "string" }, date: { type: "string", format: "date" }, source: { type: "string", example: "AMIS" } } },
      Error: { type: "object", properties: { ok: { type: "boolean", example: false }, error: { type: "string" }, details: { type: "object" } } },
    },
  },
  paths: {
    "/market-prices": { get: { summary: "List price snapshots", parameters: ["city", "crop", "market", "date", "page", "limit"].map((name) => ({ in: "query", name, schema: { type: name === "page" || name === "limit" ? "integer" : "string" } })), responses: { 200: { description: "Paginated price snapshots" }, 400: { description: "Invalid filters" } } } },
    "/market-prices/cities": { get: { summary: "List available cities", responses: { 200: { description: "Cities" } } } },
    "/market-prices/crops": { get: { summary: "List available crops", responses: { 200: { description: "Crops" } } } },
    "/market-prices/latest": { get: { summary: "Latest prices with change percentages", responses: { 200: { description: "Latest snapshot" } } } },
    "/market-prices/trends": { get: { summary: "Historical price trend", parameters: [{ in: "query", name: "city", required: true, schema: { type: "string" } }, { in: "query", name: "crop", required: true, schema: { type: "string" } }, { in: "query", name: "days", schema: { type: "integer", minimum: 2, maximum: 365, default: 30 } }], responses: { 200: { description: "Daily trend points" } } } },
    "/market-prices/dashboard": { get: { summary: "Market analytics dashboard", responses: { 200: { description: "Aggregated analytics" } } } },
    "/admin/market-prices/sync": { post: { summary: "Trigger AMIS synchronization", security: [{ bearerAuth: [] }], responses: { 200: { description: "Sync result" }, 401: { description: "Authentication required" }, 403: { description: "Admin role required" }, 409: { description: "Sync already running" } } } },
    "/admin/market-prices/logs": { get: { summary: "List synchronization logs", security: [{ bearerAuth: [] }], responses: { 200: { description: "Paginated sync logs" } } } },
  },
};