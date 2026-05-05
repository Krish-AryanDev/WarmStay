-- Sample seed data for local testing. Replace with real PGs before launch.

insert into pgs (slug, name, description, address, area, distance_km, gender, starting_price, owner_name, owner_phone, amenities, room_types, photos)
values
(
  'sharma-pg',
  'Sharma PG',
  'Clean, fully-furnished PG just 5 minutes walk from MUJ gate. Home-style food, 24x7 power backup.',
  'Plot 12, Dehmi Kalan, Jaipur',
  'Dehmi Kalan',
  0.4,
  'boys',
  7500,
  'Mr. Sharma',
  '919999900001',
  '{"wifi":true,"food":true,"laundry":true,"parking":true,"cctv":true,"ac":false,"ro_water":true,"warden":true}'::jsonb,
  '[
    {"type":"single","price":12000,"ac":false,"available":2},
    {"type":"double","price":7500,"ac":false,"available":4},
    {"type":"double","price":9000,"ac":true,"available":2}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200"
  ]'::jsonb
),
(
  'gupta-residency',
  'Gupta Residency',
  'AC rooms, gated security, mess on premises. Walking distance to MUJ.',
  'GVK Road, Dehmi Kalan, Jaipur',
  'Dehmi Kalan',
  0.8,
  'girls',
  9000,
  'Mrs. Gupta',
  '919999900002',
  '{"wifi":true,"food":true,"laundry":true,"parking":false,"cctv":true,"ac":true,"ro_water":true,"warden":true}'::jsonb,
  '[
    {"type":"single","price":14000,"ac":true,"available":1},
    {"type":"double","price":9000,"ac":true,"available":3}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"
  ]'::jsonb
),
(
  'sunrise-pg',
  'Sunrise Co-Living',
  'Modern co-living for boys & girls (separate floors). Gym, study room, common kitchen.',
  'Bagru Khurd, Jaipur',
  'Bagru',
  1.5,
  'both',
  8500,
  'Sunrise Hosts',
  '919999900003',
  '{"wifi":true,"food":true,"laundry":true,"parking":true,"cctv":true,"ac":true,"ro_water":true,"warden":false}'::jsonb,
  '[
    {"type":"single","price":13500,"ac":true,"available":3},
    {"type":"double","price":8500,"ac":true,"available":6},
    {"type":"triple","price":6500,"ac":false,"available":3}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"
  ]'::jsonb
);
