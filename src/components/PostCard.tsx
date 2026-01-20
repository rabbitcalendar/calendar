import { useDraggable } from '@dnd-kit/core';
import type { SocialPost } from '../types';
import { FileText, Film, Image as ImageIcon, Layers, AlertCircle } from 'lucide-react';
import { SiInstagram, SiFacebook, SiTiktok, SiXiaohongshu, SiGooglemaps } from 'react-icons/si';
import { FaLemon } from 'react-icons/fa';

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
      case 'instagram': return <SiInstagram className="w-3 h-3 text-pink-600" />;
      case 'facebook': return <SiFacebook className="w-3 h-3 text-blue-600" />;
      case 'tiktok': return <SiTiktok className="w-3 h-3 text-black" />;
      case 'xiaohongshu': return <SiXiaohongshu className="w-3 h-3 text-red-500" />;
      case 'lemon8': return <FaLemon className="w-3 h-3 text-yellow-500" />;
      case 'google_maps': return <SiGooglemaps className="w-3 h-3 text-green-600" />;
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

  const getStatusRibbon = (status: string) => {
    const config = {
      approved: { bg: 'bg-green-500', text: 'APPROVED' },
      scheduled: { bg: 'bg-blue-500', text: 'SCHEDULED' },
      published: { bg: 'bg-gray-500', text: 'PUBLISHED' },
      draft: { bg: 'bg-yellow-500', text: 'DRAFT' },
    };
    const style = config[status as keyof typeof config] || config.draft;

    return (
      <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none">
        <div className={`
          absolute top-[12px] -right-[22px] transform rotate-45 
          w-[100px] text-center text-[9px] font-bold text-white tracking-wider py-1
          shadow-sm ${style.bg} z-10
        `}>
          {style.text}
        </div>
      </div>
    );
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
        bg-white p-2 rounded shadow-sm border border-gray-200 text-xs overflow-hidden
        ${isOverlay ? 'cursor-grabbing shadow-xl ring-2 ring-primary-500 pointer-events-none' : 'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow'} 
        group relative
      `}
    >
      {getStatusRibbon(post.status)}
      {coverImage && (
        <div className="mb-2 -mx-2 -mt-2 rounded-t overflow-hidden aspect-video relative bg-gray-100">
           <img 
             src={coverImage} 
             alt="" 
             className="w-full h-full object-cover" 
             onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement?.querySelector('.image-fallback')?.classList.remove('hidden');
             }}
           />
           <div className="image-fallback hidden absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
             <AlertCircle className="w-5 h-5" />
           </div>
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
