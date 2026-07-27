import { describe, expect, it } from "vitest";
import { parseCommodityPage } from "../src/services/amisScraperService.js";

const fixture = `
  <span id="lblMsg">Wheat</span>
  <table class="cart">
    <tr><th>PriceDate: 6/13/2026</th><th>Graph</th><th>Min</th><th>Max</th><th>FQP</th><th>Quantity</th></tr>
    <tr><td>1 Lahore</td><td>Graph</td><td>2,850</td><td>2,950</td><td>2,900</td><td>50</td></tr>
    <tr><td>2 Empty</td><td>Graph</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
  </table>`;

describe("AMIS parser", () => {
  it("normalizes valid price rows and skips empty rows", () => {
    const rows = parseCommodityPage(fixture, "1");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ cropName: "Wheat", city: "Lahore", minPrice: 2850, maxPrice: 2950, avgPrice: 2900, unit: "100kg", date: "2026-06-13" });
  });

  it("uses the midpoint when FQP is missing", () => {
    const rows = parseCommodityPage(fixture.replace("<td>2,900</td>", "<td>-</td>"), "1");
    expect(rows[0].avgPrice).toBe(2900);
  });
});