/**
 * FEAT-002 Enhancement: Blockchain Timestamp Integration
 * 
 * Provides immutable timestamping of DPS calculations on blockchain
 * for audit trail and verification purposes.
 * 
 * @module blockchain-timestamp
 */

import { DPSResult } from './dps-calculation-engine';
import crypto from 'crypto';

// =====================================================
// Type Definitions
// =====================================================

export interface BlockchainTimestampResult {
  txHash: string;
  blockNumber?: number;
  timestamp: string;
  calculationHash: string;
}

export interface DPSCalculation {
  videoId: string;
  viralScore: number;
  percentileRank: number;
  classification: string;
  calculatedAt: string;
  auditId: string;
}

// =====================================================
// Configuration
// =====================================================

const BLOCKCHAIN_CONFIG = {
  enabled: process.env.BLOCKCHAIN_TIMESTAMP_ENABLED === 'true',
  network: process.env.BLOCKCHAIN_NETWORK || 'testnet',
  apiEndpoint: process.env.BLOCKCHAIN_API_ENDPOINT || '',
  apiKey: process.env.BLOCKCHAIN_API_KEY || '',
};

// =====================================================
// Core Functions
// =====================================================

/**
 * Create a cryptographic hash of the DPS calculation for blockchain storage
 * 
 * @param calculation - DPS calculation data
 * @returns SHA-256 hash of calculation data
 */
export function createCalculationHash(calculation: DPSCalculation): string {
  const data = JSON.stringify({
    videoId: calculation.videoId,
    viralScore: calculation.viralScore,
    percentileRank: calculation.percentileRank,
    classification: calculation.classification,
    calculatedAt: calculation.calculatedAt,
    auditId: calculation.auditId,
  });
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Timestamp a DPS calculation on blockchain
 * Creates an immutable record of the calculation for audit purposes
 * 
 * @param calculation - DPS calculation result to timestamp
 * @returns Transaction hash and blockchain metadata
 * @throws Error if blockchain API is unavailable or request fails
 */
export async function timestampPrediction(
  calculation: DPSCalculation
): Promise<BlockchainTimestampResult> {
  // Check if blockchain timestamping is enabled
  if (!BLOCKCHAIN_CONFIG.enabled) {
    console.log('Blockchain timestamping is disabled. Returning mock hash.');
    return createMockTimestamp(calculation);
  }
  
  // Validate configuration
  if (!BLOCKCHAIN_CONFIG.apiEndpoint || !BLOCKCHAIN_CONFIG.apiKey) {
    console.warn('Blockchain API configuration missing. Returning mock hash.');
    return createMockTimestamp(calculation);
  }
  
  try {
    // Create calculation hash
    const calculationHash = createCalculationHash(calculation);
    
    // Prepare blockchain transaction payload
    const payload = {
      hash: calculationHash,
      metadata: {
        videoId: calculation.videoId,
        auditId: calculation.auditId,
        calculatedAt: calculation.calculatedAt,
        classification: calculation.classification,
      },
      network: BLOCKCHAIN_CONFIG.network,
    };
    
    // Submit to blockchain API
    // NOTE: This is a placeholder implementation
    // Replace with actual blockchain API integration (e.g., Ethereum, Polygon, etc.)
    const response = await fetch(`${BLOCKCHAIN_CONFIG.apiEndpoint}/timestamp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BLOCKCHAIN_CONFIG.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Blockchain API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      txHash: result.transactionHash || result.txHash,
      blockNumber: result.blockNumber,
      timestamp: new Date().toISOString(),
      calculationHash,
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown blockchain error';
    console.error('Blockchain timestamp failed:', errorMsg);
    
    // Return mock timestamp on failure to not block DPS calculation
    return createMockTimestamp(calculation, errorMsg);
  }
}

/**
 * Create a mock timestamp for development/fallback scenarios
 * 
 * @param calculation - DPS calculation
 * @param reason - Reason for mock (optional)
 * @returns Mock blockchain timestamp result
 */
function createMockTimestamp(
  calculation: DPSCalculation,
  reason?: string
): BlockchainTimestampResult {
  const calculationHash = createCalculationHash(calculation);
  const mockTxHash = `mock_tx_${calculationHash.substring(0, 16)}`;
  
  if (reason) {
    console.log(`Mock blockchain timestamp created (reason: ${reason})`);
  }
  
  return {
    txHash: mockTxHash,
    timestamp: new Date().toISOString(),
    calculationHash,
  };
}

/**
 * Verify a blockchain timestamp
 * Checks if the calculation hash matches the blockchain record
 * 
 * @param txHash - Transaction hash to verify
 * @param calculation - Original calculation data
 * @returns True if verification succeeds, false otherwise
 */
export async function verifyTimestamp(
  txHash: string,
  calculation: DPSCalculation
): Promise<boolean> {
  if (!BLOCKCHAIN_CONFIG.enabled) {
    console.log('Blockchain verification is disabled.');
    return true; // Return true for mock timestamps
  }
  
  try {
    const calculationHash = createCalculationHash(calculation);
    
    // Query blockchain for transaction
    const response = await fetch(
      `${BLOCKCHAIN_CONFIG.apiEndpoint}/verify/${txHash}`,
      {
        headers: {
          'Authorization': `Bearer ${BLOCKCHAIN_CONFIG.apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Blockchain verification failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Compare stored hash with calculated hash
    return result.hash === calculationHash;
    
  } catch (error) {
    console.error('Blockchain verification error:', error);
    return false;
  }
}

/**
 * Batch timestamp multiple calculations
 * More efficient than individual timestamps for batch processing
 * 
 * @param calculations - Array of DPS calculations
 * @returns Array of blockchain timestamp results
 */
export async function batchTimestampPredictions(
  calculations: DPSCalculation[]
): Promise<BlockchainTimestampResult[]> {
  if (!BLOCKCHAIN_CONFIG.enabled) {
    return calculations.map(calc => createMockTimestamp(calc));
  }
  
  try {
    const hashes = calculations.map(calc => ({
      hash: createCalculationHash(calc),
      videoId: calc.videoId,
      auditId: calc.auditId,
    }));
    
    const response = await fetch(`${BLOCKCHAIN_CONFIG.apiEndpoint}/timestamp/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BLOCKCHAIN_CONFIG.apiKey}`,
      },
      body: JSON.stringify({ hashes, network: BLOCKCHAIN_CONFIG.network }),
    });
    
    if (!response.ok) {
      throw new Error(`Batch blockchain timestamp failed: ${response.statusText}`);
    }
    
    const results = await response.json();
    
    return results.map((result: any, index: number) => ({
      txHash: result.transactionHash || result.txHash,
      blockNumber: result.blockNumber,
      timestamp: new Date().toISOString(),
      calculationHash: hashes[index].hash,
    }));
    
  } catch (error) {
    console.error('Batch blockchain timestamp error:', error);
    return calculations.map(calc => createMockTimestamp(calc, 'batch error'));
  }
}

// =====================================================
// Exports
// =====================================================

export const BlockchainTimestamp = {
  timestampPrediction,
  verifyTimestamp,
  batchTimestampPredictions,
  createCalculationHash,
};

export default BlockchainTimestamp;


