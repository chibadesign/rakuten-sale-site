export interface RakutenItem {
  itemCode: string;
  itemName: string;
  shopName: string;
  itemPrice: number;
  pointRate: number;
  reviewAverage: number;
  reviewCount: number;
  imageUrl: string | null;
  itemUrl: string;
  category: string;
  discountRate: number | null;
  originalPrice: number | null;
}

export interface SaleData {
  items: RakutenItem[];
  cachedAt: number;
  nextUpdate: number;
  fromCache: boolean;
  isMock?: boolean;
}

export type Category =
  | "すべて"
  | "調理・製造道具"
  | "キッチン家電"
  | "製菓型・天板"
  | "デコレーション用品"
  | "製菓材料"
  | "クッキングシート・消耗品"
  | "ラッピング・梱包"
  | "保存容器"
  | "製菓用品セット"
  | "その他製菓用品";

export interface FilterState {
  category: Category;
  minPoints: number;
  maxPrice: number | null;
  sortBy: "price_asc" | "price_desc" | "review" | "points";
}
