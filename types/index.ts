// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'client' | 'lawyer' | 'admin';
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client extends User {
  role: 'client';
  location: {
    state: string;
    district: string;
    city?: string;
  };
  language: string[];
  cases: string[]; // Case IDs
}

export interface Lawyer extends User {
  role: 'lawyer';
  barNumber: string;
  specialization: LegalDomain[];
  experience: number; // years
  location: {
    state: string;
    district: string;
    city?: string;
  };
  languages: string[];
  availability: 'available' | 'busy' | 'unavailable';
  rating: number;
  totalCases: number;
  completedCases: number;
  hourlyRate?: number;
  bio?: string;
  education?: string[];
  certifications?: string[];
  cases: string[]; // Case IDs
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Legal Domain Types
export type LegalDomain = 
  | 'Civil Law'
  | 'Criminal Law'
  | 'Corporate Law'
  | 'Family Law'
  | 'Property Law'
  | 'Constitutional Law'
  | 'Tax Law'
  | 'Intellectual Property'
  | 'Labor Law'
  | 'Environmental Law'
  | 'Banking Law'
  | 'Insurance Law'
  | 'Real Estate Law'
  | 'Immigration Law'
  | 'Consumer Law'
  | 'Cyber Law'
  | 'Media Law'
  | 'Sports Law'
  | 'Healthcare Law'
  | 'Education Law';

// Case Types
export interface Case {
  _id: string;
  title: string;
  description: string;
  category: LegalDomain;
  clientId: string;
  lawyerId?: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: {
    state: string;
    district: string;
    city?: string;
  };
  documents: Document[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration?: number; // in days
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  tags: string[];
}

export type CaseStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'cancelled'
  | 'escalated';

// Document Types
export interface Document {
  _id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'jpg' | 'png' | 'other';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
}

// Message Types
export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'image';
  attachments?: Document[];
  isRead: boolean;
  createdAt: Date;
}

// Matchmaking Types
export interface LawyerMatch {
  lawyer: Lawyer;
  score: number;
  matchReasons: string[];
}

export interface MatchScore {
  domainMatch: number; // 0-100
  locationMatch: number; // 0-100
  availabilityScore: number; // 0-100
  experienceScore: number; // 0-100
  languageMatch: number; // 0-100
  totalScore: number; // 0-100
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'client' | 'lawyer';
  phone?: string;
}

export interface CaseForm {
  title: string;
  description: string;
  category: LegalDomain;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: {
    state: string;
    district: string;
    city?: string;
  };
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  tags: string[];
}

export interface LawyerProfileForm {
  barNumber: string;
  specialization: LegalDomain[];
  experience: number;
  location: {
    state: string;
    district: string;
    city?: string;
  };
  languages: string[];
  hourlyRate?: number;
  bio?: string;
  education?: string[];
  certifications?: string[];
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedId?: string; // Case ID, Message ID, etc.
  createdAt: Date;
}

// Analytics Types
export interface Analytics {
  totalUsers: number;
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalLawyers: number;
  totalClients: number;
  averageCaseResolutionTime: number;
  topSpecializations: Array<{
    domain: LegalDomain;
    count: number;
  }>;
  monthlyStats: Array<{
    month: string;
    newCases: number;
    completedCases: number;
    newUsers: number;
  }>;
}

// Chat Types
export interface ChatRoom {
  _id: string;
  participants: string[];
  caseId?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Search and Filter Types
export interface SearchFilters {
  category?: LegalDomain;
  location?: {
    state?: string;
    district?: string;
  };
  experience?: {
    min?: number;
    max?: number;
  };
  rating?: {
    min?: number;
    max?: number;
  };
  availability?: 'available' | 'busy' | 'unavailable';
  languages?: string[];
  budget?: {
    min?: number;
    max?: number;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// UI Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: any; // React.ReactNode
}

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

// Payment Types (for future implementation)
export interface Payment {
  _id: string;
  caseId: string;
  clientId: string;
  lawyerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'online' | 'bank_transfer' | 'cash';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
} 