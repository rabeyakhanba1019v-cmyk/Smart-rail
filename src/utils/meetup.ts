export interface Station {
  name: string;
  lat: number;
  lng: number;
  line: string;
}

export const DHAKA_STATIONS: Station[] = [
  { name: 'Kamalapur', lat: 23.7337, lng: 90.4264, line: 'Main' },
  { name: 'Airport', lat: 23.8481, lng: 90.4027, line: 'Main' },
  { name: 'Tejgaon', lat: 23.7692, lng: 90.3991, line: 'Main' },
  { name: 'Banani', lat: 23.7937, lng: 90.4066, line: 'Main' },
  { name: 'Uttara', lat: 23.8759, lng: 90.3978, line: 'Main' },
  { name: 'Tongi', lat: 23.9049, lng: 90.4062, line: 'Main' },
  { name: 'Narayanganj', lat: 23.6232, lng: 90.4985, line: 'Branch' },
  { name: 'Chittagong', lat: 22.3569, lng: 91.7832, line: 'CTG' },
  { name: 'Sylhet', lat: 24.8949, lng: 91.8687, line: 'SYL' },
  { name: 'Rajshahi', lat: 24.3636, lng: 88.6241, line: 'RAJ' },
  { name: 'Khulna', lat: 22.8456, lng: 89.5403, line: 'KHL' },
  { name: 'Comilla', lat: 23.4607, lng: 91.1809, line: 'CTG' },
  { name: 'Mymensingh', lat: 24.7471, lng: 90.4203, line: 'MYM' },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function suggestMeetup(
  buyerStation: string,
  buyerTime: string,
  sellerStation: string,
  sellerTime: string
): { station: string; time: string; reasoning: string } {
  const buyer = DHAKA_STATIONS.find(s => s.name.toLowerCase() === buyerStation.toLowerCase());
  const seller = DHAKA_STATIONS.find(s => s.name.toLowerCase() === sellerStation.toLowerCase());

  if (!buyer || !seller) {
    const avgMins = Math.round((parseTime(buyerTime) + parseTime(sellerTime)) / 2);
    return {
      station: buyerStation || sellerStation,
      time: minutesToTime(avgMins),
      reasoning: 'Midpoint time suggested based on availability.',
    };
  }

  let bestStation = buyer;
  let minScore = Infinity;

  for (const station of DHAKA_STATIONS) {
    const distToBuyer = haversineDistance(station.lat, station.lng, buyer.lat, buyer.lng);
    const distToSeller = haversineDistance(station.lat, station.lng, seller.lat, seller.lng);
    const score = distToBuyer + distToSeller;
    if (score < minScore) {
      minScore = score;
      bestStation = station;
    }
  }

  const buyerMins = parseTime(buyerTime);
  const sellerMins = parseTime(sellerTime);
  const avgMins = Math.round((buyerMins + sellerMins) / 2);

  return {
    station: bestStation.name,
    time: minutesToTime(avgMins),
    reasoning: `${bestStation.name} is the optimal midpoint between ${buyer.name} and ${seller.name}, minimizing travel distance for both parties.`,
  };
}
