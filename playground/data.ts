import type { OHLCData } from "../src";

export function marketData(count = 1400): OHLCData[] {
  const output: OHLCData[] = [];
  let price = 64_000;
  let seed = 8421;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const start = Date.UTC(2026, 0, 12) - count * 5 * 60 * 1000;
  for (let index = 0; index < count; index += 1) {
    const open = price;
    const movement = (random() - 0.47) * 950;
    const close = Math.max(100, open + movement);
    const high = Math.max(open, close) + random() * 420;
    const low = Math.min(open, close) - random() * 420;
    output.push({
      time: start + index * 5 * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: 200 + random() * 1800,
    });
    price = close;
  }
  return output;
}
