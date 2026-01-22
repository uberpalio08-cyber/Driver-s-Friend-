
export type AppView = 'LANDING' | 'ONBOARDING' | 'HOME' | 'FINANCEIRO' | 'POSTOS' | 'CUSTOS' | 'VEICULO';
export type TrackingPhase = 'IDLE' | 'ON_SHIFT' | 'DESLOCAMENTO' | 'PASSAGEIRO';
export type FuelType = 'GASOLINA' | 'ETANOL';
export type ExpenseCategory = 'ALIMENTAÇÃO' | 'ÁGUA' | 'LUZ' | 'TELEFONE' | 'COMBUSTÍVEL' | 'MANUTENÇÃO' | 'OUTROS';

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
  taxValue: number; // Porcentagem que o app cobra (ex: 25)
  isFixedTax: boolean; // Se o valor da corrida é fixo (ex: Uber Moto / Entrega)
  defaultGross: number; // Valor da corrida fixa se isFixedTax for true
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
  endTime: number;      
  grossEarnings: number;
  appTax: number;
  fuelCost: number;
  maintReserve: number;
  personalReserve: number;
  netProfit: number;
  // KMs precisos do Odômetro
  emptyKm: number; // KM rodado aguardando
  displacementKm: number; // KM até o passageiro
  raceKm: number; // KM com passageiro
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
  isFullTank: boolean;
}

export interface StationProfile {
  id: string;
  name: string;
  lastPrice: number;
  lastFuelType: FuelType;
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
