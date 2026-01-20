import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  useDroppable,
  rectIntersection,
  MeasuringStrategy
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, CollisionDetection } from '@dnd-kit/core';
import { useCalendar } from '../context/CalendarContext';
import { PostCard } from '../components/PostCard';
import { DayCell } from '../components/DayCell';
import { ListView } from '../components/ListView';
import type { SocialPost, CalendarEvent } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  addMonths, 
  addWeeks, 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  LayoutGrid, 
  Columns, 
  List, 
  LayoutList, 
  Trash2, 
  Eye, 
  Maximize2,
  GripVertical,
  Calendar as CalendarIcon,
  Filter,
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { compressImage } from '../utils/compressImage';

type CalendarView = 'month' | 'week' | 'list';

interface UnscheduledSidebarProps {
  activeId: string | null;
  unscheduledPosts: SocialPost[];
  isUnscheduledOpen: boolean;
  setIsUnscheduledOpen: (open: boolean) => void;
  onAddPost: () => void;
  onEditPost: (post: SocialPost) => void;
}

const UnscheduledSidebar = ({
  activeId,
  unscheduledPosts,
  isUnscheduledOpen,
  setIsUnscheduledOpen,
  onAddPost,
  onEditPost
}: UnscheduledSidebarProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unscheduled',
  });

  // Auto-expand sidebar when dragging over
  useEffect(() => {
    if (isOver && !isUnscheduledOpen) {
      setIsUnscheduledOpen(true);
    }
  }, [isOver, isUnscheduledOpen, setIsUnscheduledOpen]);

  return (
    <div 
      ref={setNodeRef}
      id="unscheduled-sidebar"
      className={`
        flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-none relative
        ${isOver ? 'bg-indigo-50 border-indigo-200' : ''}
        ${activeId ? 'z-50' : ''}
        ${isUnscheduledOpen ? 'h-64 md:h-full md:w-64' : 'h-14 md:h-full md:w-12'}
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl h-14">
        {isUnscheduledOpen ? (
          <>
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-indigo-600" />
              Unscheduled
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddPost()}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-indigo-600 transition-colors"
                title="Add Post"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsUnscheduledOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={() => setIsUnscheduledOpen(true)}
            className="w-full h-full flex items-center justify-center md:justify-center text-gray-400 hover:text-indigo-600 transition-colors gap-2"
            title="Open Unscheduled"
          >
            <LayoutList className="w-6 h-6" />
            <span className="font-semibold md:hidden text-gray-700">Unscheduled</span>
          </button>
        )}
      </div>

      {/* Collapsible Content */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${!isUnscheduledOpen && 'hidden'} relative`}>
        {activeId && (
          <div className={`absolute inset-0 z-20 border-2 border-dashed rounded-lg pointer-events-none flex items-center justify-center transition-colors ${
            isOver 
              ? 'bg-indigo-100/80 border-indigo-500' 
              : 'bg-indigo-50/50 border-indigo-300'
          }`}>
            <span className={`text-indigo-500 font-medium transition-transform ${isOver ? 'font-bold scale-105' : ''}`}>
              Drop Here to Unschedule
            </span>
          </div>
        )}
        {/* Desktop Close Button */}
        <button 
          onClick={() => setIsUnscheduledOpen(false)} 
          className="hidden md:flex w-full items-center justify-center p-1 mb-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs ml-1">Collapse</span>
        </button>

        {unscheduledPosts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No unscheduled posts.
            <br />Drag items here to unschedule.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {unscheduledPosts.map(post => (
              <PostCard key={post.id} post={post} onClick={() => onEditPost(post)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AgencyPlanner = () => {
  const { events, posts, movePost, addPost, updatePost, deletePost, addEvent, updateEvent, deleteEvent } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<SocialPost>>({});
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent>>({});
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Force expand sidebar when dragging
  useEffect(() => {
    if (activeId && !isUnscheduledOpen) {
      setIsUnscheduledOpen(true);
    }
  }, [activeId]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || !editingPost.images) return;
      
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : (editingPost.images?.length || 1) - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev !== null && prev < (editingPost.images?.length || 1) - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };

    if (lightboxIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, editingPost.images]);

  // Auto-collapse unscheduled sidebar on mobile - REMOVED to keep it open by default
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth < 768) {
  //       setIsUnscheduledOpen(false);
  //     } else {
  //       setIsUnscheduledOpen(true);
  //     }
  //   };
    
  //   // Initial check
  //   handleResize();

  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Date Calculations
  const getCalendarRange = () => {
    if (view === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return { start, end };
    }
    // Month and List view use month range
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return { start, end };
  };

  const { start, end } = getCalendarRange();
  const calendarDays = eachDayOfInterval({ start, end });

  // Navigation
  const navigate = (direction: 'prev' | 'next') => {
    const modifier = direction === 'prev' ? -1 : 1;
    if (view === 'week') {
      setCurrentDate(prev => addWeeks(prev, modifier));
    } else {
      setCurrentDate(prev => addMonths(prev, modifier));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // If dropping on "unscheduled" sidebar, set date to null
      // If dropping on a day cell, set date to the cell's ID (yyyy-MM-dd)
      const newDate = over.id === 'unscheduled' ? null : (over.id as string);
      movePost(active.id as string, newDate);
    }
    
    setActiveId(null);
  };

  const handleAddPost = (date?: Date) => {
    setEditingPost({
      status: 'draft',
      platform: 'instagram',
      contentType: 'image',
      date: date ? format(date, 'yyyy-MM-dd') : null,
      title: '',
      brief: '',
      images: []
    });
    setIsModalOpen(true);
  };

  const handleEditPost = (post: SocialPost) => {
    setEditingPost({
      ...post,
      images: post.images || (post.imageUrl ? [post.imageUrl] : [])
    });
    setIsModalOpen(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost.title || !editingPost.platform) return;

    if (editingPost.id) {
      updatePost(editingPost as SocialPost);
    } else {
      addPost({
        ...editingPost,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      } as SocialPost);
    }
    setIsModalOpen(false);
  };

  const handleDeletePost = () => {
    if (editingPost.id) {
      deletePost(editingPost.id);
      setIsModalOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (!isSupabaseConfigured || !supabase) {
      alert("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      return;
    }

    const file = e.target.files[0];

    setIsUploading(true);

    try {
      // 1. Compress the image before uploading
      // Resize to max 1200px width, 0.8 quality (WebP)
      const compressedFile = await compressImage(file, 1200, 0.8);

      // 2. Upload compressed file to 'uploads' bucket
      // User must create a bucket named 'uploads' in Supabase dashboard
      // Use the new compressed file name (which has .webp extension)
      const filePath = `${Date.now()}_${Math.random().toString(36).substring(2)}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
      
      setEditingPost(prev => ({
        ...prev,
        images: [...(prev.images || []), data.publicUrl],
        imageUrl: data.publicUrl // Keep for compatibility
      }));
    } catch (error: any) {
      console.error('Error uploading image:', error.message);
      if (error.message.includes('row-level security')) {
        alert(`Supabase Security Block: You must add a "Policy" in your Supabase Dashboard.\n\n1. Go to Storage > Policies.\n2. Under 'uploads', click 'New Policy'.\n3. Choose 'For full customization'.\n4. Name it 'Allow Public Uploads'.\n5. Check 'INSERT' and 'SELECT'.\n6. Select 'anon' role (since you are not using Supabase Auth).`);
      } else {
        alert(`Error uploading image: ${error.message}. Make sure you have created a public storage bucket named 'uploads' in your Supabase project.`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteImage = async (index: number) => {
    const imageToDelete = editingPost.images?.[index];
    if (!imageToDelete) return;

    // Optimistically remove from UI
    const newImages = [...(editingPost.images || [])];
    newImages.splice(index, 1);
    
    setEditingPost(prev => ({
      ...prev,
      images: newImages,
      imageUrl: newImages.length > 0 ? newImages[newImages.length - 1] : undefined
    }));

    // Attempt to delete from Supabase
    try {
        if (isSupabaseConfigured && supabase) {
            const pathParts = imageToDelete.split('/uploads/');
            if (pathParts.length > 1) {
                const filePath = pathParts[1];
                await supabase.storage.from('uploads').remove([filePath]);
            }
        }
    } catch (err) {
        console.error("Error deleting file from storage:", err);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent.title || !editingEvent.date || !editingEvent.type) return;

    if (editingEvent.id) {
      updateEvent(editingEvent as CalendarEvent);
    } else {
      addEvent({
        ...editingEvent,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      } as CalendarEvent);
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = () => {
    if (editingEvent.id) {
      deleteEvent(editingEvent.id);
      setIsEventModalOpen(false);
    }
  };

  const activePost = activeId ? posts.find(p => p.id === activeId) : null;
  const unscheduledPosts = posts.filter(p => !p.date);

  // Custom collision detection to prioritize sidebar
  const customCollisionDetection: CollisionDetection = (args) => {
    const { pointerCoordinates, droppableContainers } = args;
    
    // 1. Geometric Check: Is pointer inside the sidebar's bounding box?
    if (pointerCoordinates) {
      // Try to find the sidebar element by ID (most reliable)
      const sidebarEl = document.getElementById('unscheduled-sidebar');
      
      if (sidebarEl) {
        const rect = sidebarEl.getBoundingClientRect();
        const { x, y } = pointerCoordinates;
        
        // Add a generous buffer (margin) to make it easier to hit
        const buffer = 50; // Increased buffer
        if (
          x >= rect.left - buffer && 
          x <= rect.right + buffer && 
          y >= rect.top - buffer && 
          y <= rect.bottom + buffer
        ) {
          const container = droppableContainers.find(c => c.id === 'unscheduled');
          if (container) {
            return [container];
          }
        }
      }
    }

    // 2. Fallback to standard rectIntersection for other items
    return rectIntersection(args);
  };

  return (
    <>
      <DndContext 
        sensors={sensors} 
        collisionDetection={customCollisionDetection}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-theme(spacing.24))] gap-4 md:gap-6">
          {/* Sidebar for Unscheduled */}
          <UnscheduledSidebar 
            activeId={activeId}
            unscheduledPosts={unscheduledPosts}
            isUnscheduledOpen={isUnscheduledOpen}
            setIsUnscheduledOpen={setIsUnscheduledOpen}
            onAddPost={handleAddPost}
            onEditPost={handleEditPost}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 min-w-0 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Mobile: Row 1 - Title + Nav Controls */}
            {/* Desktop: Title + View Toggles + Nav Controls */}
            
            <div className="w-full flex flex-row items-center justify-between sm:w-auto sm:justify-start gap-4">
              <h2 className="text-xl font-bold text-gray-900 text-left">
                {view === 'week' 
                  ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
                  : format(currentDate, 'MMMM yyyy')
                }
              </h2>

              {/* Mobile Only Nav Controls (Moved up) */}
              <div className="flex items-center gap-2 sm:hidden">
                <button 
                  onClick={() => {
                    const sgDateString = new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"});
                    setCurrentDate(new Date(sgDateString));
                  }}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
                >
                  Today
                </button>
                <div className="h-5 w-px bg-gray-200 mx-0.5"></div>
                <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => navigate('next')} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="w-full flex items-center justify-center sm:w-auto">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setView('month')}
                  className={`flex-1 sm:flex-none p-2 rounded-md transition-all flex justify-center ${view === 'month' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Month View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`flex-1 sm:flex-none p-2 rounded-md transition-all flex justify-center ${view === 'week' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Week View"
                >
                  <Columns className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`flex-1 sm:flex-none p-2 rounded-md transition-all flex justify-center ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Desktop Only Nav Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={() => {
                  const sgDateString = new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"});
                  setCurrentDate(new Date(sgDateString));
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
              >
                Today
              </button>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <button onClick={() => navigate('prev')} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => navigate('next')} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* View Content */}
          {view === 'list' ? (
            <ListView 
              days={eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })}
              events={events}
              posts={posts}
              onAddPost={handleAddPost}
              onEditPost={handleEditPost}
              onEditEvent={handleEditEvent}
            />
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="min-w-[800px] md:min-w-0 h-full flex flex-col">
                {/* Grid Header */}
                <div className={`grid border-b border-gray-200 ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className={`flex-1 grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7 auto-rows-fr'}`}>
                  {calendarDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = events.filter(e => e.date === dateKey);
                    const dayPosts = posts.filter(p => p.date && p.date.startsWith(dateKey));
                    
                    return (
                      <DayCell 
                        key={day.toISOString()}
                        date={day}
                        events={dayEvents}
                        posts={dayPosts}
                        isCurrentMonth={isSameMonth(day, currentDate)}
                        onAddPost={handleAddPost}
                        onEditPost={handleEditPost}
                        onEditEvent={handleEditEvent}
                        variant={view === 'week' ? 'week' : 'month'}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay - Portalled to body to avoid stacking context issues */}
      {createPortal(
        <DragOverlay dropAnimation={null} style={{ pointerEvents: 'none', zIndex: 9999 }}>
          {activePost ? <PostCard post={activePost} isOverlay /> : null}
        </DragOverlay>,
        document.body
      )}
      </DndContext>

      {/* Modal - Outside DndContext */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingPost.id ? 'Edit Post' : 'New Post'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editingPost.title || ''}
                  onChange={e => setEditingPost({...editingPost, title: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editingPost.platform || 'instagram'}
                    onChange={e => setEditingPost({...editingPost, platform: e.target.value as any})}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="xiaohongshu">Xiaohongshu</option>
                    <option value="facebook">Facebook</option>
                    <option value="lemon8">Lemon8</option>
                    <option value="google_maps">Google Maps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editingPost.contentType || 'image'}
                    onChange={e => setEditingPost({...editingPost, contentType: e.target.value as any})}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="carousel">Carousel</option>
                    <option value="text">Text</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editingPost.status || 'draft'}
                  onChange={e => setEditingPost({...editingPost, status: e.target.value as any})}
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {/* Upload Option */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Upload File</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                    />
                    {isUploading && <p className="text-xs text-indigo-600 mt-1 animate-pulse">Uploading to Supabase...</p>}
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">OR PASTE URL</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {/* URL Option */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Add Image URL</label>
                    <p className="text-[10px] text-gray-400 mb-2">
                      Paste direct image links (ending in .jpg, .png). Webpage links (like Pinterest) will not work.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
                        placeholder="https://example.com/image.jpg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const url = e.currentTarget.value;
                            if (url) {
                              setEditingPost(prev => ({
                                ...prev,
                                images: [...(prev.images || []), url],
                                imageUrl: url
                              }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                          type="button"
                          className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const url = input.value;
                          if (url) {
                            setEditingPost(prev => ({
                              ...prev,
                              images: [...(prev.images || []), url],
                              imageUrl: url
                            }));
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Image Grid */}
                  {editingPost.images && editingPost.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {editingPost.images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                          <img 
                            src={img} 
                            alt={`Image ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <div className="image-fallback hidden absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                            <AlertCircle className="w-6 h-6 mb-1" />
                            <span className="text-[10px] px-2 text-center">Invalid Image</span>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100">
                            {/* Center View Button */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <button 
                                  type="button"
                                  onClick={() => setLightboxIndex(idx)}
                                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-all shadow-sm transform scale-90 group-hover:scale-100 pointer-events-auto cursor-pointer"
                                  title="View Full"
                                >
                                  <Maximize2 className="w-5 h-5 text-gray-700" />
                                </button>
                            </div>

                            {/* Bottom Right Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if(window.confirm('Are you sure you want to delete this image?')) {
                                    handleDeleteImage(idx); 
                                }
                              }}
                              className="absolute bottom-2 right-2 p-1.5 bg-red-500/90 rounded-full hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brief / Details</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-lg h-24"
                  value={editingPost.brief || ''}
                  onChange={e => setEditingPost({...editingPost, brief: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-between pt-2">
                {editingPost.id && (
                  <button 
                    type="button" 
                    onClick={handleDeletePost}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                )}
                <div className={editingPost.id ? '' : 'ml-auto'}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mr-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer">Save Post</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingEvent.id ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingEvent.title || ''}
                  onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editingEvent.date || ''}
                    onChange={e => setEditingEvent({...editingEvent, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editingEvent.type || 'event'}
                    onChange={e => setEditingEvent({...editingEvent, type: e.target.value as any})}
                  >
                    <option value="event">Event</option>
                    <option value="promotion">Promotion</option>
                    <option value="holiday">Holiday</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24"
                  value={editingEvent.description || ''}
                  onChange={e => setEditingEvent({...editingEvent, description: e.target.value})}
                />
              </div>
              
              <div className="flex justify-between pt-2">
                {editingEvent.id && (
                  <button 
                    type="button" 
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                )}
                <div className={editingEvent.id ? '' : 'ml-auto'}>
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="mr-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer">Save Event</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lightbox */}
      {lightboxIndex !== null && editingPost.images && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 transition-colors" onClick={() => setLightboxIndex(null)}>
            <X className="w-8 h-8" />
          </button>
          
          <img 
            src={editingPost.images[lightboxIndex]} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
            alt="Full view"
          />

          {/* Navigation */}
          {editingPost.images.length > 1 && (
              <>
                  <button 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all backdrop-blur-sm"
                      onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : (editingPost.images?.length || 1) - 1));
                      }}
                  >
                      <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all backdrop-blur-sm"
                      onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(prev => (prev !== null && prev < (editingPost.images?.length || 1) - 1 ? prev + 1 : 0));
                      }}
                  >
                      <ChevronRight className="w-8 h-8" />
                  </button>
              </>
          )}
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            {lightboxIndex + 1} / {editingPost.images.length}
          </div>
        </div>
      )}
    </>
  );
};