import type { NormalizedOHLC } from "../types";

export type IndicatorPoint = number | null;

export function sma(values: readonly number[], period: number): IndicatorPoint[] {
  if (!Number.isInteger(period) || period <= 0) throw new Error("SMA period must be a positive integer.");
  const output: IndicatorPoint[] = Array(values.length).fill(null);
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index]!;
    if (index >= period) sum -= values[index - period]!;
    if (index >= period - 1) output[index] = sum / period;
  }
  return output;
}

export function ema(values: readonly number[], period: number): IndicatorPoint[] {
  if (!Number.isInteger(period) || period <= 0) throw new Error("EMA period must be a positive integer.");
  const output: IndicatorPoint[] = Array(values.length).fill(null);
  if (values.length < period) return output;
  let average = 0;
  for (let index = 0; index < period; index += 1) average += values[index]!;
  average /= period;
  output[period - 1] = average;
  const multiplier = 2 / (period + 1);
  for (let index = period; index < values.length; index += 1) {
    average = (values[index]! - average) * multiplier + average;
    output[index] = average;
  }
  return output;
}

export function bollinger(
  values: readonly number[],
  period: number,
  deviation = 2,
): { middle: IndicatorPoint[]; upper: IndicatorPoint[]; lower: IndicatorPoint[] } {
  const middle = sma(values, period);
  const upper: IndicatorPoint[] = Array(values.length).fill(null);
  const lower: IndicatorPoint[] = Array(values.length).fill(null);
  for (let index = period - 1; index < values.length; index += 1) {
    const mean = middle[index]!;
    let squaredDifference = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      squaredDifference += (values[cursor]! - mean) ** 2;
    }
    const standardDeviation = Math.sqrt(squaredDifference / period);
    upper[index] = mean + standardDeviation * deviation;
    lower[index] = mean - standardDeviation * deviation;
  }
  return { middle, upper, lower };
}

export function closes(data: readonly NormalizedOHLC[]): number[] {
  return data.map((item) => item.close);
}
