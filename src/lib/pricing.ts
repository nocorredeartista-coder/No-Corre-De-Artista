/**
 * Pricing logic for No Corre Mob
 * 
 * Standard: R$ 4.00/km + base fee (R$ 10-15)
 * Artist/Equipment: + R$ 10-30
 * Elderly: Monthly plans (handled separately)
 */

export const BASE_FEE = 12.50;
export const KM_RATE = 4.00;

export type RideType = 'comum' | 'idoso' | 'artista' | 'equipamento';

export interface QuoteRequest {
  origin: string;
  destination: string;
  type: RideType;
  distanceKm: number;
  time?: string; // HH:mm format
  isSpecialEvent?: boolean;
  demandLevel?: 'low' | 'normal' | 'high' | 'peak';
}

export interface QuoteResult {
  estimatedValue: number;
  estimatedTime: string;
  distanceKm: number;
  breakdown: {
    base: number;
    distance: number;
    surcharge: number;
    peakAdjustment: number;
  };
}

const checkIsPeakHour = (timeStr?: string): boolean => {
  if (!timeStr) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  // Peak hours: 07:00-09:00 and 17:00-19:00
  const peak1Start = 7 * 60;
  const peak1End = 9 * 60;
  const peak2Start = 17 * 60;
  const peak2End = 19 * 60;

  return (totalMinutes >= peak1Start && totalMinutes <= peak1End) ||
         (totalMinutes >= peak2Start && totalMinutes <= peak2End);
};

export const calculateQuote = (request: QuoteRequest): QuoteResult => {
  // 1. Base Fee Adjustment based on Demand
  let currentBaseFee = BASE_FEE;
  const demandMultipliers = {
    low: 0.9,
    normal: 1.0,
    high: 1.2,
    peak: 1.5
  };
  currentBaseFee *= demandMultipliers[request.demandLevel || 'normal'];

  // 2. Distance Adjustment (Long distance discount)
  let currentKmRate = KM_RATE;
  if (request.distanceKm > 20) {
    currentKmRate *= 0.85; // 15% discount for long trips
  } else if (request.distanceKm < 5) {
    currentKmRate *= 1.15; // 15% surcharge for very short trips to ensure driver profit
  }

  const distanceValue = request.distanceKm * currentKmRate;

  // 3. Type Surcharge
  let surcharge = 0;
  if (request.type === 'artista' || request.type === 'equipamento') {
    surcharge = 20.00;
  } else if (request.type === 'idoso') {
    surcharge = 5.00; // Small care fee
  }

  // 4. Peak Hour and Special Event Adjustments
  let peakAdjustment = 0;
  const isPeak = checkIsPeakHour(request.time);
  
  if (isPeak) {
    peakAdjustment += (currentBaseFee + distanceValue) * 0.25; // 25% peak surcharge
  }

  if (request.isSpecialEvent) {
    peakAdjustment += 15.00; // Fixed event fee
  }

  let total = currentBaseFee + distanceValue + surcharge + peakAdjustment;

  // Round to 2 decimal places
  total = Math.round(total * 100) / 100;

  return {
    estimatedValue: total,
    estimatedTime: `${Math.round(request.distanceKm * 2.5 + (isPeak ? 10 : 5))} min`,
    distanceKm: request.distanceKm,
    breakdown: {
      base: Math.round(currentBaseFee * 100) / 100,
      distance: Math.round(distanceValue * 100) / 100,
      surcharge: Math.round(surcharge * 100) / 100,
      peakAdjustment: Math.round(peakAdjustment * 100) / 100,
    }
  };
};
