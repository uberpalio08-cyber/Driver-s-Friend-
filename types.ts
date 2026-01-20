
// Definindo os tipos básicos da aplicação
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
}

export interface Expense {
  id: string;
  date: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  isWorkExpense: boolean; // Se true, abate do lucro do dia/turno
}

export interface Race {
  id: string;
  date: number;
  kmDeslocamento: number;
  kmPassageiro: number;
  grossEarnings: number;
  netProfit: number; 
  fuelCost: number;
  appTax: number;
  maintenanceReserve: number;
  emergencyReserve: number;
}

export interface UserProfile {
  name: string;
  appName: string;
  car: CarInfo;
  appPercentage: number;
  maintenanceReservePercent: number;
  emergencyReservePercent: number;
  dailyGoal: number;
  monthlyGoal: number;
  currentFuelLevel: number; 
  lastOdometer: number; 
  calculatedAvgConsumption: number; 
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
  dailyExpenses: Expense[]; // Gastos (lanches, etc) feitos durante este turno
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
  currentDailyExpenses: Expense[]; // Gastos do turno atual
  isLoaded: boolean;
}
