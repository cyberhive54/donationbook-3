'use client';

import { useEffect, useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Album } from '@/types';
import { useSession } from '@/lib/hooks/useSession';

interface AddEditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  festivalId: string;
  festivalCode: string;
  initial?: Album | null;
}

export default function AddEditAlbumModal({ isOpen, onClose, onSuccess, festivalId, festivalCode, initial }: AddEditAlbumModalProps) {
  const { session } = useSession(festivalCode);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setTitle(initial.title || '');
        setDescription(initial.description || '');
        setYear(initial.year || '');
        setCoverPreview(initial.cover_url || '');
        setAllowDownload(initial.allow_download !== false);
        setCoverFile(null);
      } else {
        setTitle('');
        setDescription('');
        setYear('');
        setCoverPreview('');
        setAllowDownload(true);
        setCoverFile(null);
      }
    }
  }, [isOpen, initial]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Cover photo must be under 5MB');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsLoading(true);
    try {
      let coverUrl = initial?.cover_url || '';
      
      if (coverFile) {
        const path = `${festivalCode}/covers/${Date.now()}-${coverFile.name}`;
        const { error: upErr } = await supabase.storage.from('showcase').upload(path, coverFile, { upsert: false });
        if (upErr) throw new Error(`Cover upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from('showcase').getPublicUrl(path);
        coverUrl = pub?.publicUrl || '';
      }

      let albumId: string;
      
      if (initial?.id) {
        albumId = initial.id;
        const { error } = await supabase.from('albums').update({
          title: title.trim(),
          description: description.trim() || null,
          year: year === '' ? null : Number(year),
          cover_url: coverUrl || null,
          allow_download: allowDownload,
        }).eq('id', initial.id);
        if (error) throw error;

        // Log activity
        await supabase.rpc('log_admin_activity', {
          p_festival_id: festivalId,
          p_admin_id: session?.type === 'admin' ? session.adminId : null,
          p_action_type: 'edit_album',
          p_action_details: {
            album_id: albumId,
            title: title.trim(),
            cover_updated: !!coverFile
          },
          p_target_type: 'album',
          p_target_id: albumId
        });

        toast.success('Album updated');
      } else {
        const { data: insertedData, error } = await supabase.from('albums').insert({
          festival_id: festivalId,
          title: title.trim(),
          description: description.trim() || null,
          year: year === '' ? null : Number(year),
          cover_url: coverUrl || null,
          allow_download: allowDownload,
        }).select('id').single();
        if (error) throw error;
        albumId = insertedData.id;

        // Log activity
        await supabase.rpc('log_admin_activity', {
          p_festival_id: festivalId,
          p_admin_id: session?.type === 'admin' ? session.adminId : null,
          p_action_type: 'add_album',
          p_action_details: {
            album_id: albumId,
            title: title.trim(),
            has_cover: !!coverUrl
          },
          p_target_type: 'album',
          p_target_id: albumId
        });

        toast.success('Album created');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Save album error:', e);
      toast.error(e.message || 'Failed to save album');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{initial ? 'Edit Album' : 'Add Album'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
            {coverPreview && (
              <div className="mb-2 relative w-full h-40 rounded-lg overflow-hidden border">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverPreview(''); setCoverFile(null); }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              {coverPreview ? <Upload className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              <span className="text-sm">{coverPreview ? 'Change Cover Photo' : 'Upload Cover Photo'}</span>
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
            <div className="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG, WEBP</div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={allowDownload} 
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Allow visitors to download media from this album</span>
            </label>
            <div className="text-xs text-gray-500 mt-1">Note: If festival-level downloads are disabled, this setting will be overridden</div>
          </div>
          
          <div className="flex gap-2 pt-2 flex-shrink-0 border-t border-gray-200 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {isLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
