/**
 * DROVA Enterprise Quality Assurance & Production Compliance
 * ZERO FAKE DATA MANDATE:
 * Synthetic / procedural lead generation is strictly disabled across all environments.
 * The system exclusively discovers and accepts 100% verified real merchants from official APIs,
 * real web directories, and verified user imports.
 */

import { RawDiscoveryRecord } from './base';

export function generateRealisticAlgerianMerchants(params: {
  count: number;
  wilaya: string;
  commune?: string;
  categories: string[];
  source: string;
  startIndex?: number;
}): RawDiscoveryRecord[] {
  console.info('[DROVA Production Mandate] Synthetic generation is disabled. Zero fake records allowed.');
  return [];
}
