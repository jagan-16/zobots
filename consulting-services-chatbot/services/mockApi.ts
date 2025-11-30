import { Service, Booking, TimeSlot, UserDetails } from '../types';

// Mock Data
const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'General Consultation',
    description: 'A standard check-up to assess your overall health and vitals.',
    durationMinutes: 30,
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200&q=80'
  },
  {
    id: 's2',
    name: 'Specialist Referral',
    description: 'Consultation to determine if you need a specialist surgeon or therapy.',
    durationMinutes: 45,
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1537368910025-4003508ce487?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200&q=80'
  },
  {
    id: 's3',
    name: 'Telehealth Session',
    description: 'Remote video consultation via secure HIPAA-compliant link.',
    durationMinutes: 20,
    price: 40,
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-217358c7db81?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200&q=80'
  }
];

let MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    serviceId: 's1',
    serviceName: 'General Consultation',
    date: new Date().toISOString(),
    time: '10:00 AM',
    userDetails: { name: 'John Doe', email: 'john@example.com', phone: '+15550101' },
    status: 'confirmed',
    createdAt: new Date().toISOString()
  }
];

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getServices: async (): Promise<Service[]> => {
    await delay(500);
    return SERVICES;
  },

  getAvailability: async (date: Date, serviceId: string): Promise<TimeSlot[]> => {
    await delay(600);
    // Simple availability logic: random slots
    const slots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '01:00 PM', '01:30 PM', '02:00 PM', 
      '03:30 PM', '04:00 PM'
    ];
    
    // Shuffle or random filter to simulate different days
    return slots
      .filter(() => Math.random() > 0.3)
      .map(time => ({
        time,
        available: true
      }));
  },

  sendOtp: async (phone: string): Promise<boolean> => {
    await delay(800);
    console.log(`[Twilio Verify] Sending SMS OTP to ${phone}: 123456`);
    return true;
  },

  verifyOtp: async (phone: string, code: string): Promise<boolean> => {
    await delay(600);
    console.log(`[Twilio Verify] Verifying code '${code}' for ${phone}`);
    // Any code ending in '6' is valid for demo purposes, or specific code
    return code === '123456' || code.endsWith('6'); 
  },

  createBooking: async (payload: any): Promise<Booking> => {
    await delay(1000);
    
    // The LLM might pass flat fields or nested, we normalize here
    const service = SERVICES.find(s => s.id === payload.service_id) || SERVICES[0];
    const userDetails: UserDetails = {
        name: payload.name || payload.userDetails?.name || 'Guest',
        email: payload.email || payload.userDetails?.email || 'guest@example.com',
        phone: payload.phone || payload.userDetails?.phone || '0000000000'
    };

    const newBooking: Booking = {
      id: `b${Date.now()}`,
      serviceId: service.id,
      serviceName: service.name,
      date: payload.date || new Date().toISOString(),
      time: payload.time || payload.slot_id || '10:00 AM',
      userDetails,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    MOCK_BOOKINGS.push(newBooking);
    return newBooking;
  },

  rescheduleBooking: async (bookingId: string, newDate: string, newTime: string): Promise<Booking | null> => {
    await delay(1000);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      MOCK_BOOKINGS[index].date = newDate;
      MOCK_BOOKINGS[index].time = newTime;
      MOCK_BOOKINGS[index].status = 'confirmed';
      MOCK_BOOKINGS[index].id = `b${Date.now()}`; // New ID to simulate new event, strictly speaking not needed but good for React keys
      return MOCK_BOOKINGS[index];
    }
    return null;
  },

  getBookingsByEmail: async (email: string): Promise<Booking[]> => {
    await delay(700);
    if (!email) return [];
    return MOCK_BOOKINGS.filter(b => b.userDetails.email.toLowerCase().includes(email.toLowerCase()));
  },

  getAllBookings: async (): Promise<Booking[]> => {
    await delay(400);
    return MOCK_BOOKINGS;
  },

  cancelBooking: async (bookingId: string): Promise<boolean> => {
    await delay(600);
    const index = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      MOCK_BOOKINGS[index].status = 'cancelled';
      return true;
    }
    return false;
  }
};