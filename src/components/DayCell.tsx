import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import type { CalendarEvent, SocialPost } from '../types';

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  posts: SocialPost[];
  isCurrentMonth: boolean;
  onAddPost: (date: Date) => void;
  onEditPost: (post: SocialPost) => void;
  onEditEvent: (event: CalendarEvent) => void;
  variant?: 'month' | 'week';
}

export const DayCell = ({ 
  date, 
  events, 
  posts, 
  isCurrentMonth, 
  onAddPost, 
  onEditPost,
  onEditEvent,
  variant = 'month'
}: DayCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
    data: { date }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        p-2 border border-gray-100 flex flex-col gap-2 transition-colors group
        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'} 
        ${isOver ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-200' : ''}
        ${variant === 'week' ? 'min-h-[300px]' : 'min-h-[120px]'}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${isSameDay(date, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
            {format(date, 'd')}
          </span>
          {variant === 'week' && (
            <span className="text-xs text-gray-400 mt-1">{format(date, 'EEEE')}</span>
          )}
        </div>
        <button 
          onClick={() => onAddPost(date)}
          className="opacity-0 group-hover:opacity-100 hover:bg-gray-100 p-1 rounded transition-opacity cursor-pointer"
        >
          <Plus className="w-3 h-3 text-gray-400" />
        </button>
      </div>
      
      {/* Events */}
      <div className="space-y-1">
        {events.map(event => (
          <div 
            key={event.id} 
            className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-100 truncate font-medium cursor-pointer hover:bg-yellow-100 transition-colors" 
            title={event.title}
            onClick={(e) => {
              e.stopPropagation();
              onEditEvent(event);
            }}
          >
            {event.title}
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-1 flex-1">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onClick={() => onEditPost(post)} />
        ))}
      </div>
    </div>
  );
};
