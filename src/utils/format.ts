export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dt: string): string {
  return new Date(dt).toLocaleString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const SEAT_TYPES = [
  { value: 'S_CHAIR', label: 'Shovan Chair' },
  { value: 'SHOVAN', label: 'Shovan' },
  { value: 'F_CHAIR', label: 'First Class Chair' },
  { value: 'SNIGDHA', label: 'Snigdha' },
  { value: 'AC_S', label: 'AC Seat' },
  { value: 'AC_B', label: 'AC Berth' },
  { value: 'F_BERTH', label: 'First Class Berth' },
];

export const BANGLADESH_STATIONS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Comilla',
  'Mymensingh', 'Narayanganj', 'Bogra', 'Jessore', 'Dinajpur', 'Rangpur',
  'Noakhali', 'Barisal', 'Faridpur', 'Pabna', 'Tangail', 'Sirajganj',
  'Tongi', 'Airport', 'Kamalapur', 'Tejgaon', 'Banani', 'Uttara',
];

export const TRAIN_NAMES = [
  'Subarna Express', 'Sundarban Express', 'Mohanagar Express', 'Turna Nishita',
  'Parabat Express', 'Tista Express', 'Jamuna Express', 'Padma Express',
  'Silk City Express', 'Rupsha Express', 'Mahananda Express', 'Drutojan Express',
  'Egarosindhur Godhuli', 'Kalni Express', 'Udayan Express', 'Chattala Express',
];
