// ============================================================================
// Database Models — Aligned 1:1 with the PostgreSQL Entity-Relationship Schema
// ============================================================================

// --- ENUMS ---
export type VideoSourceType = 'RTSP' | 'HTTP' | 'USB' | 'ONVIF';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR';
export type HardwareConnectionType = 'SERIAL' | 'USB' | 'BLUETOOTH' | 'NETWORK';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'DISMISSED';
export type EvidenceType = 'VIDEO_CLIP' | 'SNAPSHOT' | 'AUDIO_CLIP';
export type ContactType = 'INTERNAL_SECURITY' | 'POLICE' | 'MEDICAL' | 'ADMINISTRATOR' | 'FIRE_DEPT';
export type NotificationStatus = 'SENT' | 'PENDING' | 'FAILED';
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';

// ============================================================================
// 1. INFRASTRUCTURE DOMAIN
// ============================================================================

export interface Zone {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Camera {
  id: number;
  zone_id: number;
  name: string;
  source_type: VideoSourceType;
  source: string;
  fps: number;
  captures_audio: boolean;
  status: ConnectionStatus;
  is_active: boolean;
  // UI preview helpers (for live video simulation)
  code?: string;
  preview_image?: string;
}

export interface Siren {
  id: number;
  zone_id: number | null;
  name: string;
  connection_type: HardwareConnectionType;
  port: string | null;
  bluetooth_address: string | null;
  status: ConnectionStatus;
  is_active: boolean;
  is_sounding?: boolean;
}

// ============================================================================
// 2. INCIDENTS & EVIDENCE DOMAIN
// ============================================================================

export interface IncidentCategory {
  id: number;
  code: string;
  name: string;
  severity_level: SeverityLevel;
  confidence_threshold: number; // numeric(3, 2) e.g. 0.85
  persistence_ms: number;       // int e.g. 1500
  is_active: boolean;
}

export interface Incident {
  id: number;
  camera_id: number;
  category_id: number;
  confidence: number;           // numeric(5, 4) e.g. 0.9420
  occurred_at: string;          // timestamptz ISO string
  alarm_active: boolean;
  silenced_by: number | null;   // FK -> users.id
  silenced_at: string | null;   // timestamptz
  review_status: ReviewStatus;
  reviewed_by: number | null;   // FK -> users.id
  reviewed_at?: string | null;
  operator_notes?: string | null;
  bounding_box?: { top: number; left: number; width: number; height: number };
}

export interface Evidence {
  id: number;
  incident_id: number;
  type: EvidenceType;
  file_path: string;
  created_at: string;           // timestamptz
  duration_seconds?: number;
  thumbnail_url?: string;
}

// ============================================================================
// 3. ALERTS & PROTOCOLS DOMAIN
// ============================================================================

export interface Protocol {
  id: number;
  category_id: number;
  title: string;
  steps: string;                // text (newline-separated steps)
  is_active: boolean;
}

export interface EmergencyContact {
  id: number;
  name: string;
  type: ContactType;
  phone: string | null;
  email: string | null;
  receives_email: boolean;
  is_active: boolean;
}

export interface NotificationLog {
  id: number;
  incident_id: number;
  contact_id: number | null;
  recipient_email: string;
  status: NotificationStatus;
  error: string | null;
  sent_at: string;              // timestamptz
}

// ============================================================================
// 4. USERS & TERMS DOMAIN
// ============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;           // timestamptz
}

export interface TermsAndConditions {
  id: number;
  version: string;
  title: string;
  content: string;
  is_current: boolean;
  published_at: string;         // timestamptz
  created_at: string;           // timestamptz
}

export interface TermsAcceptance {
  id: number;
  user_id: number;
  terms_id: number;
  accepted: boolean;
  accepted_at: string;          // timestamptz
}
