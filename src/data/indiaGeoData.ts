// Accurate geographic boundary coordinates for the Republic of India and neighboring oceanic regions
// Formatted as [latitude, longitude] pairs for standard equirectangular / mercator radar projection

export const INDIA_BORDER_COORDS: [number, number][] = [
  // North: Kashmir & Ladakh
  [35.6, 76.8],
  [35.2, 75.8],
  [34.6, 74.2],
  [33.8, 74.3],
  [32.8, 74.9],
  [31.8, 74.5],
  [30.6, 74.1], // Punjab (near IXC)
  [29.8, 73.6],
  
  // West: Rajasthan & Thar
  [28.5, 71.8],
  [27.4, 70.5],
  [26.2, 70.3],
  [25.0, 71.0],
  [24.2, 71.1],

  // Gujarat: Rann of Kutch & Saurashtra Peninsula
  [23.8, 68.8],
  [23.2, 68.6],
  [22.8, 69.2],
  [22.3, 68.9], // Dwarka
  [21.6, 69.6],
  [20.7, 70.9], // Somnath
  [20.9, 71.6],
  [21.7, 72.5], // Gulf of Khambhat (near AMD)
  
  // West Coast: Konkan & Malabar
  [20.2, 72.8],
  [19.0, 72.8], // Mumbai (BOM)
  [17.8, 73.1],
  [15.4, 73.8], // Goa (GOI)
  [14.2, 74.3],
  [12.9, 74.8], // Mangalore
  [11.2, 75.7], // Calicut
  [10.0, 76.2], // Kochi (COK)
  [8.5, 76.9],  // Thiruvananthapuram (TRV)
  
  // Southern Apex
  [8.08, 77.55], // Kanyakumari
  
  // East Coast: Coromandel & Coastal Andhra
  [8.8, 78.1],
  [9.3, 79.1],  // Rameswaram
  [10.3, 79.8], // Point Calimere
  [11.9, 79.8], // Pondicherry
  [13.0, 80.3], // Chennai (MAA)
  [14.5, 80.1],
  [15.8, 80.3],
  [16.8, 82.2], // Godavari Delta
  [17.7, 83.3], // Visakhapatnam
  
  // Odisha & Bengal Delta
  [19.3, 85.0],
  [20.2, 86.7], // Paradip (near BBI)
  [21.4, 87.2],
  [21.7, 88.3], // Sundarbans / Kolkata delta (CCU)
  
  // East: Bengal border & Siliguri Corridor
  [22.5, 89.0],
  [24.0, 88.8],
  [25.3, 88.8],
  [26.4, 88.8], // Siliguri Corridor
  
  // North-East: Assam, Meghalaya, Arunachal
  [26.0, 89.9],
  [25.2, 90.5], // Meghalaya
  [25.1, 91.8],
  [24.0, 92.5],
  [23.5, 91.8], // Tripura
  [24.2, 93.3],
  [25.5, 94.5], // Nagaland
  [27.0, 95.8],
  [28.2, 96.5], // Eastern Arunachal
  [28.8, 95.2],
  [28.0, 93.5],
  [27.4, 92.1], // Tawang
  
  // Northern Himalayan Arc: Bhutan, Sikkim, Nepal border
  [26.8, 91.8], // Guwahati corridor (GAU)
  [26.8, 89.8],
  [27.1, 88.8],
  [27.9, 88.6], // Sikkim
  [27.1, 88.0],
  [27.8, 85.2], // Nepal ridge
  [28.8, 80.8],
  [30.2, 80.0], // Uttarakhand (Pithoragarh)
  [31.2, 78.8], // Himachal Pradesh
  [32.8, 77.2],
  [34.2, 77.8], // Leh / Ladakh
  [35.6, 76.8]  // Closing loop at northern frontier
];

// Sri Lanka outline south of Tamil Nadu
export const SRI_LANKA_COORDS: [number, number][] = [
  [9.8, 80.2],
  [9.2, 80.8],
  [8.5, 81.3],
  [7.5, 81.8],
  [6.8, 81.8],
  [6.0, 80.8],
  [6.0, 80.2],
  [6.9, 79.8],
  [8.0, 79.8],
  [9.0, 80.0],
  [9.8, 80.2]
];

// Indian Flight Information Regions (FIR) Airspace Divisions
export const FIR_REGIONS = [
  { name: 'DELHI FIR (VIDF)', center: [28.0, 77.0] as [number, number], label: 'DELHI FIR' },
  { name: 'MUMBAI FIR (VABF)', center: [19.0, 73.5] as [number, number], label: 'MUMBAI FIR' },
  { name: 'KOLKATA FIR (VECF)', center: [23.5, 87.5] as [number, number], label: 'KOLKATA FIR' },
  { name: 'CHENNAI FIR (VOMF)', center: [13.0, 78.5] as [number, number], label: 'CHENNAI FIR' }
];
