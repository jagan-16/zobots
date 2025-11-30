export enum UserRole {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  OPTIONS = 'options',
  SERVICE_CAROUSEL = 'service_carousel',
  DATE_PICKER = 'date_picker',
  TIME_PICKER = 'time_picker',
  FORM_INPUT = 'form_input',
  OTP_INPUT = 'otp_input',
  CONFIRMATION = 'confirmation'
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl: string;
}

export interface TimeSlot {
  time: string; // "10:00 AM"
  startIso?: string;
  endIso?: string;
  available: boolean;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  userDetails: UserDetails;
  status: 'confirmed' | 'cancelled' | 'pending';
  paymentStatus?: 'paid' | 'pending';
  createdAt: string;
}

export interface LLMActionPayload {
  service_id?: string;
  date?: string;
  slot_id?: string;
  email?: string;
  phone?: string;
  name?: string;
  otp?: string;
  booking_id?: string;
  reason?: string;
  method?: string;
  slots?: TimeSlot[];
  services?: Service[];
  booking?: Partial<Booking>;
  amount_cents?: number;
  currency?: string;
  required?: string[];
  [key: string]: any;
}

export interface Message {
  id: string;
  role: UserRole;
  type: MessageType;
  content?: string;
  options?: Array<{ label: string; value: string; action: string }>;
  payload?: any;
  timestamp: Date;
  // Metadata for LLM state tracking
  action?: string;
  actionPayload?: LLMActionPayload;
}

export interface ChatState {
  isOpen: boolean;
  conversationStep: string;
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  userDetails: Partial<UserDetails>;
  draftBooking: Partial<Booking> | null;
}
