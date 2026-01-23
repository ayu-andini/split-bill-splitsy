export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Person {
  id: string;
  name: string;
  amount: number;
  items?: BillItem[];
  percentage?: number;
}

export interface BillData {
  items: BillItem[];
  tax: number;
  service: number;
  total: number;
  subtotal: number;
  taxPercentage?: number;
  servicePercentage?: number;
}

export type SplitMethod = 'equal' | 'percentage' | 'custom';

export interface SplitResult {
  people: Person[];
  method: SplitMethod;
  billData: BillData;
}
