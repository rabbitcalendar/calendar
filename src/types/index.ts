export interface Client {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'agency' | 'client';
}

export interface CalendarEvent {
  id: string;
  clientId: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  type: 'holiday' | 'promotion' | 'event' | 'other';
  description?: string;
}

export interface SocialPost {
  id: string;
  clientId: string;
  date: string | null; // ISO string YYYY-MM-DD or null
  platform: 'instagram' | 'facebook' | 'tiktok' | 'xiaohongshu' | 'lemon8' | 'google_maps';
  contentType: 'image' | 'video' | 'carousel' | 'story' | 'text';
  title: string;
  brief: string;
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  imageUrl?: string;
}
