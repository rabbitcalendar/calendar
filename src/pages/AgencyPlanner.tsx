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
import { ChevronLeft, ChevronRight, Plus, X, LayoutGrid, Columns, List, LayoutList } from 'lucide-react';

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

  // Force expand sidebar when dragging
  useEffect(() => {
    if (activeId && !isUnscheduledOpen) {
      setIsUnscheduledOpen(true);
    }
  }, [activeId]);

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
      brief: ''
    });
    setIsModalOpen(true);
  };

  const handleEditPost = (post: SocialPost) => {
    setEditingPost(post);
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
    </>
  );
};