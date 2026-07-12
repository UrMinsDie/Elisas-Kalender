export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type EntryType = 'guest_request' | 'admin_appointment' | 'blocked_time';
export type Visibility = 'busy_only' | 'public_title' | 'private';

export interface Appointment {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  title: string;
  activity_type: string;
  description: string | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  entry_type: EntryType;
  visibility: Visibility;
  admin_note: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicCalendarEvent {
  id: string;
  start_at: string;
  end_at: string;
  public_status: 'free' | 'pending' | 'busy' | 'blocked';
  public_title: string | null;
}

export interface BookingFormData {
  guestName: string;
  activityType: string;
  customTitle: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  privacyAccepted: boolean;
  website: string;
}
