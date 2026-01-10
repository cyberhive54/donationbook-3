'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Upload, Trash2, FileText, Film, Music, FileIcon, Image as ImageIcon, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { MediaItem } from '@/types';
import { formatFileSize, getFileSizeLimit, generateThumbnailFromVideo } from '@/lib/utils';
import MediaViewerModal from './MediaViewerModal';
import { useSession } from '@/lib/hooks/useSession';

interface ManageAlbumMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string | null;
  festivalCode: string;
}

type FilterType = 'all' | 'image' | 'video' | 'audio' | 'pdf' | 'other';

interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export default function ManageAlbumMediaModal({ isOpen, onClose, albumId, festivalCode }: ManageAlbumMediaModalProps) {
  const { session } = useSession(festivalCode);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [festivalId, setFestivalId] = useState<string>('');

  const fetchItems = async () => {
    if (!albumId) return;
    const { data, error } = await supabase.from('media_items').select('*').eq('album_id', albumId).order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch media items error:', error);
    } else {
      setItems(data as MediaItem[]);
    }

    // Get festival_id from album
    if (albumId) {
      const { data: albumData } = await supabase.from('albums').select('festival_id').eq('id', albumId).single();
      if (albumData) {
        setFestivalId(albumData.festival_id);
      }
    }
  };

  useEffect(() => { 
    if (isOpen) {
      fetchItems();
      setSelectedItems(new Set());
    }
  }, [isOpen, albumId]);

  const detectType = (mime: string): FilterType => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'other';
  };

  const processUploadQueue = async () => {
    if (isUploading || !albumId) return;
    
    const pendingTasks = uploadQueue.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) return;
    
    setIsUploading(true);
    
    for (const task of pendingTasks) {
      setUploadQueue(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'uploading' as const } : t
      ));
      
      try {
        const file = task.file;
        const limit = getFileSizeLimit(file.type);
        
        if (file.size > limit.bytes) {
          throw new Error(`File too large. Max ${limit.label}`);
        }
        
        const path = `${festivalCode}/${albumId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('showcase').upload(path, file, { upsert: false });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        
        const { data: pub } = supabase.storage.from('showcase').getPublicUrl(path);
        const url = pub?.publicUrl || '';
        const type = detectType(file.type);
        
        let thumbnailUrl: string | null = null;
        if (type === 'video') {
          try {
            const thumbBlob = await generateThumbnailFromVideo(file);
            const thumbPath = `${festivalCode}/${albumId}/thumb-${Date.now()}.jpg`;
            const thumbFile = await fetch(thumbBlob).then(r => r.blob());
            await supabase.storage.from('showcase').upload(thumbPath, thumbFile);
            const { data: thumbPub } = supabase.storage.from('showcase').getPublicUrl(thumbPath);
            thumbnailUrl = thumbPub?.publicUrl || null;
          } catch (e) {
            console.warn('Thumbnail generation failed:', e);
          }
        }
        
        const { data: insertedMedia, error: insErr } = await supabase.from('media_items').insert({
          album_id: albumId,
          type,
          title: file.name,
          url,
          mime_type: file.type,
          size_bytes: file.size,
          thumbnail_url: thumbnailUrl,
        }).select('id').single();
        
        if (insErr) throw new Error(`Database insert failed: ${insErr.message}`);

        // Log activity for media upload
        if (festivalId && insertedMedia) {
          await supabase.rpc('log_admin_activity', {
            p_festival_id: festivalId,
            p_admin_id: session?.type === 'admin' ? session.adminId : null,
            p_action_type: 'add_media_item',
            p_action_details: {
              album_id: albumId,
              media_id: insertedMedia.id,
              media_type: type,
              file_name: file.name,
              file_size: file.size
            },
            p_target_type: 'media_item',
            p_target_id: insertedMedia.id
          });
        }
        
        setUploadQueue(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'completed' as const, progress: 100 } : t
        ));
      } catch (e: any) {
        console.error('Upload error:', e);
        setUploadQueue(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'failed' as const, error: e.message } : t
        ));
      }
    }
    
    setIsUploading(false);
    const failed = uploadQueue.filter(t => t.status === 'failed').length;
    const completed = uploadQueue.filter(t => t.status === 'completed').length;
    
    if (failed === 0) {
      toast.success(`${completed} file(s) uploaded successfully`);
      setTimeout(() => setUploadQueue([]), 2000);
    } else {
      toast.error(`${failed} file(s) failed to upload`);
    }
    
    fetchItems();
  };

  useEffect(() => {
    if (uploadQueue.some(t => t.status === 'pending') && !isUploading) {
      processUploadQueue();
    }
  }, [uploadQueue, isUploading]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!albumId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newTasks: UploadTask[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    
    setUploadQueue(prev => [...prev, ...newTasks]);
    (e.target as HTMLInputElement).value = '';
  };

  const filtered = useMemo(() => items.filter(i => filter === 'all' ? true : i.type === filter), [items, filter]);

  const handleDelete = async (id: string) => {
    // Get media item info before deleting for logging
    const mediaItem = items.find(i => i.id === id);
    
    const { error } = await supabase.from('media_items').delete().eq('id', id);
    if (!error) {
      // Log activity for media deletion
      if (festivalId && mediaItem) {
        await supabase.rpc('log_admin_activity', {
          p_festival_id: festivalId,
          p_admin_id: session?.type === 'admin' ? session.adminId : null,
          p_action_type: 'delete_media_item',
          p_action_details: {
            album_id: albumId,
            media_id: id,
            media_type: mediaItem.type,
            file_name: mediaItem.title
          },
          p_target_type: 'media_item',
          p_target_id: id
        });
      }

      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Deleted');
    } else {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDownload = async () => {
    const selectedMediaItems = items.filter(item => selectedItems.has(item.id));
    for (const item of selectedMediaItems) {
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Download failed for:', item.title, error);
      }
    }
    toast.success(`Downloaded ${selectedMediaItems.length} file(s)`);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} selected item(s)? This action cannot be undone.`)) {
      return;
    }
    
    const selectedIds = Array.from(selectedItems);
    const selectedMediaItems = items.filter(i => selectedIds.includes(i.id));
    let successCount = 0;
    let failCount = 0;
    
    for (const id of selectedIds) {
      const mediaItem = selectedMediaItems.find(i => i.id === id);
      const { error } = await supabase.from('media_items').delete().eq('id', id);
      if (!error) {
        // Log activity for each deleted media item
        if (festivalId && mediaItem) {
          await supabase.rpc('log_admin_activity', {
            p_festival_id: festivalId,
            p_admin_id: session?.type === 'admin' ? session.adminId : null,
            p_action_type: 'delete_media_item',
            p_action_details: {
              album_id: albumId,
              media_id: id,
              media_type: mediaItem.type,
              file_name: mediaItem.title,
              bulk_delete: true
            },
            p_target_type: 'media_item',
            p_target_id: id
          });
        }
        successCount++;
      } else {
        failCount++;
        console.error('Delete failed for:', id, error);
      }
    }
    
    if (successCount > 0) {
      setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
      setSelectedItems(new Set());
      toast.success(`Deleted ${successCount} item(s)`);
    }
    
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} item(s)`);
    }
    
    fetchItems();
  };

  const getMediaIcon = (type: FilterType) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Film className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'pdf': return <FileText className="w-6 h-6" />;
      default: return <FileIcon className="w-6 h-6" />;
    }
  };

  const selectedTotalSize = items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + (item.size_bytes || 0), 0);

  if (!isOpen || !albumId) return null;

  const completedUploads = uploadQueue.filter(t => t.status === 'completed').length;
  const totalUploads = uploadQueue.length;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Manage Media</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <label className="px-3 py-2 border rounded-lg cursor-pointer flex items-center gap-2 hover:bg-gray-50">
                  <Upload className="w-4 h-4" /> Upload Files
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*,audio/*,application/pdf" 
                    onChange={handleUpload} 
                    className="hidden" 
                    disabled={isUploading} 
                  />
                </label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value as FilterType)} 
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="all">All</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="pdf">PDF</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} selected · {formatFileSize(selectedTotalSize)}
                  </span>
                  <button 
                    onClick={handleBulkDownload}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Download Selected
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                  <button 
                    onClick={() => setSelectedItems(new Set())}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {uploadQueue.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    Uploading {completedUploads}/{totalUploads} files
                  </span>
                  <button 
                    onClick={() => setUploadQueue([])}
                    className="text-xs px-2 py-1 border rounded hover:bg-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {uploadQueue.map(task => (
                    <div key={task.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                      <span className="truncate flex-1">{task.file.name}</span>
                      <span className="text-gray-500 ml-2">{formatFileSize(task.file.size)}</span>
                      <span className={`ml-2 font-medium ${
                        task.status === 'completed' ? 'text-green-600' : 
                        task.status === 'failed' ? 'text-red-600' : 
                        task.status === 'uploading' ? 'text-blue-600' : 
                        'text-gray-500'
                      }`}>
                        {task.status === 'completed' ? '✓' : 
                         task.status === 'failed' ? '✗' : 
                         task.status === 'uploading' ? '↑' : '⋯'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(item => (
                <div 
                  key={item.id} 
                  className={`border rounded-lg overflow-hidden relative group ${selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="absolute top-2 left-2 z-10 w-5 h-5 cursor-pointer"
                  />
                  
                  <div 
                    className="cursor-pointer"
                    onClick={() => setViewingMedia(item)}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title || ''} className="w-full h-36 object-cover" />
                    ) : item.type === 'video' && item.thumbnail_url ? (
                      <div className="relative">
                        <img src={item.thumbnail_url} alt={item.title || ''} className="w-full h-36 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Film className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center bg-gray-100 text-gray-600">
                        {getMediaIcon(item.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2">
                    <div className="truncate text-xs font-medium" title={item.title}>{item.title}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(item.size_bytes)}</div>
                  </div>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                      onClick={() => setViewingMedia(item)}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && uploadQueue.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-12">
                  No media found. Upload files to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MediaViewerModal
        isOpen={!!viewingMedia}
        onClose={() => setViewingMedia(null)}
        mediaItem={viewingMedia}
        allItems={filtered}
        canDownload={true}
        onNavigate={(direction) => {
          const currentIndex = filtered.findIndex(item => item.id === viewingMedia?.id);
          if (direction === 'prev' && currentIndex > 0) {
            setViewingMedia(filtered[currentIndex - 1]);
          } else if (direction === 'next' && currentIndex < filtered.length - 1) {
            setViewingMedia(filtered[currentIndex + 1]);
          }
        }}
      />
    </>
  );
}
