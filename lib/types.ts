export type Gender = "boys" | "girls" | "both";
export type RoomType = "single" | "double" | "triple";

export interface RoomTypeEntry {
  type: RoomType;
  price: number;
  ac: boolean;
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
  [key: string]: boolean | undefined;
}

export interface Inquiry {
  id: string;
  pg_id: string | null;
  pg_slug: string | null;
  student_name: string;
  student_phone: string;
  move_in_date: string | null;
  budget: number | null;
  room_preference: string | null;
  notes: string | null;
  handled: boolean;
  handled_at: string | null;
  created_at: string;
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
