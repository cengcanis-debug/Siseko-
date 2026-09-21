/**
 * SARS GPS TRAVEL LOGBOOK COMPLIANCE ENGINE (2026/2027 TAX YEAR)
 * Designed under Section 8(1)(b) of the Income Tax Act No. 58 of 1962 (South Africa).
 * Targets FICA & POPIA Secured Local Data residency standards.
 */

export interface GPSTripInput {
  timestamp: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  opening_odometer: number;
  closing_odometer: number;
  tag: 'Business' | 'Private';
  reason_for_trip?: string;
  client_name?: string;
  vehicle_value?: number; // Optional, used for scale-based calculations
  vehicle_registration?: string;
  // Corroborating Petrol Station / Fuel Invoice Pinning
  petrol_invoice_id?: string;
  petrol_station_name?: string;
  petrol_station_latitude?: number;
  petrol_station_longitude?: number;
  petrol_invoice_amount?: number;
}

export interface GPSTripOutput {
  id: string;
  timestamp: string;
  date: string;
  vehicle_registration: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  opening_odometer: number;
  closing_odometer: number;
  odometer_distance: number;
  gps_distance: number;
  distance_variance: number; // discrepancy between GPS and Odometer
  variance_percent: number;
  tag: 'Business' | 'Private';
  reason_for_trip: string;
  client_name: string;
  reimbursement_rate_per_km: number; // ZAR rate applied
  reimbursement_amount: number; // ZAR total reimbursement
  validation_status: 'Compliant' | 'Warning' | 'Disallowed';
  validation_messages: string[];
  // Pinned Petrol Station Route Corroboration
  petrol_invoice_id?: string;
  petrol_station_name?: string;
  petrol_station_latitude?: number;
  petrol_station_longitude?: number;
  petrol_invoice_amount?: number;
  petrol_pinned?: boolean;
  station_distance_to_route_km?: number;
  petrol_reach_status?: 'Within Route Reach' | 'Out of Route Proximity' | 'No Invoice Pinned';
}

export interface LogbookSummary {
  total_trips: number;
  total_business_trips: number;
  total_private_trips: number;
  total_distance_km: number;
  total_business_km: number;
  total_private_km: number;
  odometer_total_km: number;
  business_percentage: number;
  total_reimbursement_zar: number;
  audit_status: 'Audit-Ready' | 'Caution' | 'Requires Verification';
  compliance_score: number; // 0 to 100
}

/**
 * Calculates the distance between two GPS coordinates using the Haversine formula.
 * Earth's mean radius = 6,371 km.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Number(distance.toFixed(2)); // Return rounded to 2 decimal places
}

/**
 * Calculates the shortest distance (in km) from a petrol station to the claimed travel route.
 * Tests proximity to start location, end location, and intermediate points along the route segment.
 */
export function calculateStationDistanceToRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  stationLat: number,
  stationLon: number
): number {
  // Distance from station to origin and destination
  const distToStart = calculateHaversineDistance(stationLat, stationLon, startLat, startLon);
  const distToEnd = calculateHaversineDistance(stationLat, stationLon, endLat, endLon);
  
  // Sample intermediate points along the claimed direct transit corridor (10 steps)
  let minIntermediateDist = Math.min(distToStart, distToEnd);
  for (let step = 1; step < 10; step++) {
    const fraction = step / 10;
    const interLat = startLat + (endLat - startLat) * fraction;
    const interLon = startLon + (endLon - startLon) * fraction;
    const distToInter = calculateHaversineDistance(stationLat, stationLon, interLat, interLon);
    if (distToInter < minIntermediateDist) {
      minIntermediateDist = distToInter;
    }
  }

  return Number(minIntermediateDist.toFixed(2));
}

/**
 * SARS 2026/2027 Prescribed Travel Allowance cost scales under Section 8(1)(b)
 */
export interface SARSTravelAllowanceBracket {
  limit: number;
  fixed_cost: number; // ZAR
  fuel_cost: number;  // Cents per km
  maintenance_cost: number; // Cents per km
}

export const SARS_2026_2027_TRAVEL_BRACKETS: SARSTravelAllowanceBracket[] = [
  { limit: 105000, fixed_cost: 36115, fuel_cost: 143.0, maintenance_cost: 51.5 },
  { limit: 210000, fixed_cost: 63948, fuel_cost: 153.0, maintenance_cost: 59.5 },
  { limit: 315000, fixed_cost: 90565, fuel_cost: 163.0, maintenance_cost: 66.5 },
  { limit: 420000, fixed_cost: 114354, fuel_cost: 175.0, maintenance_cost: 74.5 },
  { limit: 525000, fixed_cost: 138143, fuel_cost: 203.0, maintenance_cost: 91.5 },
  { limit: 630000, fixed_cost: 164760, fuel_cost: 212.0, maintenance_cost: 107.5 },
  { limit: 735000, fixed_cost: 191377, fuel_cost: 221.0, maintenance_cost: 111.5 },
  { limit: 840000, fixed_cost: 217994, fuel_cost: 230.0, maintenance_cost: 120.5 },
  { limit: Infinity, fixed_cost: 217994, fuel_cost: 230.0, maintenance_cost: 120.5 }, // capped at 840k unless actual records used
];

export const SARS_PRESCRIBED_SIMPLIFIED_RATE = 4.84; // R4.84 per kilometer for 2026/2027 tax year

/**
 * Calculates SARS Rate-Per-Kilometer based on vehicle value.
 * If no vehicle value is supplied, defaults to the simplified SARS prescribed rate of R4.84/km.
 */
export function getSARSKmRate(vehicleValue?: number, totalKmsAnnually: number = 32000): number {
  if (!vehicleValue || vehicleValue <= 0) {
    return SARS_PRESCRIBED_SIMPLIFIED_RATE;
  }
  
  // Find matching bracket
  const bracket = SARS_2026_2027_TRAVEL_BRACKETS.find(b => vehicleValue <= b.limit) || 
                  SARS_2026_2027_TRAVEL_BRACKETS[SARS_2026_2027_TRAVEL_BRACKETS.length - 1];
                  
  // Fixed Cost translated to cents per kilometer (assuming total annual business/private km base)
  const fixedCentsPerKm = (bracket.fixed_cost / Math.max(1, totalKmsAnnually)) * 100;
  const totalCentsPerKm = fixedCentsPerKm + bracket.fuel_cost + bracket.maintenance_cost;
  
  return Number((totalCentsPerKm / 100).toFixed(2)); // Convert to ZAR
}

/**
 * Processes GPS tracks and validates against manual odometer readings.
 * Returns fully enriched compliant trips and warning structures.
 */
export function processGPSTracks(
  tracks: GPSTripInput[]
): { trips: GPSTripOutput[]; summary: LogbookSummary } {
  let totalTrips = 0;
  let totalBusinessTrips = 0;
  let totalPrivateTrips = 0;
  let totalDistanceKm = 0;
  let totalBusinessKm = 0;
  let totalPrivateKm = 0;
  let odometerTotalKm = 0;
  let totalReimbursementZar = 0;
  let compliantTripsCount = 0;

  const trips: GPSTripOutput[] = tracks.map((track, idx) => {
    totalTrips++;
    const gpsDistance = calculateHaversineDistance(
      track.start_latitude,
      track.start_longitude,
      track.end_latitude,
      track.end_longitude
    );

    const odometerDistance = Math.max(0, track.closing_odometer - track.opening_odometer);
    odometerTotalKm += odometerDistance;

    const distanceVariance = Math.abs(odometerDistance - gpsDistance);
    const maxDistance = Math.max(1, odometerDistance);
    const variancePercent = Number(((distanceVariance / maxDistance) * 100).toFixed(1));

    const isBusiness = track.tag === 'Business';
    if (isBusiness) {
      totalBusinessTrips++;
    } else {
      totalPrivateTrips++;
    }

    const validationMessages: string[] = [];
    let validationStatus: 'Compliant' | 'Warning' | 'Disallowed' = 'Compliant';

    // 1. Business Validation Check
    if (isBusiness) {
      if (!track.reason_for_trip || track.reason_for_trip.trim().length < 5) {
        validationStatus = 'Disallowed';
        validationMessages.push('SARS Compliance Violation: Detailed "Reason for Trip" (min 5 chars) is mandatory for business claims.');
      }
      if (!track.client_name || track.client_name.trim().length < 2) {
        validationStatus = 'Disallowed';
        validationMessages.push('SARS Compliance Violation: "Client Name" or "Company Visited" is required for business audits.');
      }
    }

    // 2. GPS vs Odometer Mismatch check
    if (variancePercent > 15 && odometerDistance > 5) {
      if (validationStatus !== 'Disallowed') {
        validationStatus = 'Warning';
      }
      validationMessages.push(`GPS Variance Alert: Calculated GPS path (${gpsDistance} km) differs from Manual Odometer (${odometerDistance} km) by ${variancePercent}%. Limit is 15%.`);
    }

    if (odometerDistance <= 0) {
      validationStatus = 'Disallowed';
      validationMessages.push('Odometer Error: Closing odometer reading must exceed opening odometer reading.');
    }

    // 3. Petrol Station Proximity & Route Reach Corroboration
    let petrolPinned = false;
    let stationDistanceToRouteKm: number | undefined;
    let petrolReachStatus: 'Within Route Reach' | 'Out of Route Proximity' | 'No Invoice Pinned' = 'No Invoice Pinned';

    if (track.petrol_invoice_id && track.petrol_station_latitude !== undefined && track.petrol_station_longitude !== undefined) {
      petrolPinned = true;
      stationDistanceToRouteKm = calculateStationDistanceToRoute(
        track.start_latitude,
        track.start_longitude,
        track.end_latitude,
        track.end_longitude,
        track.petrol_station_latitude,
        track.petrol_station_longitude
      );

      // SARS Rule: Petrol station must be within 15km of the claimed corridor
      if (stationDistanceToRouteKm <= 15.0) {
        petrolReachStatus = 'Within Route Reach';
        validationMessages.push(`Petrol Invoice Corroborated: Station "${track.petrol_station_name || 'Fuel Station'}" is ${stationDistanceToRouteKm} km from route (Within 15 km SARS corridor).`);
      } else {
        petrolReachStatus = 'Out of Route Proximity';
        if (validationStatus !== 'Disallowed') {
          validationStatus = 'Warning';
        }
        validationMessages.push(`Petrol Geolocation Discrepancy: Station "${track.petrol_station_name || 'Fuel Station'}" is ${stationDistanceToRouteKm} km away from route. Petrol station reference must be within reach of the route claimed.`);
      }
    }

    if (validationStatus === 'Compliant') {
      compliantTripsCount++;
    }

    // Rate calculations
    const kmRate = getSARSKmRate(track.vehicle_value);
    const finalDistance = odometerDistance; // SARS uses odometer-based distance for claims
    const reimbursement = isBusiness ? Number((finalDistance * kmRate).toFixed(2)) : 0;

    if (isBusiness) {
      totalBusinessKm += finalDistance;
      totalReimbursementZar += reimbursement;
    } else {
      totalPrivateKm += finalDistance;
    }
    totalDistanceKm += finalDistance;

    return {
      id: `TRIP-${idx + 1}-${Date.now().toString().slice(-4)}`,
      timestamp: track.timestamp,
      date: track.timestamp.split('T')[0],
      vehicle_registration: track.vehicle_registration || 'GP-12-BB-GP',
      start_latitude: track.start_latitude,
      start_longitude: track.start_longitude,
      end_latitude: track.end_latitude,
      end_longitude: track.end_longitude,
      opening_odometer: track.opening_odometer,
      closing_odometer: track.closing_odometer,
      odometer_distance: odometerDistance,
      gps_distance: gpsDistance,
      distance_variance: distanceVariance,
      variance_percent: variancePercent,
      tag: track.tag,
      reason_for_trip: track.reason_for_trip || '',
      client_name: track.client_name || '',
      reimbursement_rate_per_km: kmRate,
      reimbursement_amount: reimbursement,
      validation_status: validationStatus,
      validation_messages: validationMessages,
      petrol_invoice_id: track.petrol_invoice_id,
      petrol_station_name: track.petrol_station_name,
      petrol_station_latitude: track.petrol_station_latitude,
      petrol_station_longitude: track.petrol_station_longitude,
      petrol_invoice_amount: track.petrol_invoice_amount,
      petrol_pinned: petrolPinned,
      station_distance_to_route_km: stationDistanceToRouteKm,
      petrol_reach_status: petrolReachStatus,
    };
  });

  const businessPercentage = totalDistanceKm > 0 ? Number(((totalBusinessKm / totalDistanceKm) * 100).toFixed(1)) : 0;
  
  // Scoring
  const complianceRatio = totalTrips > 0 ? compliantTripsCount / totalTrips : 1;
  const complianceScore = Math.round(complianceRatio * 100);

  let auditStatus: 'Audit-Ready' | 'Caution' | 'Requires Verification' = 'Audit-Ready';
  if (complianceScore < 70) {
    auditStatus = 'Requires Verification';
  } else if (complianceScore < 95) {
    auditStatus = 'Caution';
  }

  return {
    trips,
    summary: {
      total_trips: totalTrips,
      total_business_trips: totalBusinessTrips,
      total_private_trips: totalPrivateTrips,
      total_distance_km: Number(totalDistanceKm.toFixed(2)),
      total_business_km: Number(totalBusinessKm.toFixed(2)),
      total_private_km: Number(totalPrivateKm.toFixed(2)),
      odometer_total_km: odometerTotalKm,
      business_percentage: businessPercentage,
      total_reimbursement_zar: Number(totalReimbursementZar.toFixed(2)),
      audit_status: auditStatus,
      compliance_score: complianceScore,
    },
  };
}

/**
 * Formats processed SARS logbook trips into a downloadable CSV string conforming to the standard SARS Template.
 */
export function generateSARSLogbookCSV(trips: GPSTripOutput[], summary: LogbookSummary): string {
  const headers = [
    'SARS TRIP ID',
    'DATE',
    'VEHICLE REGISTRATION',
    'OPENING ODOMETER (km)',
    'CLOSING ODOMETER (km)',
    'TOTAL KILOMETERS (km)',
    'BUSINESS KILOMETERS (km)',
    'PRIVATE KILOMETERS (km)',
    'TRIP TAG (Business/Private)',
    'CLIENT/COMPANY VISITED',
    'REASON FOR TRIP (SARS MANDATORY)',
    'PINNED PETROL INVOICE',
    'PETROL STATION NAME',
    'STATION REACH STATUS',
    'DISTANCE TO ROUTE (km)',
    'REIMBURSEMENT RATE (ZAR/km)',
    'CLAIMABLE AMOUNT (ZAR)',
    'COMPLIANCE STATUS',
    'AUDIT VERIFICATION NOTES'
  ];

  const rows = trips.map(trip => {
    return [
      `"${trip.id}"`,
      `"${trip.date}"`,
      `"${trip.vehicle_registration}"`,
      trip.opening_odometer,
      trip.closing_odometer,
      trip.odometer_distance,
      trip.tag === 'Business' ? trip.odometer_distance : 0,
      trip.tag === 'Private' ? trip.odometer_distance : 0,
      `"${trip.tag}"`,
      `"${trip.client_name.replace(/"/g, '""')}"`,
      `"${trip.reason_for_trip.replace(/"/g, '""')}"`,
      `"${trip.petrol_invoice_id || 'None'}"`,
      `"${(trip.petrol_station_name || 'N/A').replace(/"/g, '""')}"`,
      `"${trip.petrol_reach_status || 'No Invoice Pinned'}"`,
      trip.station_distance_to_route_km !== undefined ? trip.station_distance_to_route_km : 'N/A',
      trip.reimbursement_rate_per_km,
      trip.reimbursement_amount,
      `"${trip.validation_status}"`,
      `"${trip.validation_messages.join(' | ').replace(/"/g, '""')}"`
    ].join(',');
  });

  const summaryHeader = [
    '# =====================================================================',
    '# OFFICIAL SARS TRAVEL LOGBOOK EXPORT (SECTION 8(1)(b) COMPLIANT)',
    `# EXPORT TIMESTAMP: ${new Date().toISOString()}`,
    `# TOTAL LOGGED KILOMETERS: ${summary.total_distance_km} km`,
    `# TOTAL BUSINESS KILOMETERS: ${summary.total_business_km} km`,
    `# BUSINESS RATIO: ${summary.business_percentage}%`,
    `# AUDIT VAULT STATUS: ${summary.audit_status} (${summary.compliance_score}% Score)`,
    `# TOTAL SARS REIMBURSEMENT VALUE: R ${summary.total_reimbursement_zar}`,
    '# =====================================================================',
    ''
  ].join('\n');

  return summaryHeader + headers.join(',') + '\n' + rows.join('\n');
}
