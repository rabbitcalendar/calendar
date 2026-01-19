import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CalendarEvent, SocialPost, Client } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface CalendarContextType {
  events: CalendarEvent[];
  posts: SocialPost[];
  projectName: string;
  clients: Client[];
  currentClient: Client | null;
  user: Client | null; // Currently logged in user
  
  // Auth
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Client Management
  setCurrentClient: (client: Client | null) => void;
  addClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  resetPassword: (id: string, newPassword: string) => void;
  
  // Data
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  addPost: (post: SocialPost) => void;
  updatePost: (post: SocialPost) => void;
  deletePost: (id: string) => void;
  movePost: (id: string, newDate: string | null) => void;
  updateProjectName: (name: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

// Initial dummy data for demonstration
const INITIAL_CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'Rabbit', 
    username: 'rabbit',
    password: 'password123',
    role: 'agency'
  },
  { 
    id: '2', 
    name: 'Coca Cola', 
    username: 'coke',
    password: 'password123',
    role: 'client'
  }
];

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: '1', clientId: '2', title: 'New Year Sale', date: '2026-01-01', type: 'promotion', description: 'Site-wide sale' },
  { id: '2', clientId: '2', title: 'Product Launch', date: '2026-01-15', type: 'event', description: 'Launching the new gadget' },
];

const INITIAL_POSTS: SocialPost[] = [
  { id: '1', clientId: '2', title: 'Teaser Video', date: '2026-01-10', platform: 'instagram', contentType: 'video', brief: 'Short teaser for the launch', status: 'draft' },
  { id: '2', clientId: '2', title: 'Launch Announcement', date: '2026-01-15', platform: 'facebook', contentType: 'text', brief: 'Official announcement post', status: 'scheduled' },
];

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  // Load from local storage or use initial data
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('calendar_clients');
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch (e) {
      console.error('Failed to parse calendar_clients', e);
      return INITIAL_CLIENTS;
    }
  });

  const [user, setUser] = useState<Client | null>(() => {
    try {
      const saved = localStorage.getItem('calendar_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse calendar_user', e);
      return null;
    }
  });

  const [currentClient, setCurrentClientState] = useState<Client | null>(() => {
    try {
      const saved = localStorage.getItem('calendar_current_client');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse calendar_current_client', e);
      return null;
    }
  });

  // Wrapper for setCurrentClient to enforce permission logic
  const setCurrentClient = (client: Client | null) => {
    if (user?.role === 'agency') {
      setCurrentClientState(client);
    } else {
      // Clients can only select themselves
      if (client?.id === user?.id) {
        setCurrentClientState(client);
      }
    }
  };

  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('calendar_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch (e) {
      console.error('Failed to parse calendar_events', e);
      return INITIAL_EVENTS;
    }
  });

  const [allPosts, setAllPosts] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem('calendar_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch (e) {
      console.error('Failed to parse calendar_posts', e);
      return INITIAL_POSTS;
    }
  });

  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem('calendar_project_name') || 'ContentCal';
  });

  // Filtered data based on current client
  const events = currentClient ? allEvents.filter(e => e.clientId === currentClient.id) : [];
  const posts = currentClient ? allPosts.filter(p => p.clientId === currentClient.id) : [];

  // Auth Functions
  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = clients.find(c => c.username.toLowerCase() === username.toLowerCase() && c.password === password);
    if (foundUser) {
      setUser(foundUser);
      // If agency, set to self (Rabbit) by default so they land on their own calendar
      // If client, set to self
      setCurrentClientState(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setCurrentClientState(null);
    localStorage.removeItem('calendar_user');
    localStorage.removeItem('calendar_current_client');
  };

  // Sync Logic
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    // Load initial data from Supabase
    const loadData = async () => {
      // Try to load clients from Supabase
      try {
        const { data: clientsData, error } = await client.from('clients').select('*');
        if (error) throw error;
        
        // If we get data, use it. If table exists but is empty, use it (empty array).
        // If table doesn't exist (error), we fall to catch block.
        if (clientsData) {
          setClients(clientsData);
        }
      } catch (err) {
        console.warn('Supabase Error (Clients):', err);
        // Fallback to initial/local data if DB connection fails
        // This ensures login still works even if DB is down/missing
        setClients(prev => prev.length > 0 ? prev : INITIAL_CLIENTS);
      }

      try {
        const { data: eventsData, error } = await client.from('events').select('*');
        if (error) throw error;
        if (eventsData) setAllEvents(eventsData);
      } catch (err) {
        console.warn('Supabase Error (Events):', err);
      }

      try {
        const { data: postsData, error } = await client.from('posts').select('*');
        if (error) throw error;
        if (postsData) {
          const mappedPosts = postsData.map((p: any) => ({
            ...p,
            contentType: p.content_type,
            imageUrl: p.image_url
          }));
          setAllPosts(mappedPosts);
        }
      } catch (err) {
         console.warn('Supabase Error (Posts):', err);
      }
      
      try {
        const { data: projectData } = await client.from('project_settings').select('name').single();
        if (projectData) setProjectName(projectData.name);
      } catch (err) {
        // Ignore project settings error
      }
    };

    loadData();
  }, []);

  // Local Storage Sync
  useEffect(() => {
    localStorage.setItem('calendar_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('calendar_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('calendar_user');
    }
  }, [user]);

  useEffect(() => {
    if (currentClient) {
      localStorage.setItem('calendar_current_client', JSON.stringify(currentClient));
    } else {
      localStorage.removeItem('calendar_current_client');
    }
  }, [currentClient]);

  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(allEvents));
  }, [allEvents]);

  useEffect(() => {
    localStorage.setItem('calendar_posts', JSON.stringify(allPosts));
  }, [allPosts]);

  useEffect(() => {
    localStorage.setItem('calendar_project_name', projectName);
  }, [projectName]);

  // CRUD Operations
  const addClient = async (client: Client) => {
    // Only Agency can add clients
    if (user?.role !== 'agency') return;

    setClients([...clients, client]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('clients').insert([client]);
    }
  };

  const deleteClient = async (id: string) => {
    if (user?.role !== 'agency') return;
    
    // Prevent deleting self
    if (id === user.id) return;

    setClients(clients.filter(c => c.id !== id));
    
    // Also cleanup events and posts for this client?
    // Optional: setAllEvents(allEvents.filter(e => e.clientId !== id));
    
    if (isSupabaseConfigured && supabase) {
      await supabase.from('clients').delete().eq('id', id);
    }
  };

  const resetPassword = async (id: string, newPassword: string) => {
    if (user?.role !== 'agency') return;

    const updatedClients = clients.map(c => 
      c.id === id ? { ...c, password: newPassword } : c
    );
    setClients(updatedClients);
    
    if (isSupabaseConfigured && supabase) {
      await supabase.from('clients').update({ password: newPassword }).eq('id', id);
    }
  };

  const addEvent = async (event: CalendarEvent) => {
    const newEvent = { ...event, clientId: currentClient?.id || '1' };
    setAllEvents([...allEvents, newEvent]);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('events').insert([newEvent]);
    }
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    setAllEvents(allEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('events').update(updatedEvent).eq('id', updatedEvent.id);
    }
  };

  const deleteEvent = async (id: string) => {
    setAllEvents(allEvents.filter((e) => e.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('events').delete().eq('id', id);
    }
  };

  const addPost = async (post: SocialPost) => {
    const newPost = { ...post, clientId: currentClient?.id || '1' };
    setAllPosts([...allPosts, newPost]);
    if (isSupabaseConfigured && supabase) {
      const dbPost = {
        ...newPost,
        content_type: newPost.contentType,
        image_url: newPost.imageUrl
      };
      delete (dbPost as any).contentType;
      delete (dbPost as any).imageUrl;
      
      await supabase.from('posts').insert([dbPost]);
    }
  };

  const updatePost = async (updatedPost: SocialPost) => {
    setAllPosts(allPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    if (isSupabaseConfigured && supabase) {
      const dbPost = {
        ...updatedPost,
        content_type: updatedPost.contentType,
        image_url: updatedPost.imageUrl
      };
      delete (dbPost as any).contentType;
      delete (dbPost as any).imageUrl;

      await supabase.from('posts').update(dbPost).eq('id', updatedPost.id);
    }
  };

  const deletePost = async (id: string) => {
    setAllPosts(allPosts.filter((p) => p.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('posts').delete().eq('id', id);
    }
  };
  
  const movePost = async (id: string, newDate: string | null) => {
    setAllPosts(allPosts.map(p => p.id === id ? { ...p, date: newDate } : p));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('posts').update({ date: newDate }).eq('id', id);
    }
  };

  const updateProjectName = async (name: string) => {
    setProjectName(name);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('project_settings').upsert({ id: 1, name });
    }
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        posts,
        projectName,
        clients,
        currentClient,
        user,
        login,
        logout,
        setCurrentClient,
        addClient,
        deleteClient,
        resetPassword,
        addEvent,
        updateEvent,
        deleteEvent,
        addPost,
        updatePost,
        deletePost,
        movePost,
        updateProjectName,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
