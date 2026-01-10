'use client';

import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types';
import { formatFileSize } from '@/lib/utils';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem | null;
  allItems?: MediaItem[];
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export default function MediaViewerModal({ isOpen, onClose, mediaItem, allItems = [], onNavigate }: MediaViewerModalProps) {
  if (!isOpen || !mediaItem) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaItem.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaItem.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const currentIndex = allItems.findIndex(item => item.id === mediaItem.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allItems.length - 1;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <button 
        onClick={handleDownload}
        className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <Download className="w-6 h-6 text-white" />
      </button>

      {onNavigate && hasPrev && (
        <button 
          onClick={() => onNavigate('prev')}
          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {onNavigate && hasNext && (
        <button 
          onClick={() => onNavigate('next')}
          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      <div className="w-full h-full flex items-center justify-center p-4">
        {mediaItem.type === 'image' && (
          <img 
            src={mediaItem.url} 
            alt={mediaItem.title || ''} 
            className="max-w-full max-h-full object-contain"
          />
        )}
        
        {mediaItem.type === 'video' && (
          <video 
            src={mediaItem.url} 
            controls 
            autoPlay
            className="max-w-full max-h-full"
          />
        )}
        
        {mediaItem.type === 'audio' && (
          <div className="bg-white/10 rounded-lg p-8 backdrop-blur">
            <audio src={mediaItem.url} controls autoPlay className="w-full" />
            <div className="text-white text-center mt-4">
              <div className="text-lg font-semibold">{mediaItem.title}</div>
              {mediaItem.size_bytes && (
                <div className="text-sm opacity-75 mt-1">{formatFileSize(mediaItem.size_bytes)}</div>
              )}
            </div>
          </div>
        )}
        
        {mediaItem.type === 'pdf' && (
          <iframe 
            src={mediaItem.url}
            className="w-full h-full bg-white rounded"
            title={mediaItem.title || 'PDF'}
          />
        )}
        
        {mediaItem.type === 'other' && (
          <div className="bg-white/10 rounded-lg p-8 backdrop-blur text-white text-center">
            <div className="text-lg font-semibold mb-4">{mediaItem.title}</div>
            <button 
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Download className="w-5 h-5" />
              Download File
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur rounded-lg px-4 py-2 text-white text-sm">
        <div className="font-medium">{mediaItem.title}</div>
        {mediaItem.size_bytes && (
          <div className="text-xs opacity-75">{formatFileSize(mediaItem.size_bytes)}</div>
        )}
      </div>
    </div>
  );
}
