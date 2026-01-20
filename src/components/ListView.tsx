import { format, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { useDroppable } from '@dnd-kit/core';
import type { CalendarEvent, SocialPost } from '../types';

interface ListDayRowProps {
  day: Date;
  events: CalendarEvent[];
  posts: SocialPost[];
  onAddPost: (date: Date) => void;
  onEditPost: (post: SocialPost) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const ListDayRow = ({ day, events, posts, onAddPost, onEditPost, onEditEvent }: ListDayRowProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
    data: { date: day }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex gap-4 p-4 rounded-lg border shadow-sm transition-colors ${
        isOver 
          ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-200 ring-inset' 
          : 'bg-white border-gray-100'
      }`}
    >
      {/* Date Column */}
      <div className="w-24 flex-shrink-0 flex flex-col items-center justify-start pt-1">
        <span className="text-sm font-semibold text-gray-500 uppercase">{format(day, 'EEE')}</span>
        <span className={`text-2xl font-bold ${isSameDay(day, new Date()) ? 'text-primary-600' : 'text-gray-900'}`}>
          {format(day, 'd')}
        </span>
      </div>

      {/* Content Column */}
      <div className="flex-1 space-y-3">
        {/* Events Section */}
        {events.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {events.map(event => (
              <div 
                key={event.id} 
                className="px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => onEditEvent(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        )}

        {/* Posts Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onClick={() => onEditPost(post)} />
          ))}
          <button 
            onClick={() => onAddPost(day)}
            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all text-sm font-medium h-full min-h-[60px]"
          >
            <Plus className="w-4 h-4" />
            Add Post
          </button>
        </div>
      </div>
    </div>
  );
};

interface ListViewProps {
  days: Date[];
  events: CalendarEvent[];
  posts: SocialPost[];
  onAddPost: (date: Date) => void;
  onEditPost: (post: SocialPost) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export const ListView = ({ 
  days, 
  events, 
  posts, 
  onAddPost, 
  onEditPost,
  onEditEvent
}: ListViewProps) => {
  // Filter days to only show those with events or posts
  // OR show all days? The user said "better visibility". 
  // An agenda view usually skips empty days. 
  // But if I want to drag and drop to empty days, I can't if they aren't there.
  // So maybe I should show ALL days in the month?
  // Let's stick to showing only active days for now to keep it clean "Agenda style".
  // If user wants to schedule to a new day, they can use Month/Week view or "Add Post" button (which requires picking a date? No, button is on the day).
  // Wait, if I hide empty days, I can't click "Add Post" on an empty day.
  // This limits the List View.
  // Let's change it: Show ALL days in the list view? That's 30 items. It's a lot of scrolling.
  // Compromise: Show active days + maybe next 3 empty days? No that's weird.
  // Let's stick to active days. If they want to add to a new day, they can switch views or maybe I add a "Add to specific date" button at top.
  // Actually, the user asked for "better visibility".
  // Let's keep it as active days. If they drag a post to an active day, it works.
  
  const activeDays = days.filter(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => e.date === dateKey);
    const dayPosts = posts.filter(p => p.date && p.date.startsWith(dateKey));
    return dayEvents.length > 0 || dayPosts.length > 0;
  });

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>No events or posts scheduled for this period.</p>
        <p className="text-sm mt-2">Switch to Month or Week view to add items to empty days.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {activeDays.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.date === dateKey);
        const dayPosts = posts.filter(p => p.date && p.date.startsWith(dateKey));

        return (
          <ListDayRow 
            key={day.toISOString()}
            day={day}
            events={dayEvents}
            posts={dayPosts}
            onAddPost={onAddPost}
            onEditPost={onEditPost}
            onEditEvent={onEditEvent}
          />
        );
      })}
    </div>
  );
};
