'use client';

import { BasicInfo as BasicInfoType, Festival } from '@/types';
import { formatDate } from '@/lib/utils';
import { Edit } from 'lucide-react';

interface BasicInfoProps {
  basicInfo: BasicInfoType | null;
  showEditButton?: boolean;
  onEdit?: () => void;
  festival?: Festival | null; // Optional festival object for banner visibility settings
}

export default function BasicInfo({ basicInfo, showEditButton = false, onEdit, festival }: BasicInfoProps) {
  if (!basicInfo) {
    return (
      <div className="theme-card bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-center text-gray-500">No event information available</p>
      </div>
    );
  }

  const style = (basicInfo.other_data as any) || {};
  const sizeClass =
    style.title_size === 'lg'
      ? 'text-3xl md:text-4xl'
      : style.title_size === 'sm'
      ? 'text-xl md:text-2xl'
      : 'text-2xl md:text-3xl';
  const weightClass =
    style.title_weight === 'normal' ? 'font-semibold' : style.title_weight === 'extrabold' ? 'font-extrabold' : 'font-bold';
  const alignClass = style.title_align === 'left' ? 'text-left' : 'text-center';
  const colorClass = style.title_color === 'indigo' ? 'text-indigo-700' : style.title_color === 'blue' ? 'text-blue-700' : 'text-gray-800';

  // Banner visibility settings (default to true if not provided)
  const showOrganiser = festival?.banner_show_organiser !== false;
  const showGuide = festival?.banner_show_guide !== false;
  const showMentor = festival?.banner_show_mentor !== false;
  const showLocation = festival?.banner_show_location !== false;
  const showDates = festival?.banner_show_dates !== false;
  const showDuration = festival?.banner_show_duration !== false;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 relative">
      {showEditButton && onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors"
          title="Edit Basic Info"
        >
          <Edit className="w-5 h-5 text-blue-600" />
        </button>
      )}
      
      <h1 className={`${sizeClass} ${weightClass} ${alignClass} ${colorClass} mb-4`}>
        {basicInfo.event_name}
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
        {showOrganiser && basicInfo.organiser && (
          <div>
            <span className="font-semibold text-gray-700">Organiser:</span>{' '}
            <span className="text-gray-600">{basicInfo.organiser}</span>
          </div>
        )}
        {showGuide && basicInfo.guide && (
          <div>
            <span className="font-semibold text-gray-700">Guide:</span>{' '}
            <span className="text-gray-600">{basicInfo.guide}</span>
          </div>
        )}
        {showMentor && basicInfo.mentor && (
          <div>
            <span className="font-semibold text-gray-700">Mentor:</span>{' '}
            <span className="text-gray-600">{basicInfo.mentor}</span>
          </div>
        )}
        {showLocation && basicInfo.location && (
          <div>
            <span className="font-semibold text-gray-700">Location:</span>{' '}
            <span className="text-gray-600">{basicInfo.location}</span>
          </div>
        )}
        {showDates && (basicInfo.event_start_date || basicInfo.event_end_date) && (
          <div>
            <span className="font-semibold text-gray-700">Festival Dates:</span>{' '}
            <span className="text-gray-600">
              {basicInfo.event_start_date ? formatDate(basicInfo.event_start_date) : '—'}
              {' '}to{' '}
              {basicInfo.event_end_date ? formatDate(basicInfo.event_end_date) : '—'}
            </span>
          </div>
        )}
        {showDuration && basicInfo.event_start_date && basicInfo.event_end_date && (
          <div>
            <span className="font-semibold text-gray-700">Duration:</span>{' '}
            <span className="text-gray-600">
              {(() => {
                const start = new Date(basicInfo.event_start_date as string).getTime();
                const end = new Date(basicInfo.event_end_date as string).getTime();
                const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                return `${days} day${days > 1 ? 's' : ''}`;
              })()}
            </span>
          </div>
        )}
        {basicInfo.event_date && !basicInfo.event_start_date && !basicInfo.event_end_date && (
          <div>
            <span className="font-semibold text-gray-700">Event Date:</span>{' '}
            <span className="text-gray-600">{formatDate(basicInfo.event_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
