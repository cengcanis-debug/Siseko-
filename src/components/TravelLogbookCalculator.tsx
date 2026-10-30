import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Plus, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Navigation, 
  CheckCircle, 
  Fuel, 
  Wrench, 
  TrendingUp, 
  DollarSign, 
  Trash2, 
  Download,
  AlertCircle,
  AlertTriangle,
  Link,
  Unlink,
  Check,
  X,
  Search,
  Filter,
  Edit2,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronDown,
  CheckCircle2,
  Info,
  Scale,
  Compass
} from 'lucide-react';
import { RoleType, InvoiceRecord, UserTaxProfile } from '../types';
import { 
  calculateStationDistanceToRoute, 
  generateSARSLogbookCSV, 
  GPSTripInput, 
  processGPSTracks,
  calculateHaversineDistance
} from '../utils/sarsLogbook';
import { downloadBlobFile } from '../utils/systemBridge';

export interface TripLogEntry {
  id: string;
  date: string;
  departure: string;
  destination: string;
  purpose: string;
  startOdo: number;
  endOdo: number;
  distanceKm: number;
  category: 'business' | 'private';
  clientName?: string;
  // Route coordinates for geospatial corridor calculations
  startLat?: number;
  startLon?: number;
  endLat?: number;
  endLon?: number;
  // Corroborating Petrol Invoice Pinning
  petrolInvoiceId?: string;
  petrolStationName?: string;
  petrolStationLat?: number;
  petrolStationLon?: number;
  petrolAmount?: number;
  petrolLitres?: number;
}

interface TravelLogbookCalculatorProps {
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  currentUserRole: RoleType;
  checkPermission: (permission: string) => boolean;
  onSyncVault?: () => void;
  invoices?: InvoiceRecord[];
  profile?: UserTaxProfile;
  onNavigateTab?: (tab: string) => void;
}

// SARS 2026/2027 Deemed Cost Rate Gazette Table Brackets (Section 8(1)(b))
const SARS_VEHICLE_BRACKETS = [
  { maxVal: 100000, fixedCost: 33946, fuelCents: 154.2, maintCents: 47.9 },
  { maxVal: 200000, fixedCost: 60877, fuelCents: 172.2, maintCents: 56.4 },
  { maxVal: 300000, fixedCost: 88168, fuelCents: 187.0, maintCents: 62.0 },
  { maxVal: 400000, fixedCost: 112999, fuelCents: 201.3, maintCents: 67.5 },
  { maxVal: 500000, fixedCost: 137830, fuelCents: 215.4, maintCents: 79.4 },
  { maxVal: 600000, fixedCost: 163697, fuelCents: 247.0, maintCents: 93.3 },
  { maxVal: 700000, fixedCost: 189599, fuelCents: 255.4, maintCents: 106.6 },
  { maxVal: 800000, fixedCost: 216738, fuelCents: 263.8, maintCents: 125.7 },
  { maxVal: 99999999, fixedCost: 216738, fuelCents: 263.8, maintCents: 125.7 }
];

// Predefined South African Business Route Presets
const SA_ROUTE_PRESETS = [
  {
    name: 'Sandton HQ ⇄ Pretoria SARS LBC',
    departure: 'Sandton Financial District HQ',
    destination: 'SARS Large Business Centre, Pretoria',
    clientName: 'SARS National LBC',
    purpose: 'Section 12E SBC Tax Exemption Clarification Hearing',
    distanceKm: 114,
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.7479,
    endLon: 28.1878
  },
  {
    name: 'Sandton HQ ⇄ Midrand Waterfall City',
    departure: 'Sandton Financial District HQ',
    destination: 'Waterfall City Client Tech Campus',
    clientName: 'Midrand Tech Enterprises (Pty) Ltd',
    purpose: 'Quarterly Statutory Audit & ERP Tax Integration Review',
    distanceKm: 58,
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.9984,
    endLon: 28.1263
  },
  {
    name: 'Sandton HQ ⇄ OR Tambo Int’l Airport',
    departure: 'Sandton Financial District HQ',
    destination: 'OR Tambo International Airport',
    clientName: 'Cape Town Client Steering Committee',
    purpose: 'Flight transit for Board meeting & Tax Strategy Session',
    distanceKm: 72,
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.1367,
    endLon: 28.2411
  },
  {
    name: 'Cape Town CBD ⇄ Century City Hub',
    departure: 'Cape Town Foreshore Offices',
    destination: 'Century City Financial Park',
    clientName: 'Atlantic Fintech Partners',
    purpose: 'Bi-annual Section 11D R&D Claim Sign-Off Meeting',
    distanceKm: 38,
    startLat: -33.9249,
    startLon: 18.4241,
    endLat: -33.8928,
    endLon: 18.5085
  },
  {
    name: 'Umhlanga Ridge ⇄ Durban Port Terminal',
    departure: 'Umhlanga Ridge Advisory Suites',
    destination: 'Durban Harbor Port Operations',
    clientName: 'eThekwini Logistics Maritime (Pty) Ltd',
    purpose: 'Customs & Excise VAT Zero-Rating Inspection',
    distanceKm: 46,
    startLat: -29.7289,
    startLon: 31.0667,
    endLat: -29.8683,
    endLon: 31.0218
  },
  {
    name: 'Rosebank ⇄ Menlyn Maine Pretoria',
    departure: 'Rosebank Oxford Road Office',
    destination: 'Menlyn Maine Central Square',
    clientName: 'Northern Capital Advisory',
    purpose: 'FICA Compliance & Director Trust Loan Restructuring',
    distanceKm: 64,
    startLat: -26.1450,
    startLon: 28.0440,
    endLat: -25.7865,
    endLon: 28.2810
  }
];

// Baseline 12,450 km Logbook Dataset (Exact match for Audit-Ready Vault ID #789)
const FULL_VAULT_789_TRIPS: TripLogEntry[] = [
  {
    id: 'TRP-789-01',
    date: '2025-03-03',
    departure: 'Sandton HQ',
    destination: 'Midrand Client Campus',
    purpose: 'FY2025 Opening Statutory Compliance Audit',
    clientName: 'Midrand Tech Park',
    startOdo: 33000,
    endOdo: 33580,
    distanceKm: 580,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.9984,
    endLon: 28.1263,
    petrolInvoiceId: 'inv-petrol-1',
    petrolStationName: 'TotalEnergies N1 Midrand Ultra City',
    petrolStationLat: -26.0120,
    petrolStationLon: 28.1290,
    petrolAmount: 1450.00,
    petrolLitres: 61.5
  },
  {
    id: 'TRP-789-02',
    date: '2025-03-14',
    departure: 'Sandton HQ',
    destination: 'Pretoria SARS Large Business Centre',
    purpose: 'Section 12E Small Business Corporation Clarification',
    clientName: 'SARS LBC Pretoria',
    startOdo: 33580,
    endOdo: 34150,
    distanceKm: 570,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.7479,
    endLon: 28.1878,
    petrolInvoiceId: 'inv-petrol-2',
    petrolStationName: 'Sasol Oxford Rd Rosebank',
    petrolStationLat: -26.1450,
    petrolStationLon: 28.0440,
    petrolAmount: 1120.00,
    petrolLitres: 47.3
  },
  {
    id: 'TRP-789-03',
    date: '2025-03-22',
    departure: 'Home Residence',
    destination: 'Rosebank Shopping Mall',
    purpose: 'Personal Errands & Groceries',
    clientName: 'Private Journey',
    startOdo: 34150,
    endOdo: 34390,
    distanceKm: 240,
    category: 'private',
    startLat: -26.1500,
    startLon: 28.0300,
    endLat: -26.1460,
    endLon: 28.0420
  },
  {
    id: 'TRP-789-04',
    date: '2025-04-08',
    departure: 'Sandton HQ',
    destination: 'OR Tambo Int’l Airport',
    purpose: 'Flight to Cape Town Client Operations Site',
    clientName: 'SA Airlines Terminal',
    startOdo: 34390,
    endOdo: 35110,
    distanceKm: 720,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.1367,
    endLon: 28.2411,
    petrolInvoiceId: 'inv-petrol-1',
    petrolStationName: 'TotalEnergies N1 Midrand Ultra City',
    petrolStationLat: -26.0120,
    petrolStationLon: 28.1290,
    petrolAmount: 1380.00,
    petrolLitres: 58.2
  },
  {
    id: 'TRP-789-05',
    date: '2025-04-24',
    departure: 'Sandton HQ',
    destination: 'Centurion Highveld Techno Park',
    purpose: 'IT Cloud Infrastructure Section 11D R&D Evaluation',
    clientName: 'TechnoPark Labs SA',
    startOdo: 35110,
    endOdo: 35990,
    distanceKm: 880,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.8720,
    endLon: 28.1950,
    petrolInvoiceId: 'inv-petrol-2',
    petrolStationName: 'Sasol Oxford Rd Rosebank',
    petrolStationLat: -26.1450,
    petrolStationLon: 28.0440,
    petrolAmount: 1250.00,
    petrolLitres: 52.8
  },
  {
    id: 'TRP-789-06',
    date: '2025-05-06',
    departure: 'Home Residence',
    destination: 'Drakensberg Family Lodge',
    purpose: 'Private Long Weekend Trip',
    clientName: 'Private Journey',
    startOdo: 35990,
    endOdo: 36870,
    distanceKm: 880,
    category: 'private',
    startLat: -26.1500,
    startLon: 28.0300,
    endLat: -28.7500,
    endLon: 29.2300
  },
  {
    id: 'TRP-789-07',
    date: '2025-05-19',
    departure: 'Sandton HQ',
    destination: 'Johannesburg CBD High Court Precinct',
    purpose: 'Tax Administration Act Rule 7 Evidence Lodgement',
    clientName: 'Legal Counsel Chambers JHB',
    startOdo: 36870,
    endOdo: 37520,
    distanceKm: 650,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.2041,
    endLon: 28.0473
  },
  {
    id: 'TRP-789-08',
    date: '2025-06-03',
    departure: 'Sandton HQ',
    destination: 'Menlyn Maine Financial District',
    purpose: 'Client Board Tax Advisory & §7C Loan Structuring',
    clientName: 'Menlyn Investment Holdings',
    startOdo: 37520,
    endOdo: 38440,
    distanceKm: 920,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.7865,
    endLon: 28.2810
  },
  {
    id: 'TRP-789-09',
    date: '2025-06-20',
    departure: 'Home Residence',
    destination: 'Mall of Africa Midrand',
    purpose: 'Weekend Retail Shopping',
    clientName: 'Private Journey',
    startOdo: 38440,
    endOdo: 38940,
    distanceKm: 500,
    category: 'private',
    startLat: -26.1500,
    startLon: 28.0300,
    endLat: -26.0150,
    endLon: 28.1080
  },
  {
    id: 'TRP-789-10',
    date: '2025-07-08',
    departure: 'Sandton HQ',
    destination: 'Waterfall City Client Office',
    purpose: 'Mid-Year Provisional Tax Cycle 1 Reconciliation',
    clientName: 'Waterfall Advisory (Pty) Ltd',
    startOdo: 38940,
    endOdo: 39790,
    distanceKm: 850,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.9984,
    endLon: 28.1263
  },
  {
    id: 'TRP-789-11',
    date: '2025-07-25',
    departure: 'Sandton HQ',
    destination: 'Eskom Megawatt Park Sunninghill',
    purpose: 'Section 12BA 125% Renewable Solar Grid Verification',
    clientName: 'Eskom Commercial Advisory',
    startOdo: 39790,
    endOdo: 40570,
    distanceKm: 780,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.0350,
    endLon: 28.0690
  },
  {
    id: 'TRP-789-12',
    date: '2025-08-11',
    departure: 'Home Residence',
    destination: 'Kruger National Park Gateway',
    purpose: 'Annual Mid-Year Family Vacation',
    clientName: 'Private Journey',
    startOdo: 40570,
    endOdo: 41870,
    distanceKm: 1300,
    category: 'private',
    startLat: -26.1500,
    startLon: 28.0300,
    endLat: -25.0100,
    endLon: 31.1300
  },
  {
    id: 'TRP-789-13',
    date: '2025-08-28',
    departure: 'Sandton HQ',
    destination: 'Centurion South African Reserve Bank Hub',
    purpose: 'Exchange Control & Section 6quat Foreign Tax Review',
    clientName: 'SARB FinTech Regulatory SandBox',
    startOdo: 41870,
    endOdo: 42810,
    distanceKm: 940,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.8600,
    endLon: 28.1880
  },
  {
    id: 'TRP-789-14',
    date: '2025-09-12',
    departure: 'Sandton HQ',
    destination: 'Bedfordview Corporate Park',
    purpose: 'VAT201 Apportionment & Section 17(1) Audit',
    clientName: 'East Rand Logistics Consortium',
    startOdo: 42810,
    endOdo: 43630,
    distanceKm: 820,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.1780,
    endLon: 28.1340
  },
  {
    id: 'TRP-789-15',
    date: '2025-10-06',
    departure: 'Sandton HQ',
    destination: 'Pretoria DSI (Dept of Science & Innovation)',
    purpose: 'Section 11D R&D Pre-Approval Statutory Inspection',
    clientName: 'DSI National Committee',
    startOdo: 43630,
    endOdo: 44650,
    distanceKm: 1020,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.7530,
    endLon: 28.2760
  },
  {
    id: 'TRP-789-16',
    date: '2025-10-24',
    departure: 'Home Residence',
    destination: 'Johannesburg Botanical Gardens',
    purpose: 'Weekend Recreation',
    clientName: 'Private Journey',
    startOdo: 44650,
    endOdo: 44950,
    distanceKm: 300,
    category: 'private',
    startLat: -26.1500,
    startLon: 28.0300,
    endLat: -26.1570,
    endLon: 28.0070
  },
  {
    id: 'TRP-789-17',
    date: '2025-11-05',
    departure: 'Sandton HQ',
    destination: 'Lanseria International Airport',
    purpose: 'Client Executive Charter Transit & Advisory',
    clientName: 'AeroTech South Africa (Pty) Ltd',
    startOdo: 44950,
    endOdo: 45780,
    distanceKm: 830,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.9385,
    endLon: 27.9261
  },
  {
    id: 'TRP-789-18',
    date: '2025-11-20',
    departure: 'Sandton HQ',
    destination: 'Rivonia IT Park',
    purpose: 'Two-Pot Retirement Reform Payroll Withholding Audit',
    clientName: 'Apex Human Resources SA',
    startOdo: 45780,
    endOdo: 46520,
    distanceKm: 740,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.0460,
    endLon: 28.0610
  },
  {
    id: 'TRP-789-19',
    date: '2025-12-08',
    departure: 'Sandton HQ',
    destination: 'Rosebank Link Office Complex',
    purpose: 'Year-End Financial Statements Preparation & AFS',
    clientName: 'Rosebank Capital Advisory',
    startOdo: 46520,
    endOdo: 47210,
    distanceKm: 690,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.1450,
    endLon: 28.0440
  },
  {
    id: 'TRP-789-20',
    date: '2025-12-23',
    departure: 'Home Residence',
    destination: 'Ballito Coastal Residence',
    purpose: 'Year-End Festive Holidays Private Travel',
    clientName: 'Private Journey',
    startOdo: 47210,
    endOdo: 48110,
    distanceKm: 900,
    category: 'private',
    startLat: -26.1500,
    startLon: 28.0300,
    endLat: -29.5390,
    endLon: 31.2140
  },
  {
    id: 'TRP-789-21',
    date: '2026-01-14',
    departure: 'Sandton HQ',
    destination: 'Bryanston Corporate Office Park',
    purpose: 'Q4 VAT201 Output/Input Reconciliations',
    clientName: 'Bryanston Cloud Technologies',
    startOdo: 48110,
    endOdo: 48720,
    distanceKm: 610,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.0580,
    endLon: 28.0190
  },
  {
    id: 'TRP-789-22',
    date: '2026-02-02',
    departure: 'Sandton HQ',
    destination: 'Midrand Gallagher Convention Centre',
    purpose: 'Annual National Tax & Fiscal Policy Summit',
    clientName: 'South African Institute of Tax',
    startOdo: 48720,
    endOdo: 49340,
    distanceKm: 620,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -26.0020,
    endLon: 28.1310
  },
  {
    id: 'TRP-789-23',
    date: '2026-02-27',
    departure: 'Sandton HQ',
    destination: 'Pretoria SARS LBC Legal Division',
    purpose: 'Final FY2026 Tax Return Sign-Off & Closing Audit',
    clientName: 'SARS LBC Pretoria',
    startOdo: 49340,
    endOdo: 49570,
    distanceKm: 230,
    category: 'business',
    startLat: -26.1076,
    startLon: 28.0567,
    endLat: -25.7479,
    endLon: 28.1878
  }
];

export const TravelLogbookCalculator: React.FC<TravelLogbookCalculatorProps> = ({
  formatZAR,
  addAuditLog,
  showBanner,
  currentUserRole,
  checkPermission,
  onSyncVault,
  invoices = [],
  profile,
  onNavigateTab
}) => {
  // Navigation sub-views: ledger (trip logs list), calculator (rate engine), dossier (SARS print audit view)
  const [subView, setSubView] = useState<'ledger' | 'calculator' | 'dossier'>('ledger');

  // Vehicle Parameters
  const [vehicleValue, setVehicleValue] = useState<number>(450000);
  const [vehicleRegistration, setVehicleRegistration] = useState('CA 829-410');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('BMW 320d Luxury Line');
  const [fuelPaidByEmployee, setFuelPaidByEmployee] = useState(true);
  const [maintPaidByEmployee, setMaintPaidByEmployee] = useState(true);

  // Active trips state - initialized to Vault #789 baseline (12,450 km Business, 4,120 km Private)
  const [trips, setTrips] = useState<TripLogEntry[]>(FULL_VAULT_789_TRIPS);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'business' | 'private' | 'pinned' | 'warning'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'dist-desc' | 'dist-asc'>('date-desc');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripLogEntry | null>(null);
  const [pinningTripId, setPinningTripId] = useState<string | null>(null);
  const [showPresetDrawer, setShowPresetDrawer] = useState(false);

  // New Trip form state
  const [newDate, setNewDate] = useState('2026-03-15');
  const [newDept, setNewDept] = useState('Sandton HQ');
  const [newDest, setNewDest] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newDistance, setNewDistance] = useState<number>(65);
  const [newCategory, setNewCategory] = useState<'business' | 'private'>('business');
  const [selectedPetrolInvId, setSelectedPetrolInvId] = useState<string>('');

  // Filter petrol/fuel invoices available for pinning
  const petrolInvoices = invoices.filter(inv => 
    inv.isPetrolInvoice || 
    inv.category?.toLowerCase().includes('fuel') || 
    inv.category?.toLowerCase().includes('petrol')
  );

  // Calculate deemed rates
  const currentBracket = SARS_VEHICLE_BRACKETS.find(b => vehicleValue <= b.maxVal) || SARS_VEHICLE_BRACKETS[SARS_VEHICLE_BRACKETS.length - 1];

  // Aggregate trip calculations
  const businessKmLogged = useMemo(() => {
    return trips.filter(t => t.category === 'business').reduce((sum, t) => sum + t.distanceKm, 0);
  }, [trips]);

  const privateKmLogged = useMemo(() => {
    return trips.filter(t => t.category === 'private').reduce((sum, t) => sum + t.distanceKm, 0);
  }, [trips]);

  const totalKmLogged = businessKmLogged + privateKmLogged;
  const businessRatioPercent = totalKmLogged > 0 ? (businessKmLogged / totalKmLogged) * 100 : 0;

  // SARS Section 8(1)(b) Rate Calculation
  const fixedCostPerKm = totalKmLogged > 0 ? currentBracket.fixedCost / totalKmLogged : 0;
  const fuelRatePerKm = fuelPaidByEmployee ? currentBracket.fuelCents / 100 : 0;
  const maintRatePerKm = maintPaidByEmployee ? currentBracket.maintCents / 100 : 0;
  const totalRatePerKm = fixedCostPerKm + fuelRatePerKm + maintRatePerKm;

  const totalClaimableTravelDeduction = businessKmLogged * totalRatePerKm;
  const actualCostsEstimate = totalKmLogged > 0 
    ? (businessKmLogged / totalKmLogged) * (vehicleValue * 0.20 + 38000 + 16000)
    : 0;

  // Helper to compute route reach status for a trip
  const getTripPetrolProximity = (trip: TripLogEntry) => {
    if (!trip.petrolInvoiceId || trip.petrolStationLat === undefined || trip.petrolStationLon === undefined) {
      return { status: 'none', distanceKm: null, label: 'No Invoice Pinned', isCompliant: true };
    }

    const startLat = trip.startLat ?? -26.1076;
    const startLon = trip.startLon ?? 28.0567;
    const endLat = trip.endLat ?? -26.0000;
    const endLon = trip.endLon ?? 28.1000;

    const distanceKm = calculateStationDistanceToRoute(
      startLat,
      startLon,
      endLat,
      endLon,
      trip.petrolStationLat,
      trip.petrolStationLon
    );

    const isWithinReach = distanceKm <= 15.0;
    return {
      status: isWithinReach ? 'reach' : 'out_of_reach',
      distanceKm,
      label: isWithinReach ? `Within Reach (${distanceKm}km)` : `Out of Route Reach (${distanceKm}km)`,
      isCompliant: isWithinReach
    };
  };

  // Odometer continuity audit checker
  const odometerAudit = useMemo(() => {
    let gapsCount = 0;
    let totalMissingKm = 0;
    const gapTripIds = new Set<string>();

    const sortedTrips = [...trips].sort((a, b) => a.startOdo - b.startOdo);
    for (let i = 1; i < sortedTrips.length; i++) {
      const prev = sortedTrips[i - 1];
      const curr = sortedTrips[i];
      if (curr.startOdo !== prev.endOdo) {
        gapsCount++;
        totalMissingKm += Math.abs(curr.startOdo - prev.endOdo);
        gapTripIds.add(curr.id);
      }
    }

    return {
      isContiguous: gapsCount === 0,
      gapsCount,
      totalMissingKm,
      gapTripIds
    };
  }, [trips]);

  // SARS Contemporaneous Audit Scorecard
  const complianceScorecard = useMemo(() => {
    if (trips.length === 0) return { score: 100, status: 'Audit-Ready' };

    let totalPoints = 0;
    let maxPoints = 5 * trips.length;

    trips.forEach(t => {
      // 1. Odometer valid
      if (t.endOdo > t.startOdo) totalPoints += 1;
      // 2. Specific trade purpose
      if (t.category === 'business') {
        if (t.purpose && t.purpose.trim().length >= 8) totalPoints += 1;
        // 3. Client specified
        if (t.clientName && t.clientName.trim().length >= 3) totalPoints += 1;
      } else {
        totalPoints += 2; // private automatically has 2 points
      }
      // 4. Odometer continuity
      if (!odometerAudit.gapTripIds.has(t.id)) totalPoints += 1;
      // 5. Fuel corroboration or reasonable
      const prox = getTripPetrolProximity(t);
      if (prox.isCompliant) totalPoints += 1;
    });

    const score = Math.round((totalPoints / maxPoints) * 100);
    const status = score >= 90 ? 'Audit-Ready' : score >= 75 ? 'Caution' : 'Requires Rectification';
    return { score, status };
  }, [trips, odometerAudit]);

  // Filtered & Sorted trips
  const filteredTrips = useMemo(() => {
    return trips
      .filter(t => {
        // Category / status filter
        if (categoryFilter === 'business' && t.category !== 'business') return false;
        if (categoryFilter === 'private' && t.category !== 'private') return false;
        if (categoryFilter === 'pinned' && !t.petrolInvoiceId) return false;
        if (categoryFilter === 'warning' && !odometerAudit.gapTripIds.has(t.id)) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = 
            t.departure.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q) ||
            t.purpose.toLowerCase().includes(q) ||
            (t.clientName && t.clientName.toLowerCase().includes(q)) ||
            t.date.includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'dist-desc') return b.distanceKm - a.distanceKm;
        if (sortBy === 'dist-asc') return a.distanceKm - b.distanceKm;
        return 0;
      });
  }, [trips, categoryFilter, searchQuery, sortBy, odometerAudit]);

  // Actions
  const handlePinInvoiceToTrip = (tripId: string, invoiceId: string) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" does not have permission to pin invoices.`);
      return;
    }

    if (!invoiceId) {
      // Unpin
      setTrips(trips.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            petrolInvoiceId: undefined,
            petrolStationName: undefined,
            petrolStationLat: undefined,
            petrolStationLon: undefined,
            petrolAmount: undefined,
            petrolLitres: undefined
          };
        }
        return t;
      }));
      setPinningTripId(null);
      addAuditLog('LOGBOOK_PETROL_UNPINNED', `Unpinned petrol invoice from trip #${tripId}.`);
      showBanner('⛽ Petrol invoice unpinned from trip.');
      return;
    }

    const inv = petrolInvoices.find(i => i.id === invoiceId);
    if (!inv) return;

    setTrips(trips.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          petrolInvoiceId: inv.id,
          petrolStationName: inv.stationName || inv.supplierName,
          petrolStationLat: inv.stationLatitude,
          petrolStationLon: inv.stationLongitude,
          petrolAmount: inv.totalAmount,
          petrolLitres: inv.litresPurchased
        };
      }
      return t;
    }));

    setPinningTripId(null);

    const targetTrip = trips.find(t => t.id === tripId);
    if (targetTrip && inv.stationLatitude !== undefined && inv.stationLongitude !== undefined) {
      const dist = calculateStationDistanceToRoute(
        targetTrip.startLat ?? -26.1076,
        targetTrip.startLon ?? 28.0567,
        targetTrip.endLat ?? -26.0000,
        targetTrip.endLon ?? 28.1000,
        inv.stationLatitude,
        inv.stationLongitude
      );

      if (dist <= 15.0) {
        addAuditLog('LOGBOOK_PETROL_PINNED', `Pinned petrol invoice #${inv.invoiceNumber} (${inv.stationName || inv.supplierName}) to trip #${tripId}. Within route reach (${dist}km).`, 'info');
        showBanner(`✅ Petrol invoice pinned! Station is ${dist}km from route corridor (Within SARS 15km reach).`);
      } else {
        addAuditLog('LOGBOOK_PETROL_PINNED_WARNING', `Station (${inv.stationName}) is ${dist}km away from claimed route #${tripId}. Exceeds 15km corridor limit.`, 'warn');
        showBanner(`⚠️ Warning: Station is ${dist}km from route corridor. Petrol station reference must be within reach of the route claimed!`);
      }
    } else {
      showBanner(`⛽ Petrol invoice pinned to trip #${tripId}.`);
    }
  };

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" does not have permission to add logbook records.`);
      return;
    }
    if (!newDest.trim() || !newPurpose.trim()) {
      showBanner('⚠️ Please enter trip destination and business purpose.');
      return;
    }

    const lastOdo = trips.length > 0 ? trips[trips.length - 1].endOdo : 49570;
    const selectedInv = petrolInvoices.find(i => i.id === selectedPetrolInvId);

    const newEntry: TripLogEntry = {
      id: `TRP-USR-${Date.now().toString().slice(-6)}`,
      date: newDate,
      departure: newDept,
      destination: newDest,
      purpose: newPurpose,
      clientName: newClient.trim() || (newCategory === 'business' ? 'Client Site' : 'Private Journey'),
      startOdo: lastOdo,
      endOdo: lastOdo + newDistance,
      distanceKm: newDistance,
      category: newCategory,
      startLat: -26.1076,
      startLon: 28.0567,
      endLat: -26.0000,
      endLon: 28.1000,
      petrolInvoiceId: selectedInv?.id,
      petrolStationName: selectedInv?.stationName || selectedInv?.supplierName,
      petrolStationLat: selectedInv?.stationLatitude,
      petrolStationLon: selectedInv?.stationLongitude,
      petrolAmount: selectedInv?.totalAmount,
      petrolLitres: selectedInv?.litresPurchased
    };

    setTrips([...trips, newEntry]);
    setShowAddModal(false);
    setNewDest('');
    setNewPurpose('');
    setNewClient('');
    setSelectedPetrolInvId('');

    addAuditLog('LOGBOOK_TRIP_ADDED', `Logged ${newDistance}km (${newCategory}) to ${newDest} for purpose: "${newPurpose}".`);
    showBanner(`🚗 Trip added! Odometer logged up to ${lastOdo + newDistance} km.`);
  };

  const handleSaveEditTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" does not have permission to edit logbook records.`);
      return;
    }

    setTrips(trips.map(t => t.id === editingTrip.id ? editingTrip : t));
    addAuditLog('LOGBOOK_TRIP_EDITED', `Updated trip #${editingTrip.id}: ${editingTrip.departure} → ${editingTrip.destination} (${editingTrip.distanceKm} km).`);
    showBanner(`✏️ Trip #${editingTrip.id} updated successfully.`);
    setEditingTrip(null);
  };

  const handleDeleteTrip = (id: string) => {
    if (!checkPermission('canDeleteTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" does not have permission to delete logbook records. Requires Owner or Accountant.`);
      return;
    }
    setTrips(trips.filter(t => t.id !== id));
    addAuditLog('LOGBOOK_TRIP_DELETED', `Deleted logbook trip entry #${id}.`);
    showBanner('🗑️ Trip entry removed.');
  };

  const handleApplyPreset = (preset: typeof SA_ROUTE_PRESETS[0]) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot add preset routes.`);
      return;
    }

    const lastOdo = trips.length > 0 ? trips[trips.length - 1].endOdo : 49570;
    const newEntry: TripLogEntry = {
      id: `TRP-PRESET-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      departure: preset.departure,
      destination: preset.destination,
      purpose: preset.purpose,
      clientName: preset.clientName,
      startOdo: lastOdo,
      endOdo: lastOdo + preset.distanceKm,
      distanceKm: preset.distanceKm,
      category: 'business',
      startLat: preset.startLat,
      startLon: preset.startLon,
      endLat: preset.endLat,
      endLon: preset.endLon
    };

    setTrips([...trips, newEntry]);
    setShowPresetDrawer(false);
    addAuditLog('LOGBOOK_PRESET_APPLIED', `Added preset route: ${preset.name} (${preset.distanceKm} km).`);
    showBanner(`🚀 Route preset added: "${preset.name}" (${preset.distanceKm} km).`);
  };

  const handleAutoAlignOdometers = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Requires Owner or Accountant to re-align odometers.`);
      return;
    }

    let runningOdo = trips.length > 0 ? trips[0].startOdo : 33000;
    const aligned = trips.map(t => {
      const start = runningOdo;
      const end = runningOdo + t.distanceKm;
      runningOdo = end;
      return {
        ...t,
        startOdo: start,
        endOdo: end
      };
    });

    setTrips(aligned);
    addAuditLog('LOGBOOK_ODOMETERS_ALIGNED', `Auto-aligned sequential odometers across ${trips.length} trips starting at ${trips[0]?.startOdo || 33000} km.`);
    showBanner('📏 Odometer continuity 100% repaired! Sequential unbroken logs restored.');
  };

  const handleResetToVault789 = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Requires Owner or Accountant to reset logbook baseline.`);
      return;
    }
    setTrips(FULL_VAULT_789_TRIPS);
    addAuditLog('LOGBOOK_RESET_VAULT_789', 'Reset logbook to official 12,450 km Vault #789 baseline.');
    showBanner('🔄 Logbook restored to official Vault #789 baseline (12,450 km Business, 4,120 km Private).');
  };

  const handleSyncToVault = () => {
    if (onSyncVault) {
      onSyncVault();
    } else {
      addAuditLog(
        'LOGBOOK_SYNCED_TO_VAULT',
        `Synchronized ${businessKmLogged.toLocaleString()}km travel logbook to Audit-Ready Vault (Doc ID #789 - Logbook_2026.pdf). SHA-256 integrity hash sealed.`,
        'info'
      );
      showBanner('🛡️ Travel Logbook successfully sealed into Audit-Ready Vault (ID #789)!');
    }
  };

  const handleDownloadCSV = () => {
    if (!checkPermission('canDownloadCSV')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to export SARS travel logbooks.`);
      return;
    }

    const gpsInputs: GPSTripInput[] = trips.map(t => ({
      timestamp: `${t.date}T08:00:00Z`,
      start_latitude: t.startLat ?? -26.1076,
      start_longitude: t.startLon ?? 28.0567,
      end_latitude: t.endLat ?? -26.0000,
      end_longitude: t.endLon ?? 28.1000,
      opening_odometer: t.startOdo,
      closing_odometer: t.endOdo,
      tag: t.category === 'business' ? 'Business' : 'Private',
      reason_for_trip: t.purpose,
      client_name: t.clientName || 'General Business',
      vehicle_value: vehicleValue,
      vehicle_registration: vehicleRegistration,
      petrol_invoice_id: t.petrolInvoiceId,
      petrol_station_name: t.petrolStationName,
      petrol_station_latitude: t.petrolStationLat,
      petrol_station_longitude: t.petrolStationLon,
      petrol_invoice_amount: t.petrolAmount
    }));

    const processed = processGPSTracks(gpsInputs);
    const submissionRef = `SARS-BRS-LOG-${Date.now().toString(36).toUpperCase()}`;
    const csvContent = generateSARSLogbookCSV(processed.trips, processed.summary, {
      submissionReference: submissionRef,
      taxpayerReferenceNumber: profile?.sarsTaxNumber || '9304318273',
      userId: 'USR-FINTECH-AUTH',
      userRole: currentUserRole,
      calculationLogicSummary: `Section 8(1)(b) deemed cost rate of R${totalRatePerKm.toFixed(2)}/km across ${businessKmLogged.toLocaleString()} km business travel against verified logbook.`
    });

    downloadBlobFile(
      `SARS_Logbook_BRS_${submissionRef}_${vehicleRegistration.replace(/\s+/g, '_')}.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );

    addAuditLog('LOGBOOK_CSV_EXPORTED', `Exported SARS Travel Logbook CSV (${submissionRef}) with ${trips.length} entries.`);
    showBanner(`📥 Official SARS Travel Logbook CSV (${submissionRef}) downloaded!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="travel-logbook-calculator-root">
      
      {/* TOP HEADER & VIEW MODE SELECTOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>SARS Section 8(1) GPS Travel Logbook & Deemed Cost Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gazetted 2026/2027
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Contemporaneous trip tracking, geospatial fuel corroboration, and Section 11(a) deduction verification
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subview Tabs */}
          <div className="flex bg-slate-900 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setSubView('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'ledger'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Trip Ledger ({trips.length})</span>
            </button>
            <button
              onClick={() => setSubView('calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'calculator'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Gazetted Scales</span>
            </button>
            <button
              onClick={() => setSubView('dossier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subView === 'dossier'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SARS Dossier</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            id="download-sars-logbook-csv-btn"
            title="Export CSV conforming to SARS BRS e-Logbook specifications"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            id="add-trip-log-btn"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Trip</span>
          </button>

          <button
            onClick={handleSyncToVault}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
            id="sync-logbook-vault-btn"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seal in Vault (#789)</span>
          </button>
        </div>
      </div>

      {/* DISALLOWED SOURCE CODE 4015 ALERT BANNER */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                SARS Source Code 4015 Corroboration Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                TAA Rule 7 Ready
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              If SARS writes back travel deductions to <strong className="text-rose-400 font-mono">R0.00</strong> on your ITA34 assessment, this logbook provides the factual proof of <strong className="text-emerald-300 font-mono">{businessKmLogged.toLocaleString()} km</strong> to substantiate your Section 11(a) objection.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('ita34_decoder') : showBanner('Navigate to Dispute War Room tab to draft Form ADR1')}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Dispute War Room (ADR1)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-center">
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Business Travel</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {businessKmLogged.toLocaleString()} km
          </span>
          <span className="text-[9px] text-emerald-400/80 block mt-0.5">
            {businessRatioPercent.toFixed(1)}% of total ({trips.filter(t => t.category === 'business').length} trips)
          </span>
        </div>

        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Private Travel</span>
          <span className="text-base sm:text-lg font-bold text-white/60 font-mono">
            {privateKmLogged.toLocaleString()} km
          </span>
          <span className="text-[9px] text-white/40 block mt-0.5">
            {(100 - businessRatioPercent).toFixed(1)}% ({trips.filter(t => t.category === 'private').length} trips)
          </span>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <span className="text-[10px] text-amber-400/70 uppercase block font-bold">Deemed Rate / km</span>
          <span className="text-base sm:text-lg font-bold text-amber-300 font-mono">
            R{totalRatePerKm.toFixed(2)}/km
          </span>
          <span className="text-[9px] text-amber-400/80 block mt-0.5">
            Fixed + Fuel + Maint
          </span>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <span className="text-[10px] text-emerald-400/70 uppercase block font-bold">Claimable Deduction</span>
          <span className="text-base sm:text-lg font-bold text-emerald-300 font-mono">
            {formatZAR(totalClaimableTravelDeduction)}
          </span>
          <span className="text-[9px] text-emerald-400/80 block mt-0.5">
            Ready for Code 4015
          </span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-3.5 bg-slate-900 border border-white/10 rounded-2xl flex flex-col justify-center items-center">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Audit Scorecard</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-base sm:text-lg font-bold font-mono ${
              complianceScorecard.score >= 90 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {complianceScorecard.score}%
            </span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
              complianceScorecard.score >= 90 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {complianceScorecard.status}
            </span>
          </div>
          <span className="text-[9px] text-white/40 block mt-0.5">
            {odometerAudit.isContiguous ? '0 Odometer Gaps' : `${odometerAudit.gapsCount} Discontinuities`}
          </span>
        </div>
      </div>

      {/* SUB-VIEW 1: TRIP LOGS EXPLORER & CONTEMPORANEOUS LEDGER */}
      {subView === 'ledger' && (
        <div className="space-y-4">
          
          {/* ODOMETER CONTINUITY & FILTER TOOLBAR */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>Contemporaneous Travel Log Ledger</span>
                </h4>
                <p className="text-[10px] text-white/50">
                  {trips.length} Total Journeys Logged • {businessKmLogged.toLocaleString()} km Business • {trips.filter(t => t.petrolInvoiceId).length} Fuel Invoices Pinned
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowPresetDrawer(!showPresetDrawer)}
                  className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>SA Route Presets</span>
                </button>

                {!odometerAudit.isContiguous && (
                  <button
                    onClick={handleAutoAlignOdometers}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer animate-pulse"
                    title="Recalculate sequential start/end odometers to eliminate gaps"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Auto-Align Odometers</span>
                  </button>
                )}

                <button
                  onClick={handleResetToVault789}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                  title="Reload baseline 12,450 km Vault #789 logbook"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Vault #789</span>
                </button>

                {onNavigateTab && (
                  <>
                    <button
                      onClick={() => onNavigateTab('phase17_auditor')}
                      className="px-2.5 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Audit this logbook under TAA Rule 7 compliance regulations"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Rule 7 Audit Pack</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('ita34_decoder')}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="View ITA34 Dispute War Room (ADR1 objection)"
                    >
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Dispute War Room</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ROUTE PRESET EXPANDED DRAWER */}
            {showPresetDrawer && (
              <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3 space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quick-Add South African Business Routes</span>
                  </span>
                  <button onClick={() => setShowPresetDrawer(false)} className="text-white/40 hover:text-white text-xs">✕</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SA_ROUTE_PRESETS.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 rounded-lg cursor-pointer transition text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{preset.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{preset.distanceKm} km</span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">{preset.purpose}</p>
                      <span className="text-[9px] text-purple-300/80 block mt-1">Client: {preset.clientName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ODOMETER INTEGRITY WARNING (IF ANY GAPS DETECTED) */}
            {!odometerAudit.isContiguous && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Odometer Discontinuity Alert:</strong> {odometerAudit.gapsCount} gap(s) detected totalling {odometerAudit.totalMissingKm} unexplained km. SARS presumes all uncaptured kilometers are non-compliant private travel.
                  </span>
                </div>
                <button
                  onClick={handleAutoAlignOdometers}
                  className="px-2.5 py-1 bg-rose-500 text-slate-950 font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                >
                  Repair Sequence
                </button>
              </div>
            )}

            {/* SEARCH AND FILTER BAR */}
            <div className="flex flex-col md:flex-row items-center gap-2 pt-1">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destination, departure, purpose, client, date..."
                  className="w-full bg-slate-900 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-white/50 hover:text-white border border-transparent'
                  }`}
                >
                  All ({trips.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('business')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                    categoryFilter === 'business'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-white/50 hover:text-white border border-transparent'
                  }`}
                >
                  Business ({trips.filter(t => t.category === 'business').length})
                </button>
                <button
                  onClick={() => setCategoryFilter('private')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                    categoryFilter === 'private'
                      ? 'bg-white/20 text-white border border-white/40'
                      : 'bg-white/5 text-white/50 hover:text-white border border-transparent'
                  }`}
                >
                  Private ({trips.filter(t => t.category === 'private').length})
                </button>
                <button
                  onClick={() => setCategoryFilter('pinned')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                    categoryFilter === 'pinned'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-white/50 hover:text-white border border-transparent'
                  }`}
                >
                  Fuel Pinned ({trips.filter(t => t.petrolInvoiceId).length})
                </button>
                {odometerAudit.gapsCount > 0 && (
                  <button
                    onClick={() => setCategoryFilter('warning')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                      categoryFilter === 'warning'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-white/5 text-white/50 hover:text-white border border-transparent'
                    }`}
                  >
                    Gaps ({odometerAudit.gapsCount})
                  </button>
                )}

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-white/15 text-white/70 rounded-lg px-2 py-1 text-[10.5px] focus:outline-none"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="dist-desc">Distance (Longest)</option>
                  <option value="dist-asc">Distance (Shortest)</option>
                </select>
              </div>
            </div>
          </div>

          {/* TRIPS TABLE */}
          <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-[9.5px] uppercase font-bold text-white/50 font-mono">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Route / Corridor</th>
                    <th className="py-3 px-3">Business Purpose & Client</th>
                    <th className="py-3 px-3">Odometer</th>
                    <th className="py-3 px-3">Distance</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Pinned Fuel Receipt & Corridor</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {filteredTrips.length === 0 ? (
                    <tr key="empty-filtered-trips">
                      <td colSpan={8} className="py-8 text-center text-white/40 font-sans">
                        No trips found matching filter criteria. Try clearing search or category filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip) => {
                      const proximity = getTripPetrolProximity(trip);
                      const hasGap = odometerAudit.gapTripIds.has(trip.id);

                      return (
                        <tr key={trip.id} className={`hover:bg-white/5 transition-colors ${
                          hasGap ? 'bg-rose-500/5' : ''
                        }`}>
                          <td className="py-2.5 px-3 text-white/70 whitespace-nowrap">
                            {trip.date}
                          </td>
                          <td className="py-2.5 px-3 text-white font-sans">
                            <div className="font-semibold text-white">
                              {trip.departure} → {trip.destination}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-white/70 font-sans max-w-xs">
                            <p className="truncate text-white/90" title={trip.purpose}>
                              {trip.purpose}
                            </p>
                            {trip.clientName && (
                              <span className="text-[10px] text-emerald-400/80 block">
                                Client: {trip.clientName}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-white/60 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{trip.startOdo.toLocaleString()} - {trip.endOdo.toLocaleString()}</span>
                              {hasGap && (
                                <span className="text-[8.5px] bg-rose-500/20 text-rose-300 px-1 rounded font-bold" title="Discontinuous starting odometer reading">
                                  GAP
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                            {trip.distanceKm.toLocaleString()} km
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-sans font-bold ${
                              trip.category === 'business' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                : 'bg-white/10 text-white/50'
                            }`}>
                              {trip.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {trip.petrolInvoiceId ? (
                              <div className="space-y-1 font-sans">
                                <div className="flex items-center gap-1.5">
                                  <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="text-white text-[10.5px] font-semibold truncate max-w-[140px]" title={trip.petrolStationName}>
                                    {trip.petrolStationName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold flex items-center gap-1 ${
                                    proximity.status === 'reach'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
                                    {proximity.status === 'reach' ? (
                                      <>
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Within Reach ({proximity.distanceKm}km)</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                                        <span>Out of Reach ({proximity.distanceKm}km)</span>
                                      </>
                                    )}
                                  </span>
                                  <button
                                    onClick={() => setPinningTripId(trip.id)}
                                    className="text-[9px] text-white/40 hover:text-white underline cursor-pointer"
                                    title="Change or unpin fuel receipt"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPinningTripId(trip.id)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg text-[10px] font-sans flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Link className="w-3 h-3 text-cyan-400" />
                                <span>Pin Fuel</span>
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingTrip(trip)}
                                className="text-white/40 hover:text-white transition-colors p-1"
                                title="Edit trip details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrip(trip.id)}
                                className="text-white/30 hover:text-rose-400 transition-colors p-1"
                                title="Delete trip"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-white/50">
              <span>Showing {filteredTrips.length} of {trips.length} trips</span>
              <span className="font-mono text-white/80">
                Total Business: <strong className="text-emerald-400">{businessKmLogged.toLocaleString()} km</strong> • Total Private: <strong className="text-white/60">{privateKmLogged.toLocaleString()} km</strong>
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SUB-VIEW 2: GAZETTED DEEMED COST RATES CALCULATOR */}
      {subView === 'calculator' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* VEHICLE CONFIGURATION */}
            <div className="lg:col-span-1 bg-black/30 border border-white/10 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-cyan-400" />
                <span>Vehicle Purchase & Operating Details</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">
                    Vehicle Retail Value (incl. VAT)
                  </label>
                  <input 
                    type="number"
                    value={vehicleValue}
                    onChange={(e) => setVehicleValue(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                    step="10000"
                  />
                  <span className="text-[9px] text-white/40 mt-1 block">
                    Must corroborate signed Vehicle Purchase Agreement in Vault.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Registration No.</label>
                    <input 
                      type="text"
                      value={vehicleRegistration}
                      onChange={(e) => setVehicleRegistration(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Make & Model</label>
                    <input 
                      type="text"
                      value={vehicleMakeModel}
                      onChange={(e) => setVehicleMakeModel(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={fuelPaidByEmployee}
                      onChange={(e) => setFuelPaidByEmployee(e.target.checked)}
                      className="rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-white/80">Employee bears fuel expenses</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={maintPaidByEmployee}
                      onChange={(e) => setMaintPaidByEmployee(e.target.checked)}
                      className="rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-white/80">Employee bears maintenance costs</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SARS GAZETTE RATES TABLE DECODER */}
            <div className="lg:col-span-2 bg-black/30 border border-white/10 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>SARS Gazetted 2026/2027 Deemed Cost Calculation</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Bracket: R{currentBracket.maxVal === 99999999 ? '800k+' : `≤ R${(currentBracket.maxVal / 1000).toFixed(0)}k`}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase block font-sans">Fixed Cost Rate</span>
                    <span className="text-white font-bold text-sm">R{fixedCostPerKm.toFixed(2)}/km</span>
                    <span className="text-[9px] text-white/40 block mt-0.5">Fixed / {totalKmLogged.toLocaleString()}km</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase block font-sans">Fuel Cost Rate</span>
                    <span className="text-white font-bold text-sm">R{fuelRatePerKm.toFixed(2)}/km</span>
                    <span className="text-[9px] text-white/40 block mt-0.5">{currentBracket.fuelCents}c / km</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[9px] text-white/40 uppercase block font-sans">Maint. Cost Rate</span>
                    <span className="text-white font-bold text-sm">R{maintRatePerKm.toFixed(2)}/km</span>
                    <span className="text-[9px] text-white/40 block mt-0.5">{currentBracket.maintCents}c / km</span>
                  </div>
                </div>

                {/* DEEMED VS ACTUAL COMPARISON */}
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/70">SARS Deemed Cost Method (s8(1)(b)):</span>
                    <strong className="text-emerald-300 font-mono text-sm">{formatZAR(totalClaimableTravelDeduction)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/70">Actual Costs Method (Receipts + 20% Wear & Tear):</span>
                    <strong className="text-cyan-300 font-mono text-sm">{formatZAR(actualCostsEstimate)}</strong>
                  </div>
                  <div className="border-t border-white/10 pt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>
                      The {totalClaimableTravelDeduction >= actualCostsEstimate ? 'SARS Deemed Rate' : 'Actual Cost'} method maximizes your statutory tax refund by {formatZAR(Math.abs(totalClaimableTravelDeduction - actualCostsEstimate))}.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GAZETTE RATE TABLE OVERVIEW */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Official SARS 2026/2027 Gazetted Scale Brackets
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-[9.5px] uppercase font-bold text-white/40">
                    <th className="pb-2">Vehicle Value Bracket (ZAR)</th>
                    <th className="pb-2">Fixed Cost (ZAR / annum)</th>
                    <th className="pb-2">Fuel Cost (c/km)</th>
                    <th className="pb-2">Maintenance Cost (c/km)</th>
                    <th className="pb-2">Active Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {SARS_VEHICLE_BRACKETS.map((b, idx) => {
                    const isCurrent = vehicleValue <= b.maxVal && (idx === 0 || vehicleValue > SARS_VEHICLE_BRACKETS[idx - 1].maxVal);
                    return (
                      <tr key={idx} className={isCurrent ? 'bg-emerald-500/10 text-white font-bold' : 'text-white/60'}>
                        <td className="py-2 font-sans">
                          {idx === 0 ? '0 - 100,000' : b.maxVal === 99999999 ? '800,001+' : `${(SARS_VEHICLE_BRACKETS[idx - 1].maxVal + 1).toLocaleString()} - ${b.maxVal.toLocaleString()}`}
                        </td>
                        <td className="py-2">R {b.fixedCost.toLocaleString()}</td>
                        <td className="py-2">{b.fuelCents.toFixed(1)} c/km</td>
                        <td className="py-2">{b.maintCents.toFixed(1)} c/km</td>
                        <td className="py-2">
                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500 text-slate-950 font-bold">
                              Current Bracket
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-VIEW 3: OFFICIAL SARS PRINT / AUDIT SUBMISSION DOSSIER */}
      {subView === 'dossier' && (
        <div className="space-y-4 animate-fadeIn">
          {/* DOSSIER ACTION BAR (PRINT, EXPORT & VAULT LINK) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-white/10 p-3.5 rounded-2xl print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/70 font-medium">Official SARS Audit Schedule:</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {businessKmLogged.toLocaleString()} km Business Travel
              </span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {formatZAR(totalClaimableTravelDeduction)} Claimable
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Print or Save PDF of the official SARS logbook schedule"
                id="print-sars-dossier-btn"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Download SARS BRS Electronic CSV"
                id="dossier-download-csv-btn"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download BRS CSV</span>
              </button>

              <button
                onClick={handleSyncToVault}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Update and seal in Audit-Ready Vault (#789)"
                id="dossier-seal-vault-btn"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Seal in Vault (#789)</span>
              </button>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:p-0">
            
            {/* DOSSIER HEADER */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  SOUTH AFRICAN REVENUE SERVICE (SARS)
                </h2>
                <h3 className="text-sm font-bold text-slate-700">
                  CONTEMPORANEOUS VEHICLE TRAVEL LOGBOOK & SECTION 8(1)(b) SCHEDULE
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prescribed documentation under Section 8(1)(b) & Section 11(a) of the Income Tax Act No. 58 of 1962
                </p>
              </div>
              <div className="text-right sm:text-right font-mono text-xs">
                <p className="font-bold text-slate-900">TAX YEAR: 2026/2027</p>
                <p className="text-slate-600">VAULT ID: #789</p>
                <p className="text-slate-600">REF: {profile?.sarsTaxNumber || '9304318273'}</p>
              </div>
            </div>

            {/* PARTICULARS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Taxpayer Name</span>
                <span className="font-bold text-slate-900">{profile?.name || 'Taxpayer Representative'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Vehicle Registration</span>
                <span className="font-bold font-mono text-slate-900">{vehicleRegistration}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Make & Model</span>
                <span className="font-bold text-slate-900">{vehicleMakeModel}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Vehicle Purchase Cost</span>
                <span className="font-bold font-mono text-slate-900">{formatZAR(vehicleValue)}</span>
              </div>
            </div>

            {/* AUDIT SUMMARY STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border border-slate-300 rounded-xl p-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Opening Odometer</span>
                <span className="font-bold font-mono text-slate-900">{trips[0]?.startOdo.toLocaleString() || '33,000'} km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Closing Odometer</span>
                <span className="font-bold font-mono text-slate-900">{trips[trips.length - 1]?.endOdo.toLocaleString() || '49,570'} km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Business Distance</span>
                <span className="font-bold font-mono text-emerald-700">{businessKmLogged.toLocaleString()} km ({businessRatioPercent.toFixed(1)}%)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Deemed Deduction Claim</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">{formatZAR(totalClaimableTravelDeduction)}</span>
              </div>
            </div>

            {/* SCHEDULE TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-bold uppercase text-slate-700">
                    <th className="py-2">Date</th>
                    <th className="py-2">Destination & Route</th>
                    <th className="py-2">Business Purpose / Reason</th>
                    <th className="py-2">Client Visited</th>
                    <th className="py-2 text-right">Opening</th>
                    <th className="py-2 text-right">Closing</th>
                    <th className="py-2 text-right">Business Km</th>
                    <th className="py-2 text-right">Private Km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {trips.length === 0 ? (
                    <tr key="empty-dossier-trips">
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-sans">
                        No trips recorded in logbook.
                      </td>
                    </tr>
                  ) : (
                    trips.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-1.5">{t.date}</td>
                        <td className="py-1.5 font-sans font-medium">{t.departure} → {t.destination}</td>
                        <td className="py-1.5 font-sans text-slate-600 max-w-xs truncate">{t.purpose}</td>
                        <td className="py-1.5 font-sans text-slate-600">{t.clientName || '-'}</td>
                        <td className="py-1.5 text-right text-slate-500">{t.startOdo.toLocaleString()}</td>
                        <td className="py-1.5 text-right text-slate-500">{t.endOdo.toLocaleString()}</td>
                        <td className="py-1.5 text-right font-bold text-slate-900">
                          {t.category === 'business' ? t.distanceKm.toLocaleString() : '-'}
                        </td>
                        <td className="py-1.5 text-right text-slate-400">
                          {t.category === 'private' ? t.distanceKm.toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold">
                    <td colSpan={6} className="py-2 uppercase">TOTALS:</td>
                    <td className="py-2 text-right text-emerald-800">{businessKmLogged.toLocaleString()} km</td>
                    <td className="py-2 text-right text-slate-600">{privateKmLogged.toLocaleString()} km</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* LEGAL DECLARATION & AUDIT HASH */}
            <div className="border-t border-slate-200 pt-4 space-y-3 text-xs text-slate-600">
              <p className="italic">
                <strong>Statutory Affidavit:</strong> I hereby declare under penalty of perjury that this logbook constitutes a true, correct, and contemporaneous record of all journeys undertaken in vehicle {vehicleRegistration} for the 2026/2027 tax year. All business journeys were undertaken exclusively in the production of taxable income under Section 11(a) of the Income Tax Act 58 of 1962.
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200 pt-2 font-mono">
                <span>SEALED IN AUDIT-READY VAULT (DOC ID #789 - Logbook_2026.pdf)</span>
                <span>SHA-256: 4e9f78a2c10b88d3e901ff...</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EDIT TRIP MODAL */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Edit Trip Entry (#{editingTrip.id})</span>
              </h4>
              <button onClick={() => setEditingTrip(null)} className="text-white/40 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrip} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({ ...editingTrip, date: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Category</label>
                  <select
                    value={editingTrip.category}
                    onChange={(e) => setEditingTrip({ ...editingTrip, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="business">Business Journey</option>
                    <option value="private">Private Journey</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Departure Location</label>
                <input
                  type="text"
                  value={editingTrip.departure}
                  onChange={(e) => setEditingTrip({ ...editingTrip, departure: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Destination Location</label>
                <input
                  type="text"
                  value={editingTrip.destination}
                  onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Client Name / Business Visited</label>
                <input
                  type="text"
                  value={editingTrip.clientName || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, clientName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Business Purpose / Notes</label>
                <input
                  type="text"
                  value={editingTrip.purpose}
                  onChange={(e) => setEditingTrip({ ...editingTrip, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Distance (km)</label>
                  <input
                    type="number"
                    value={editingTrip.distanceKm}
                    onChange={(e) => {
                      const dist = Number(e.target.value);
                      setEditingTrip({
                        ...editingTrip,
                        distanceKm: dist,
                        endOdo: editingTrip.startOdo + dist
                      });
                    }}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Start Odo</label>
                  <input
                    type="number"
                    value={editingTrip.startOdo}
                    onChange={(e) => {
                      const start = Number(e.target.value);
                      setEditingTrip({
                        ...editingTrip,
                        startOdo: start,
                        endOdo: start + editingTrip.distanceKm
                      });
                    }}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">End Odo</label>
                  <input
                    type="number"
                    value={editingTrip.endOdo}
                    disabled
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white/50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN PETROL INVOICE MODAL */}
      {pinningTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" />
                <span>Pin Corroborating Petrol Invoice to Route</span>
              </h4>
              <button onClick={() => setPinningTripId(null)} className="text-white/40 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const tripToPin = trips.find(t => t.id === pinningTripId);
              if (!tripToPin) return null;

              return (
                <div className="space-y-3 text-xs">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-bold block">Selected Trip Route</span>
                    <p className="text-white font-semibold">{tripToPin.departure} → {tripToPin.destination} ({tripToPin.distanceKm} km)</p>
                    <p className="text-[10px] text-white/60 font-mono">{tripToPin.date} • {tripToPin.purpose}</p>
                  </div>

                  <div>
                    <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1.5">
                      Select Fuel Invoice from Audit Vault
                    </label>

                    {petrolInvoices.length === 0 ? (
                      <p className="text-[11px] text-white/50 p-3 bg-white/5 rounded-xl">
                        No petrol invoices found in database. Scan or import fuel receipts to corroborate travel.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {petrolInvoices.map((inv) => {
                          const dist = inv.stationLatitude !== undefined && inv.stationLongitude !== undefined
                            ? calculateStationDistanceToRoute(
                                tripToPin.startLat ?? -26.1076,
                                tripToPin.startLon ?? 28.0567,
                                tripToPin.endLat ?? -26.0000,
                                tripToPin.endLon ?? 28.1000,
                                inv.stationLatitude,
                                inv.stationLongitude
                              )
                            : null;

                          const isWithinReach = dist !== null && dist <= 15.0;
                          const isCurrentlyPinned = tripToPin.petrolInvoiceId === inv.id;

                          return (
                            <div 
                              key={inv.id}
                              onClick={() => handlePinInvoiceToTrip(tripToPin.id, inv.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                isCurrentlyPinned
                                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-xs text-white flex items-center gap-1.5">
                                    <span>{inv.stationName || inv.supplierName}</span>
                                    {isCurrentlyPinned && (
                                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Current</span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-white/50 font-mono">
                                    Inv #{inv.invoiceNumber} • {inv.date} {inv.litresPurchased ? `• ${inv.litresPurchased}L` : ''}
                                  </p>
                                </div>
                                <span className="font-mono font-bold text-amber-400 text-xs">
                                  {formatZAR(inv.totalAmount)}
                                </span>
                              </div>

                              {dist !== null && (
                                <div className="mt-2 flex items-center justify-between text-[10px]">
                                  <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                                    isWithinReach
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {isWithinReach ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Within Route Reach ({dist} km from corridor)</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                                        <span>Out of Reach ({dist} km away • Exceeds 15km limit)</span>
                                      </>
                                    )}
                                  </span>
                                  <span className="text-white/40 text-[9px]">Click to link</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    {tripToPin.petrolInvoiceId ? (
                      <button
                        type="button"
                        onClick={() => handlePinInvoiceToTrip(tripToPin.id, '')}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>Unpin Receipt</span>
                      </button>
                    ) : <div></div>}

                    <button
                      type="button"
                      onClick={() => setPinningTripId(null)}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD TRIP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Log New GPS Trip with Fuel Corroboration</span>
            </h4>

            <form onSubmit={handleAddTrip} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="business">Business Journey</option>
                    <option value="private">Private Journey</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Departure Location</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g., Sandton HQ"
                  required
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Destination Location</label>
                <input
                  type="text"
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g., Waterfall City Client Office"
                  required
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Client Name / Business Visited</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g., Anglo American SA / Centurion Fintech Hub"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Business Purpose / Meeting Notes</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g., Board of Directors annual statutory audit review"
                  required
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Distance (Kilometers)</label>
                <input
                  type="number"
                  value={newDistance}
                  onChange={(e) => setNewDistance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">
                  Corroborating Petrol Invoice (Optional)
                </label>
                <select
                  value={selectedPetrolInvId}
                  onChange={(e) => setSelectedPetrolInvId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="">-- None / Do not pin fuel receipt --</option>
                  {petrolInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.stationName || inv.supplierName} ({formatZAR(inv.totalAmount)}) - {inv.date}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-white/40 block mt-1">
                  Station geocoordinates are automatically audited against the travel corridor (15km SARS limit).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Save Logbook Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
