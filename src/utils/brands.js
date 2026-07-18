// Car brands available in India. The backend /brand endpoint is the source of
// truth (real ids are needed to create a listing); this list is merged in so
// the full set always shows. Entries only present here use a slug id.
export const DEFAULT_BRANDS = [
  { id: 'maruti-suzuki', name: 'Maruti Suzuki' },
  { id: 'hyundai', name: 'Hyundai' },
  { id: 'tata', name: 'Tata' },
  { id: 'mahindra', name: 'Mahindra' },
  { id: 'kia', name: 'Kia' },
  { id: 'toyota', name: 'Toyota' },
  { id: 'honda', name: 'Honda' },
  { id: 'renault', name: 'Renault' },
  { id: 'volkswagen', name: 'Volkswagen' },
  { id: 'skoda', name: 'Skoda' },
  { id: 'mg', name: 'MG' },
  { id: 'nissan', name: 'Nissan' },
  { id: 'ford', name: 'Ford' },
  { id: 'jeep', name: 'Jeep' },
  { id: 'citroen', name: 'Citroën' },
  { id: 'fiat', name: 'Fiat' },
  { id: 'datsun', name: 'Datsun' },
  { id: 'chevrolet', name: 'Chevrolet' },
  { id: 'isuzu', name: 'Isuzu' },
  { id: 'force-motors', name: 'Force Motors' },
  { id: 'mitsubishi', name: 'Mitsubishi' },
  { id: 'byd', name: 'BYD' },
  { id: 'mercedes-benz', name: 'Mercedes-Benz' },
  { id: 'bmw', name: 'BMW' },
  { id: 'audi', name: 'Audi' },
  { id: 'volvo', name: 'Volvo' },
  { id: 'jaguar', name: 'Jaguar' },
  { id: 'land-rover', name: 'Land Rover' },
  { id: 'lexus', name: 'Lexus' },
  { id: 'mini', name: 'Mini' },
  { id: 'porsche', name: 'Porsche' },
  { id: 'bentley', name: 'Bentley' },
  { id: 'rolls-royce', name: 'Rolls-Royce' },
  { id: 'maserati', name: 'Maserati' },
  { id: 'ferrari', name: 'Ferrari' },
  { id: 'lamborghini', name: 'Lamborghini' },
  { id: 'aston-martin', name: 'Aston Martin' },
  { id: 'maybach', name: 'Maybach' },
  { id: 'lotus', name: 'Lotus' },
  { id: 'mclaren', name: 'McLaren' },
  { id: 'bugatti', name: 'Bugatti' },
];

// Merge API brands (source of truth) with the static list, deduped by name.
// API entries win so their real ids are used when creating a listing.
export function mergeBrands(apiBrands = []) {
  const list = Array.isArray(apiBrands) ? [...apiBrands] : [];
  const seen = new Set(list.map((b) => String(b.name || '').trim().toLowerCase()));
  for (const b of DEFAULT_BRANDS) {
    if (!seen.has(b.name.toLowerCase())) list.push(b);
  }
  return list;
}
