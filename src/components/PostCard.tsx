import { useDraggable } from '@dnd-kit/core';
import type { SocialPost } from '../types';
import { Instagram, Facebook, MapPin, FileText, Film, Image as ImageIcon, Layers, Video, BookOpen, Sparkles } from 'lucide-react';

export const PostCard = ({ post, onClick, isOverlay }: { post: SocialPost, onClick?: () => void, isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: post.id,
    data: post,
    disabled: isOverlay
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  // ... icons ...

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'instagram': return <Instagram className="w-3 h-3 text-pink-600" />;
      case 'facebook': return <Facebook className="w-3 h-3 text-blue-600" />;
      case 'tiktok': return <Video className="w-3 h-3 text-black" />;
      case 'xiaohongshu': return <BookOpen className="w-3 h-3 text-red-500" />;
      case 'lemon8': return <Sparkles className="w-3 h-3 text-yellow-500" />;
      case 'google_maps': return <MapPin className="w-3 h-3 text-green-600" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Film className="w-3 h-3" />;
      case 'image': return <ImageIcon className="w-3 h-3" />;
      case 'carousel': return <Layers className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'border-l-4 border-l-green-500';
      case 'scheduled': return 'border-l-4 border-l-blue-500';
      case 'published': return 'border-l-4 border-l-gray-500';
      default: return 'border-l-4 border-l-yellow-500'; // draft
    }
  };

  const coverImage = post.images?.[0] || post.imageUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        bg-white p-2 rounded shadow-sm border border-gray-200 text-xs 
        ${isOverlay ? 'cursor-grabbing shadow-xl ring-2 ring-indigo-500 pointer-events-none' : 'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow'} 
        group relative ${getStatusColor(post.status)}
      `}
    >
      {coverImage && (
        <div className="mb-2 -mx-2 -mt-2 rounded-t overflow-hidden aspect-video relative bg-gray-100">
           <img src={coverImage} alt="" className="w-full h-full object-cover" />
           {post.images && post.images.length > 1 && (
             <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded flex items-center gap-0.5">
               <Layers className="w-3 h-3" />
               {post.images.length}
             </div>
           )}
        </div>
      )}
      <div className="flex justify-between items-start gap-1 mb-1">
        <div className="font-semibold text-gray-700 truncate flex-1">{post.title}</div>
        <div className="text-gray-400">{getPlatformIcon(post.platform)}</div>
      </div>
      <div className="flex items-center gap-1 text-gray-500">
        {getTypeIcon(post.contentType)}
        <span className="truncate">{post.contentType}</span>
      </div>
    </div>
  );
};
