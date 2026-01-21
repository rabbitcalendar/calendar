import React from 'react';

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="border-r border-b border-gray-100 p-2 min-h-[120px]">
            <div className="flex justify-end mb-2">
              <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            </div>
            {/* Random "post" skeletons */}
            {Math.random() > 0.7 && (
              <div className="h-16 bg-gray-100 rounded-lg w-full mb-2"></div>
            )}
            {Math.random() > 0.8 && (
              <div className="h-16 bg-gray-100 rounded-lg w-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
