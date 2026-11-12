import { ASSETS } from './assets';

export interface BarberItem {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  price: number;
  avatarUrl: string;
  isAvailable: boolean;
  etaMinutes: number;
  badge?: string;
  cutsDone?: number;
}

export interface ServiceCategory {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  badge?: string;
  isPopular?: boolean;
  spanColumns?: number;
  description?: string;
  startsFrom?: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  popular?: boolean;
  features?: string[];
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'barber',
    title: 'Barber & Grooming',
    tagline: '14 Barbers nearby',
    icon: 'content-cut',
    badge: 'Most Popular',
    isPopular: true,
    spanColumns: 2,
    description: 'Master haircuts, precision beard sculpt, hot towel shaves & scalp treatments.',
    startsFrom: 'Rp 75.000',
  },
  {
    id: 'spa',
    title: 'Beauty & Spa',
    tagline: '8 Therapists',
    icon: 'spa',
    description: 'Facial therapy, reflexology, manicures & deep stress release.',
  },
  {
    id: 'cleaning',
    title: 'Home Cleaning',
    tagline: '22 Cleaners',
    icon: 'cleaning-services',
    description: 'Hydro-vacuum dust mites, room deep sanitization & kitchen shine.',
  },
  {
    id: 'appliance',
    title: 'AC & Appliance Care',
    tagline: '6 Techs',
    icon: 'hvac',
    description: 'Pressure coil cleaning, freon check & quick diagnostic',
    spanColumns: 2,
  },
];

export const TOP_BARBERS: BarberItem[] = [
  {
    id: 'barber-rian',
    name: 'Rian Pratama',
    specialty: 'Fade & Taper Specialist',
    rating: 4.9,
    reviewsCount: 342,
    distanceKm: 1.2,
    price: 85000,
    avatarUrl: ASSETS.barberRian,
    isAvailable: true,
    etaMinutes: 12,
    badge: 'MASTER BARBER',
    cutsDone: 342,
  },
  {
    id: 'barber-bima',
    name: 'Bima Sakti',
    specialty: 'Beard & Shave Pro',
    rating: 4.9,
    reviewsCount: 218,
    distanceKm: 2.4,
    price: 95000,
    avatarUrl: ASSETS.barberBima,
    isAvailable: true,
    etaMinutes: 15,
    badge: 'TOP RATED',
    cutsDone: 218,
  },
  {
    id: 'barber-aris',
    name: 'Aris Munandar',
    specialty: 'Classic Cut & Pomade',
    rating: 4.8,
    reviewsCount: 180,
    distanceKm: 3.1,
    price: 75000,
    avatarUrl: ASSETS.barberAris,
    isAvailable: true,
    etaMinutes: 20,
    badge: 'HYGIENE CERTIFIED',
    cutsDone: 180,
  },
];

export const SERVICE_CATALOG: ServiceItem[] = [
  {
    id: 'srv-1',
    categoryId: 'barber',
    name: 'Signature Haircut & Wash',
    durationMinutes: 45,
    price: 75000,
    description: 'Potong rambut presisi sesuai bentuk wajah, cuci rambut dengan hair tonic, dan styling pomade.',
    popular: true,
    features: ['Konsultasi Gaya', 'Cuci Rambut + Tonic', 'Hot Towel', 'Styling'],
  },
  {
    id: 'srv-2',
    categoryId: 'barber',
    name: 'Royal Shave & Beard Sculpting',
    durationMinutes: 30,
    price: 55000,
    description: 'Pencukuran jenggot dan kumis presisi dengan pisau steril sekali pakai & hot towel therapy.',
    features: ['Pre-shave Oil', 'Hot Towel Therapy', 'Aftershave Balm'],
  },
  {
    id: 'srv-3',
    categoryId: 'barber',
    name: 'Full VIP Grooming Package',
    durationMinutes: 75,
    price: 135000,
    description: 'Haircut + Beard Styling + Facial Scrub pembersih komedo + Massage kepala & pundak.',
    popular: true,
    features: ['Haircut & Wash', 'Beard Trim', 'Facial Scrub', 'Head & Shoulder Massage'],
  },
  {
    id: 'srv-4',
    categoryId: 'spa',
    name: 'Traditional Body Massage',
    durationMinutes: 60,
    price: 120000,
    description: 'Pijat tradisional aromaterapi untuk melancarkan sirkulasi darah dan meredakan ketegangan otot.',
    features: ['Essential Oils', 'Akupresur Titik Pegal', 'Warm Herbal Tea'],
  },
  {
    id: 'srv-5',
    categoryId: 'cleaning',
    name: 'Deep Cleaning Room (2 Jam)',
    durationMinutes: 120,
    price: 150000,
    description: 'Pembersihan mendalam kamar tidur atau ruang tamu dengan disinfektan dan vacum cleaner profesional.',
    features: ['Pembersihan Debu & Sawang', 'Pel Disinfektan', 'Vacuum Sofa/Kasur'],
  },
  {
    id: 'srv-6',
    categoryId: 'appliance',
    name: 'Cuci AC Standard (0.5 - 2 PK)',
    durationMinutes: 60,
    price: 85000,
    description: 'Pembersihan unit indoor & outdoor AC, filter udara, dan pengecekan tekanan freon.',
    features: ['Cuci Evaporator', 'Cuci Kondensor', 'Cek Tekanan Freon'],
  },
];
