'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchResult {
  section: string;
  title: string;
  content: string;
  id: string;
}

interface DocsSearchProps {
  searchableContent: SearchResult[];
  onResultClick: (id: string) => void;
}

export default function DocsSearch({ searchableContent, onResultClick }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = searchableContent.filter(
      (item) =>
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.content.toLowerCase().includes(lowercaseQuery) ||
        item.section.toLowerCase().includes(lowercaseQuery)
    );

    setResults(filtered.slice(0, 8));
    setIsOpen(filtered.length > 0);
  }, [query, searchableContent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (id: string) => {
    onResultClick(id);
    setQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-docs-muted" />
        <Input
          type="text"
          placeholder="Search documentation... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 bg-docs-card border-docs-border text-docs-foreground placeholder:text-docs-muted focus:border-docs-accent focus:ring-docs-accent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-docs-muted hover:text-docs-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-docs-card border border-docs-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleResultClick(result.id)}
              className="w-full text-left px-4 py-3 hover:bg-docs-hover transition-colors border-b border-docs-border last:border-b-0"
            >
              <div className="text-xs text-docs-accent font-medium mb-1">
                {result.section}
              </div>
              <div className="text-sm font-medium text-docs-foreground mb-1">
                {result.title}
              </div>
              <div className="text-xs text-docs-muted line-clamp-2">
                {result.content}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
