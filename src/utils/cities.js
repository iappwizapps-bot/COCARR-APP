// Major Indian cities the picker should always offer. The backend /city
// endpoint is the source of truth (real ids drive vehicle search); this list is
// merged in so the full set always shows even before the backend is seeded.
// Entries only present here (not from the API) use a slug id for display.
export const DEFAULT_CITIES = [
  { id: 'hyderabad', name: 'Hyderabad', lat: '17.3850', lng: '78.4867' },
  { id: 'bengaluru', name: 'Bengaluru', lat: '12.9716', lng: '77.5946' },
  { id: 'chennai', name: 'Chennai', lat: '13.0827', lng: '80.2707' },
  { id: 'mumbai', name: 'Mumbai', lat: '19.0760', lng: '72.8777' },
  { id: 'delhi', name: 'Delhi', lat: '28.7041', lng: '77.1025' },
  { id: 'pune', name: 'Pune', lat: '18.5204', lng: '73.8567' },
  { id: 'kolkata', name: 'Kolkata', lat: '22.5726', lng: '88.3639' },
  { id: 'ahmedabad', name: 'Ahmedabad', lat: '23.0225', lng: '72.5714' },
  { id: 'jaipur', name: 'Jaipur', lat: '26.9124', lng: '75.7873' },
  { id: 'kochi', name: 'Kochi', lat: '9.9312', lng: '76.2673' },
  { id: 'chandigarh', name: 'Chandigarh', lat: '30.7333', lng: '76.7794' },
  { id: 'vijayawada', name: 'Vijayawada', lat: '16.5062', lng: '80.6480' },
  { id: 'visakhapatnam', name: 'Visakhapatnam', lat: '17.6868', lng: '83.2185' },
  { id: 'coimbatore', name: 'Coimbatore', lat: '11.0168', lng: '76.9558' },
  { id: 'lucknow', name: 'Lucknow', lat: '26.8467', lng: '80.9462' },
  { id: 'indore', name: 'Indore', lat: '22.7196', lng: '75.8577' },
  { id: 'nagpur', name: 'Nagpur', lat: '21.1458', lng: '79.0882' },
  { id: 'warangal', name: 'Warangal', lat: '17.9689', lng: '79.5941' },
  { id: 'surat', name: 'Surat', lat: '21.1702', lng: '72.8311' },
  { id: 'bhopal', name: 'Bhopal', lat: '23.2599', lng: '77.4126' },
];

// Merge API cities (source of truth) with the static list, deduped by name.
// API entries win so their real ids are used for search.
export function mergeCities(apiCities = []) {
  const list = Array.isArray(apiCities) ? [...apiCities] : [];
  const seen = new Set(list.map((c) => String(c.name || '').trim().toLowerCase()));
  for (const c of DEFAULT_CITIES) {
    if (!seen.has(c.name.toLowerCase())) list.push(c);
  }
  return list;
}
