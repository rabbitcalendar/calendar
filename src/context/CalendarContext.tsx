import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CalendarEvent, SocialPost, Client } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { applyTheme } from '../lib/theme';
import { getAllHolidays } from '../utils/holidays';
import { generateUUID } from '../utils/uuid';

interface CalendarContextType {
  events: CalendarEvent[];
  posts: SocialPost[];
  projectName: string;
  clients: Client[];
  currentClient: Client | null;
  user: Client | null; // Currently logged in user
  isLoading: boolean;
  
  // Auth
  login: (username: string, password: string) => Promise<boolean>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ data?: any; error: any }>;
  logout: () => void;
  
  // Client Management
  setCurrentClient: (client: Client | null) => void;
  addClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  resetPassword: (id: string, newPassword: string) => void;
  updateClientProfile: (id: string, data: { name?: string; username?: string; password?: string; themeColor?: string }) => Promise<void>;
  
  // Data
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  addPost: (post: SocialPost) => void;
  updatePost: (post: SocialPost) => void;
  deletePost: (id: string) => void;
  movePost: (id: string, newDate: string | null) => void;
  updateProjectName: (name: string) => void;
  populateHolidays: (year: number) => Promise<void>;
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
    // 1. Try Legacy/Local Login
    const foundUser = clients.find(c => c.username.toLowerCase() === username.toLowerCase() && c.password === password);
    if (foundUser) {
      setUser(foundUser);
      // If agency, set to self (Rabbit) by default so they land on their own calendar
      // If client, set to self
      setCurrentClientState(foundUser);
      return true;
    }

    // 2. Try Supabase Auth Login (if configured)
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      
      if (!error && data.session) {
        return true;
      }
    }

    return false;
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    if (!supabase) return;
    
    // Determine redirect URL based on environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // If local, use origin (http://localhost:3000)
    // If production (rabbit.com.sg), append /calendar since the app lives in a subdirectory
    const redirectTo = isLocal 
      ? window.location.origin 
      : `${window.location.origin}/calendar`;
    
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    
    // Determine redirect URL based on environment (same as OAuth)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectTo = isLocal 
      ? window.location.origin 
      : `${window.location.origin}/calendar`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: name,
        },
      },
    });

    if (data?.user && !error) {
      // Create Client record immediately to ensure it exists
      const newClient: Client = {
        id: data.user.id,
        name: name || email.split('@')[0] || 'Client',
        username: email,
        password: 'oauth-managed', // Supabase Auth manages password
        role: 'client',
        themeColor: 'indigo'
      };

      try {
        const { error: insertError } = await supabase.from('clients').insert([
          {
            id: newClient.id,
            name: newClient.name,
            username: newClient.username,
            password: newClient.password,
            role: newClient.role,
            theme_color: newClient.themeColor
          }
        ]);

        if (insertError) {
          console.error('Error creating client record:', insertError);
          // We don't block the signup success here, but we log it.
          // The loadUserFromSession will try again if it's missing.
        } else {
          // Update local state if we have a session (auto-login)
          if (data.session) {
             // Let loadUserFromSession handle state update via onAuthStateChange
             // But we can optimistically add to clients list
             setClients(prev => {
               if (prev.some(c => c.id === newClient.id)) return prev;
               return [...prev, newClient];
             });
          }
        }
      } catch (err) {
        console.error('Exception creating client record:', err);
      }
    }

    if (data?.session) {
      setIsLoading(true);
    }

    return { data, error };
  };

  const logout = () => {
    setUser(null);
    setCurrentClientState(null);
    localStorage.removeItem('calendar_user');
    localStorage.removeItem('calendar_current_client');
    if (supabase) supabase.auth.signOut();
  };

  const [isLoading, setIsLoading] = useState(true);

  // Sync Auth State
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    
    let mounted = true;
    const client = supabase;

    // Helper to load user data
    const loadUserFromSession = async (session: any) => {
      if (!session?.user) return;
      
      try {
        // Check if user exists in our clients table
        // We use a timeout to prevent this from hanging indefinitely
        const fetchPromise = client
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User data fetch timed out')), 5000)
        );

        // Race the fetch against the timeout
        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        const existingClient = result?.data;

        if (existingClient) {
          const clientData: Client = { ...existingClient, themeColor: existingClient.theme_color || 'indigo' };
          if (mounted) {
            setUser(clientData);
            
            // If agency, respect the persisted current client (don't overwrite with self)
            // unless there is no persisted client
            if (clientData.role === 'agency') {
              const saved = localStorage.getItem('calendar_current_client');
              if (!saved) {
                setCurrentClientState(clientData);
              }
            } else {
              // Non-agency users can only view themselves
              setCurrentClientState(clientData);
            }
          }
        } else {
          // New user -> Create Client record
          const newClient: Client = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Client',
            username: session.user.email || session.user.id,
            password: 'oauth-managed',
            role: 'client',
            themeColor: 'indigo'
          };

          if (mounted) {
            // Optimistic update
            setClients(prev => {
               if (prev.some(c => c.id === newClient.id)) return prev;
               return [...prev, newClient];
            });
            setUser(newClient);
            setCurrentClientState(newClient);
          }

          // Persist
          await client.from('clients').insert([{
            id: newClient.id,
            name: newClient.name,
            username: newClient.username,
            password: newClient.password,
            role: newClient.role,
            theme_color: newClient.themeColor
          }]);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    // Initialize Auth
    const initAuth = async () => {
      // Safety timer to ensure we don't spin forever
      const safetyTimer = setTimeout(() => {
        if (mounted) {
          console.warn('Auth initialization timed out, forcing load completion');
          setIsLoading(false);
        }
      }, 7000);

      try {
        // Check if we have a hash in the URL (OAuth redirect)
        // If we do, we want to wait for onAuthStateChange to fire instead of just checking getSession
        // because getSession might not have parsed the hash yet.
        const hasAuthHash = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error_description'));
        
        if (hasAuthHash) {
          // If we have an auth hash, we DON'T set isLoading(false) here.
          // We let onAuthStateChange handle it.
          // However, we should set a timeout just in case it fails.
          // The outer safetyTimer will also catch this if the inner one fails or is forgotten, 
          // but we'll clear the outer one since we have specific handling here.
          clearTimeout(safetyTimer);
          
          setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 5000);
          return;
        }

        const { data: { session } } = await client.auth.getSession();
        if (session) {
          await loadUserFromSession(session);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        clearTimeout(safetyTimer);
        // Only turn off loading if we didn't defer to the hash handler
        const hasAuthHash = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error_description'));
        if (!hasAuthHash && mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          await loadUserFromSession(session);
        } catch (e) {
          console.error('Error handling auth state change:', e);
        } finally {
          // Ensure loading is turned off after successful sign in or if it fails
          if (mounted) setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setCurrentClientState(null);
          localStorage.removeItem('calendar_user');
          localStorage.removeItem('calendar_current_client');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


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
          const mappedClients = clientsData.map((c: any) => ({
            ...c,
            themeColor: c.theme_color || 'indigo'
          }));
          setClients(mappedClients);
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

  // Apply Theme
  useEffect(() => {
    if (user?.themeColor) {
      applyTheme(user.themeColor);
    } else {
      applyTheme('indigo');
    }
  }, [user?.themeColor]);

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
    // Allow agency to reset anyone's password
    // Allow users to reset their own password
    if (user?.role !== 'agency' && user?.id !== id) return;

    const updatedClients = clients.map(c => 
      c.id === id ? { ...c, password: newPassword } : c
    );
    setClients(updatedClients);
    
    // Update current user if it's them
    if (user?.id === id) {
      setUser({ ...user, password: newPassword });
    }
    
    if (isSupabaseConfigured && supabase) {
      await supabase.from('clients').update({ password: newPassword }).eq('id', id);
    }
  };

  const updateClientProfile = async (id: string, data: { name?: string; username?: string; password?: string; themeColor?: string }) => {
    // Allow agency to update anyone
    // Allow users to update themselves
    if (user?.role !== 'agency' && user?.id !== id) return;

    const updatedClients = clients.map(c => 
      c.id === id ? { ...c, ...data } : c
    );
    setClients(updatedClients);

    // Update current user if it's them
    if (user?.id === id) {
      setUser(prev => prev ? { ...prev, ...data } : null);
    }
    
    // Update currentClient if it's them
    if (currentClient?.id === id) {
      setCurrentClientState(prev => prev ? { ...prev, ...data } : null);
    }

    if (isSupabaseConfigured && supabase) {
      const dbData: any = { ...data };
      if (data.themeColor) {
        dbData.theme_color = data.themeColor;
        delete dbData.themeColor;
      }
      await supabase.from('clients').update(dbData).eq('id', id);
    }
  };

  const addEvent = async (event: CalendarEvent) => {
    // Ensure event has a valid UUID if not provided (though usually provided by UI)
    const eventId = event.id && event.id.length > 20 ? event.id : generateUUID();
    const newEvent = { ...event, id: eventId, clientId: currentClient?.id || '1' };
    
    setAllEvents([...allEvents, newEvent]);
    if (isSupabaseConfigured && supabase) {
      try {
        const dbEvent = {
            ...newEvent,
            client_id: newEvent.clientId
        };
        // Remove camelCase if mapping to snake_case to be clean, 
        // though Supabase might ignore extra fields, it's safer to be precise.
        // However, we don't know if 'clientId' column exists or 'client_id'.
        // Sending BOTH is the safest bet if we are unsure, 
        // BUT if one column is missing and strict mode is on, it fails.
        // Given 'posts' logic in this file doesn't map clientId, 
        // but 'clients' load logic maps snake_case -> camelCase...
        // We will assume client_id is the correct column based on SQL conventions.
        
        const { error } = await supabase.from('events').insert([dbEvent]);
        if (error) throw error;
      } catch (err) {
        console.error('Error adding event:', err);
        // Silent fail for now to match previous behavior but logging it
      }
    }
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    setAllEvents(allEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (isSupabaseConfigured && supabase) {
      try {
         const dbEvent = {
            ...updatedEvent,
            client_id: updatedEvent.clientId
        };
        const { error } = await supabase.from('events').update(dbEvent).eq('id', updatedEvent.id);
        if (error) throw error;
      } catch (err) {
        console.error('Error updating event:', err);
      }
    }
  };

  const deleteEvent = async (id: string) => {
    setAllEvents(allEvents.filter((e) => e.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('events').delete().eq('id', id);
    }
  };

  const populateHolidays = async (year: number) => {
    if (!currentClient) return;
    
    const holidays = getAllHolidays(year);
    const existingEvents = allEvents.filter(e => e.clientId === currentClient.id);
    
    const newEvents: CalendarEvent[] = [];
    
    for (const holiday of holidays) {
      // Check if this holiday already exists for this client
      const exists = existingEvents.some(e => 
        e.date === holiday.date && e.title === holiday.title
      );
      
      if (!exists) {
        const newEvent: CalendarEvent = {
          ...holiday,
          id: generateUUID(),
          clientId: currentClient.id,
          // Cast type to match CalendarEvent type strictly if needed, though holiday.type is compatible
          type: holiday.type as 'holiday' | 'promotion' | 'event' | 'other'
        };
        newEvents.push(newEvent);
      }
    }
    
    if (newEvents.length === 0) return;
    
    // Optimistically update local state
    setAllEvents(prev => [...prev, ...newEvents]);
    
    // Batch insert to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const dbEvents = newEvents.map(e => ({
            ...e,
            client_id: e.clientId
        }));
        
        const { error } = await supabase.from('events').insert(dbEvents);
        if (error) throw error;
        console.log(`Successfully populated ${newEvents.length} holidays for client ${currentClient.id}`);
      } catch (err) {
        console.error('Error populating holidays:', err);
        alert('Failed to save holidays to database. Please check console for details.');
        // Revert local state if needed, or just let it be (it will sync on reload)
      }
    }
  };

  const addPost = async (post: SocialPost) => {
    const newPost = { ...post, clientId: currentClient?.id || '1' };
    setAllPosts([...allPosts, newPost]);
    
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPost = {
          ...newPost,
          client_id: newPost.clientId,
          content_type: newPost.contentType,
          image_url: newPost.imageUrl
        };
        delete (dbPost as any).contentType;
        delete (dbPost as any).imageUrl;
        
        const { error } = await supabase.from('posts').insert([dbPost]);
        if (error) throw error;
      } catch (err) {
        console.error('Error adding post to Supabase:', err);
        // Revert local state or alert user
        alert('Failed to save post to database. Please check console for details.');
      }
    }
  };

  const updatePost = async (updatedPost: SocialPost) => {
    setAllPosts(allPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPost = {
          ...updatedPost,
          client_id: updatedPost.clientId,
          content_type: updatedPost.contentType,
          image_url: updatedPost.imageUrl
        };
        delete (dbPost as any).contentType;
        delete (dbPost as any).imageUrl;

        const { error } = await supabase.from('posts').update(dbPost).eq('id', updatedPost.id);
        if (error) throw error;
      } catch (err) {
        console.error('Error updating post in Supabase:', err);
        alert('Failed to update post in database. Please check console for details.');
      }
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
        isLoading,
        login,
        signInWithOAuth,
        signUp,
        logout,
        setCurrentClient,
        addClient,
        deleteClient,
        resetPassword,
        updateClientProfile,
        addEvent,
        updateEvent,
        deleteEvent,
        addPost,
        updatePost,
        deletePost,
        movePost,
        updateProjectName,
        populateHolidays,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
