export type AppView = 'LANDING' | 'ONBOARDING' | 'HOME' | 'FINANCEIRO' | 'POSTOS' | 'CUSTOS' | 'VEICULO';
export type TrackingPhase = 'IDLE' | 'ON_SHIFT' | 'ACCEPTING' | 'BOARDING';
export type FuelType = 'GASOLINA' | 'ETANOL';
export type ExpenseCategory = 'ALIMENTAÇÃO' | 'ÁGUA' | 'LUZ' | 'TELEFONE' | 'COMBUSTÍVEL' | 'MANUTENÇÃO' | 'OUTROS';

// Re-exportando Type para uso nos componentes que lidam com IA
export enum Type {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  NULL = 'NULL',
}

export interface CarInfo {
  brand: string;
  model: string;
  year: string;
  power: string;
  tankCapacity: number;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  lastOdo: number;
  interval: number;
  lastCost: number;
  alertBeforeKm: number;
}

export interface AppProfile {
  id: string;
  name: string;
  taxPercentage: number;
  isFixedGross: boolean;
  fixedGrossValue: number;
}

export interface Expense {
  id: string;
  date: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  isWorkExpense: boolean;
}

export interface Race {
  id: string;
  date: number;
  appName: string;
  startTime: number;    
  boardingTime: number; 
  endTime: number;      
  kmDeslocamento: number;
  kmPassageiro: number;
  grossEarnings: number;
  appTax: number;
  fuelCost: number;
  maintReserve: number;
  personalReserve: number;
  netProfit: number;
}

export interface StationProfile {
  id: string;
  name: string;
  lastPrice: number;
  lastFuelType: FuelType;
}

export interface RefuelEntry {
  id: string;
  date: number;
  stationName: string;
  fuelType: FuelType;
  pricePerLiter: number;
  amountMoney: number;
  liters: number;
  odometerAtRefuel: number;
}

export interface UserProfile {
  name: string;
  car: CarInfo;
  desiredSalary: number;
  personalFixedCosts: number;
  workingDaysPerMonth: number;
  dailyGoal: number;
  currentFuelLevel: number; 
  lastOdometer: number; 
  calculatedAvgConsumption: number;
  appProfiles: AppProfile[];
  selectedAppProfileId: string;
  stationProfiles: StationProfile[];
}

export interface TripSession {
  id: string;
  date: number;
  startOdometer: number;
  endOdometer: number;
  kmParticular: number;
  races: Race[];
  totalGross: number;
  totalNet: number;
}

export interface AppState {
  user: UserProfile | null;
  sessions: TripSession[];
  refuels: RefuelEntry[];
  expenses: Expense[];
  maintenance: MaintenanceTask[];
  currentRaces: Race[];
  isLoaded: boolean;
}