
export type AppView = 'LANDING' | 'ONBOARDING' | 'HOME' | 'FINANCEIRO' | 'POSTOS' | 'CUSTOS' | 'VEICULO';
export type TrackingPhase = 'IDLE' | 'PARTICULAR' | 'DESLOCAMENTO' | 'PASSAGEIRO';
export type FuelType = 'GASOLINA' | 'ETANOL';
export type ExpenseCategory = 'ALIMENTAÇÃO' | 'ÁGUA' | 'LUZ' | 'TELEFONE' | 'OUTROS';

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
  isAIGenerated?: boolean;
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
  acceptedAt: number;
  finishedAt: number;
  kmDeslocamento: number;
  kmPassageiro: number;
  grossEarnings: number;
  netProfit: number; 
  fuelCost: number;
  appTax: number;
  maintenanceReserve: number;
  emergencyReserve: number;
  score?: 'GOOD' | 'OK' | 'BAD';
}

export interface UserProfile {
  name: string;
  appName: string;
  car: CarInfo;
  appPercentage: number;
  maintenanceReservePercent: number;
  emergencyReservePercent: number;
  desiredSalary: number;
  personalFixedCosts: number;
  workingDaysPerMonth: number;
  dailyGoal: number;
  currentFuelLevel: number; 
  lastOdometer: number; 
  calculatedAvgConsumption: number;
  maintenanceCostPerKm?: number;
  useFixedFare: boolean;
  fixedFareValue: number;
}

export interface GasStation {
  id: string;
  name: string;
  lastGasPrice?: number;
  lastEtanolPrice?: number;
}

export interface RefuelEntry {
  id: string;
  date: number;
  stationId: string;
  fuelType: FuelType;
  pricePerLiter: number;
  liters: number;
  isFullTank: boolean;
  odometerAtRefuel: number;
}

export interface TripSession {
  id: string;
  date: number;
  startOdometer: number;
  endOdometer: number;
  kmParticular: number;
  races: Race[];
  dailyExpenses: Expense[];
  totalGross: number;
  totalNet: number;
}

export interface AppState {
  user: UserProfile | null;
  sessions: TripSession[];
  stations: GasStation[];
  refuels: RefuelEntry[];
  expenses: Expense[];
  maintenance: MaintenanceTask[];
  currentRaces: Race[];
  currentDailyExpenses: Expense[];
  isLoaded: boolean;
}
