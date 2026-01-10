import { Festival } from '@/types';

export function getThemeStyles(festival: Festival | null) {
  if (!festival) return {};
  
  return {
    '--theme-primary': festival.theme_primary_color || '#2563eb',
    '--theme-secondary': festival.theme_secondary_color || '#1f2937',
    '--theme-bg': festival.theme_bg_color || '#f8fafc',
    '--theme-text': festival.theme_text_color || '#111827',
    '--theme-border': festival.theme_border_color || '#d1d5db',
    '--theme-table-bg': festival.theme_table_bg || '#ffffff',
    '--theme-card-bg': festival.theme_card_bg || '#ffffff',
  } as React.CSSProperties;
}

export function getThemeClasses(festival: Festival | null) {
  if (!festival) return '';
  return festival.theme_dark ? 'dark' : '';
}
