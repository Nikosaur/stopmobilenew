export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MasterBarang: undefined;
  CekStok: undefined;
  InputCekStok: { barcode?: string; lokasi?: string };
  EditCekStok: {
    cekStokId: string;
    teamRecheckStockId?: string;
    isRecheckItem?: boolean;
    checked?: boolean;
    item?: CekStokItem;
  };
  StockScanner: {
    mode?: 'barcode' | 'lokasi';
    returnTo?: keyof RootStackParamList;
    returnKey?: 'barcode' | 'lokasi';
    onScanSuccess?: (value: string) => void;
  };
  Akun: undefined;
  StockCheck: { barcode?: string };
  StockList: undefined;
};

export interface TeamMember {
  id: string;
  nip: string;
  name: string;
  is_app_user: boolean;
}

export interface OpnameStage {
  id: string;
  name: string;
  code: string;
}

export interface OpnameType {
  id: string;
  name: string;
  code: string;
}

export interface Team {
  id: string;
  name: string;
  opname_stage: OpnameStage;
  members: TeamMember[];
  locations: Location[];
  created_at: string;
}

export interface StockOpname {
  id: string;
  name: string;
  description: string;
  opname_type: OpnameType;
  opname_stage: OpnameStage;
  start_date: string;
  finish_date: string | null;
}

export interface Location {
  id: string;
  name: string;
}

export interface User {
  username: string;
  name: string;
  roles: string[];
  active: boolean;
  internal_user: boolean;
  tahapOpname?: string;
  main_dealer_admin?: {
    active: boolean;
    is_observer: boolean;
    main_dealer: {
      id: string;
      dealer_code: string;
      name: string;
    };
  };
}

export interface AuthResponse {
  user: User;
  token: {
    token_type: string;
    access_token: string;
    expires_in: number;
    expired_at: number;
    refresh_token: string;
  };
}

export interface Product {
  id: string;
  sku_number: string;
  name: string;
  barcode: string;
  category: {
    code: string;
    name: string;
  };
  brand: {
    code: string;
    name: string;
  };
  group: {
    code: string;
    name: string;
  };
}

export interface CheckStock {
  check_stock_id: string;
  team_recheck_stock_id?: string;
  location_name: string;
  sku_number: string;
  name: string;
  qty_good: number;
  qty_obsolete: number;
  qty_adjust?: number;
  qty_oh?: number;
  qty_cl?: number;
  qty_rc1?: number;
  qty_rc2?: number;
  qty_rc3?: number;
  qty_rc4?: number;
  qty_rc5?: number;
  show_oh?: boolean;
  note?: string;
  barcode?: string;
  checked?: boolean;
  is_recheck_item: boolean;
}

export interface CheckStockInput {
  sku_number: string;
  qty_good: number;
  qty_obsolete: number;
  location: string;
  note?: string;
  barcode?: string;
}

export interface UpdateCheckStockInput {
  qty_good?: number;
  qty_obsolete?: number;
  location?: string;
  note?: string;
}



export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SyncStatus {
  lastSyncMaster: string | null;
  lastSyncCekStok: string | null;
  pendingUploads: number;
}

export interface CekStokItem {
  id: string;
  checkStockId?: string;
  teamRecheckStockId?: string;
  isRecheckItem?: boolean;
  checked?: boolean;
  sku: string;
  nama: string;
  lokasi: string;
  qtyBaik: number;
  qtyRusak: number;
  keterangan?: string;
  masterBarangId?: string;
  createdAt: string;
  kode?: string;
  barcode?: string;
}

export interface MasterBarang {
  id: string;
  sku: string;
  nama: string;
  kategori?: string;
  category?: string;
  brand?: string;
  group?: string;
  barcode?: string;
  kode?: string;
}

export interface StockItem extends Product {}

export interface StockCheckInput extends CheckStockInput {}
