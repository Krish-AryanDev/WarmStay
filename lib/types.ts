export type Gender = "boys" | "girls" | "both";
export type RoomType = "single" | "double" | "triple";

export interface RoomTypeEntry {
  type: RoomType;
  price: number;
  ac: boolean;
  available: number;
}

export interface Amenities {
  wifi?: boolean;
  food?: boolean;
  laundry?: boolean;
  parking?: boolean;
  cctv?: boolean;
  ac?: boolean;
  ro_water?: boolean;
  warden?: boolean;
}

export interface PG {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string;
  area: string | null;
  distance_km: number | null;
  gender: Gender;
  starting_price: number;
  owner_name: string | null;
  owner_phone: string | null;
  amenities: Amenities;
  room_types: RoomTypeEntry[];
  photos: string[];
  is_active: boolean;
  created_at: string;
}
