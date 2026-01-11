'use client';

import PasswordGate from '@/components/PasswordGate';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Album, MediaItem, Festival } from '@/types';
import BottomNav from '@/components/BottomNav';
import GlobalSessionBar from '@/components/GlobalSessionBar';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';
import { Download, Eye, FileText, Film, Music, FileIcon, Image as ImageIcon, Lock, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import MediaViewerModal from '@/components/modals/MediaViewerModal';
import { useSession } from '@/lib/hooks/useSession';
import toast from 'react-hot-toast';

export default function ShowcasePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';
  const { session } = useSession(code);

  const [festival, setFestival] = useState<Festival | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'all'|'image'|'video'|'audio'|'pdf'|'other'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  
  // Check if download is allowed
  const canDownload = useMemo(() => {
    console.log('canDownload check:', {
      session_type: session?.type,
      festival_allow: festival?.allow_media_download,
      album_allow: active?.allow_download,
      active_album: active?.title
    });
    
    // Admins and super_admins can always download
    if (session?.type === 'admin' || session?.type === 'super_admin') {
      console.log('Admin/Super Admin - downloads allowed');
      return true;
    }
    
    // For visitors, check festival and album settings
    // If festival setting is explicitly false, deny downloads
    if (festival?.allow_media_download === false) {
      console.log('Festival blocks downloads');
      return false;
    }
    
    // If festival setting is explicitly true or undefined (default true), check album
    // If album setting is explicitly false, deny downloads  
    if (active?.allow_download === false) {
      console.log('Album blocks downloads');
      return false;
    }
    
    console.log('Downloads allowed');
    return true;
  }, [festival, active, session]);

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data: fest } = await supabase.from('festivals').select('*').eq('code', code).maybeSingle();
      if (!fest) return;
      console.log('Festival data loaded:', {
        code: fest.code,
        allow_media_download: fest.allow_media_download,
        session_type: session?.type
      });
      setFestival(fest);
      const { data } = await supabase.from('albums').select('*').eq('festival_id', fest.id).order('year', { ascending: false });
      setAlbums((data as Album[]) || []);
    };
    if (code) fetchAlbums();
  }, [code]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!active) return;
      const { data } = await supabase.from('media_items').select('*').eq('album_id', active.id).order('created_at', { ascending: false });
      setItems((data as MediaItem[]) || []);
    };
    fetchItems();
    setSelectedItems(new Set());
  }, [active]);

  const filtered = useMemo(() => items.filter(i => filter === 'all' ? true : i.type === filter), [items, filter]);

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  const getMediaUrl = (item: MediaItem): string => {
    if (item.media_source_type === 'link' && item.external_url) {
      return item.external_url;
    }
    return item.url;
  };
  
  const isExternalLink = (item: MediaItem): boolean => {
    return item.media_source_type === 'link';
  };

  const handleDownload = async (item: MediaItem) => {
    if (!canDownload) {
      toast.error('Downloads are disabled for this festival/album');
      return;
    }
    
    try {
      if (item.media_source_type === 'link') {
        const linkUrl = item.external_url || item.url;
        window.open(linkUrl, '_blank');
        toast.success('Opening link in new tab');
        return;
      }
      
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
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    }
  };

  const handleMediaError = (itemId: string) => {
    setFailedMedia(prev => new Set(prev).add(itemId));
  };

  const preventRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.error('Right-click is disabled on media');
    return false;
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
    // Check download permission
    if (!canDownload) {
      toast.error('Downloads are disabled for this festival/album');
      return;
    }
    
    const selectedMediaItems = items.filter(item => selectedItems.has(item.id));
    toast.success(`Downloading ${selectedMediaItems.length} items...`);
    
    for (const item of selectedMediaItems) {
      await handleDownload(item);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-12 h-12" />;
      case 'video': return <Film className="w-12 h-12" />;
      case 'audio': return <Music className="w-12 h-12" />;
      case 'pdf': return <FileText className="w-12 h-12" />;
      default: return <FileIcon className="w-12 h-12" />;
    }
  };

  const selectedTotalSize = items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + (item.size_bytes || 0), 0);

  return (
    <PasswordGate code={code}>
      <div className={`min-h-screen p-4 pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
        <div className="max-w-7xl mx-auto">
          {/* Debug banner - shows viewing mode */}
          {(session?.type === 'admin' || session?.type === 'super_admin') && (
            <div className="mb-4 bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="font-bold">🔓 Admin Mode:</span>
                <span>You are viewing as {session.type === 'super_admin' ? 'Super Admin' : 'Admin'}. Download restrictions do not apply to you.</span>
              </div>
            </div>
          )}
          
          {/* Debug info - shows download settings */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-900 p-3 rounded text-xs">
              <div><strong>Debug Info:</strong></div>
              <div>Session Type: {session?.type || 'visitor'}</div>
              <div>Festival Download Setting: {festival?.allow_media_download === true ? 'Enabled ✓' : festival?.allow_media_download === false ? 'Disabled ✗' : 'Not Set (defaults to Enabled)'}</div>
              <div>Album Download Setting: {active?.allow_download === true ? 'Enabled ✓' : active?.allow_download === false ? 'Disabled ✗' : 'Not Set (defaults to Enabled)'}</div>
              <div>Can Download: {canDownload ? 'YES ✓' : 'NO ✗'}</div>
            </div>
          )}
          
          <h1 className="text-2xl font-bold theme-text mb-4">Showcase</h1>
          
          {albums.length === 0 ? (
            <div className="theme-card rounded-lg shadow-md p-6 mb-6">
              <p className="text-center theme-text">No albums created yet. Contact admin to add showcase albums.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {albums.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => setActive(a)} 
                  className={`theme-card border rounded-lg overflow-hidden text-left transition-all ${active?.id === a.id ? 'border-blue-600 ring-2 ring-blue-300' : ''}`}
                >
                  {a.cover_url && (
                    <img 
                      src={a.cover_url} 
                      alt={a.title} 
                      className="w-full h-32 object-cover" 
                      onContextMenu={preventRightClick}
                      draggable={false}
                    />
                  )}
                  <div className="p-3">
                    <div className="font-semibold theme-text truncate">{a.title}</div>
                    <div className="text-xs opacity-70 theme-text">{a.year || 'Year N/A'}</div>
                    {a.description && (
                      <div className="text-sm opacity-80 theme-text mt-1 line-clamp-2">{a.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {active ? (
            <div className="theme-card rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <div>
                  <div className="text-lg font-semibold theme-text">{active.title}</div>
                  <div className="text-xs opacity-70 theme-text">{active.year || ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as any)} 
                    className="px-3 py-2 border rounded-lg theme-text"
                  >
                    <option value="all">All</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">PDF</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {selectedItems.size > 0 && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm theme-text">
                    {selectedItems.size} selected · {formatFileSize(selectedTotalSize)}
                  </span>
                  <div className="flex gap-2">
                    {canDownload ? (
                      <button 
                        onClick={handleBulkDownload}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download All
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="px-3 py-1 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed flex items-center gap-1"
                        title="Downloads disabled"
                      >
                        <Lock className="w-4 h-4" />
                        Download Disabled
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedItems(new Set())}
                      className="px-3 py-1 border rounded-lg text-sm theme-text"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map(item => (
                  <div 
                    key={item.id} 
                    className={`theme-card border rounded-lg overflow-hidden relative group ${selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''}`}
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
                      {failedMedia.has(item.id) ? (
                        <div className="h-36 flex flex-col items-center justify-center bg-gray-100 theme-text gap-2">
                          <ExternalLink className="w-8 h-8 text-blue-600" />
                          <span className="text-xs">External Link</span>
                        </div>
                      ) : item.type === 'image' ? (
                        <img 
                          src={getMediaUrl(item)} 
                          alt={item.title || ''} 
                          className="w-full h-36 object-cover" 
                          onContextMenu={preventRightClick}
                          draggable={false}
                          onError={() => handleMediaError(item.id)}
                        />
                      ) : item.type === 'video' && item.thumbnail_url ? (
                        <div className="relative">
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.title || ''} 
                            className="w-full h-36 object-cover" 
                            onContextMenu={preventRightClick}
                            draggable={false}
                            onError={() => handleMediaError(item.id)}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Film className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : item.type === 'pdf' ? (
                        <div className="h-36 flex items-center justify-center bg-gray-100 theme-text">
                          <FileText className="w-12 h-12" />
                        </div>
                      ) : (
                        <div className="h-36 flex items-center justify-center bg-gray-100 theme-text">
                          {getMediaIcon(item.type)}
                        </div>
                      )}
                      {isExternalLink(item) && !failedMedia.has(item.id) && (
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            Link
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2">
                      <div className="truncate text-xs theme-text" title={item.title}>{item.title}</div>
                      <div className="text-xs opacity-70 theme-text">
                        {isExternalLink(item) ? 'External Link' : formatFileSize(item.size_bytes)}
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setViewingMedia(item); }}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canDownload ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="p-1.5 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                          title="Downloads disabled"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-sm theme-text opacity-70 text-center py-8">
                    No media found for this filter.
                  </div>
                )}
              </div>
            </div>
          ) : albums.length > 0 && (
            <div className="theme-card rounded-lg shadow-md p-6">
              <p className="theme-text opacity-80">Select an album to view media.</p>
            </div>
          )}
        </div>
        <BottomNav code={code} />
        <GlobalSessionBar festivalCode={code} currentPage="other" />
      </div>

      <MediaViewerModal
        isOpen={!!viewingMedia}
        onClose={() => setViewingMedia(null)}
        mediaItem={viewingMedia}
        allItems={filtered}
        canDownload={canDownload}
        onNavigate={(direction) => {
          const currentIndex = filtered.findIndex(item => item.id === viewingMedia?.id);
          if (direction === 'prev' && currentIndex > 0) {
            setViewingMedia(filtered[currentIndex - 1]);
          } else if (direction === 'next' && currentIndex < filtered.length - 1) {
            setViewingMedia(filtered[currentIndex + 1]);
          }
        }}
      />
    </PasswordGate>
  );
}
