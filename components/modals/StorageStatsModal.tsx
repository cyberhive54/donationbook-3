'use client';

import { X, HardDrive } from 'lucide-react';
import { formatFileSize, calculateStorageStats } from '@/lib/utils';
import { MediaItem, Album } from '@/types';

interface StorageStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMediaItems: MediaItem[];
  albums: Album[];
}

export default function StorageStatsModal({ isOpen, onClose, allMediaItems, albums }: StorageStatsModalProps) {
  if (!isOpen) return null;

  const stats = calculateStorageStats(allMediaItems);
  
  const albumStats = albums.map(album => {
    const albumMedia = allMediaItems.filter(item => item.album_id === album.id);
    const albumBytes = albumMedia.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
    const byType = albumMedia.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      album,
      totalBytes: albumBytes,
      mediaCount: albumMedia.length,
      byType
    };
  }).filter(a => a.mediaCount > 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Storage</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Used Storage</div>
                  <div className="text-2xl font-bold text-blue-600">{formatFileSize(stats.totalBytes)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Available</div>
                  <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.availableBytes)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Capacity</div>
                  <div className="text-xl font-semibold text-gray-800">{formatFileSize(stats.maxBytes)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Usage</div>
                  <div className="text-xl font-semibold text-gray-800">{stats.percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    stats.percentage > 90 ? 'bg-red-500' : 
                    stats.percentage > 75 ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Media By Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats.byType).map(([type, data]) => (
                  <div key={type} className="bg-white rounded-lg p-4 border">
                    <div className="text-xs text-gray-500 uppercase">{type}</div>
                    <div className="text-lg font-bold text-gray-800">{data.count}</div>
                    <div className="text-sm text-gray-600">{formatFileSize(data.bytes)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Storage By Album</h3>
              <div className="space-y-3">
                {albumStats.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No albums with media</div>
                ) : (
                  albumStats.map(({ album, totalBytes, mediaCount, byType }) => (
                    <div key={album.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">{album.title}</div>
                          <div className="text-xs text-gray-500">{album.year || 'N/A'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">{formatFileSize(totalBytes)}</div>
                          <div className="text-xs text-gray-500">{mediaCount} files</div>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-600">
                        {Object.entries(byType).map(([type, count]) => (
                          <span key={type} className="bg-gray-100 px-2 py-1 rounded">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
