'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface SidebarSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface DocsSidebarProps {
  sections: SidebarSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export default function DocsSidebar({ sections, activeSection, onSectionClick }: DocsSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentSection = sections.find(s => 
      s.id === activeSection || s.subsections?.some(sub => sub.id === activeSection)
    );
    if (currentSection) {
      setExpandedSections(prev => new Set([...prev, currentSection.id]));
    }
  }, [activeSection, sections]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const isActive = activeSection === section.id;
        const hasActiveSubsection = section.subsections?.some(sub => sub.id === activeSection);

        return (
          <div key={section.id}>
            <button
              onClick={() => {
                if (section.subsections && section.subsections.length > 0) {
                  toggleSection(section.id);
                } else {
                  onSectionClick(section.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-docs-accent text-white'
                  : hasActiveSubsection
                  ? 'text-docs-accent'
                  : 'text-docs-foreground hover:bg-docs-hover'
              }`}
            >
              <span>{section.title}</span>
              {section.subsections && section.subsections.length > 0 && (
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              )}
            </button>

            {section.subsections && section.subsections.length > 0 && isExpanded && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-docs-border pl-3">
                {section.subsections.map((subsection) => (
                  <button
                    key={subsection.id}
                    onClick={() => onSectionClick(subsection.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeSection === subsection.id
                        ? 'bg-docs-accent/10 text-docs-accent font-medium'
                        : 'text-docs-muted hover:text-docs-foreground hover:bg-docs-hover'
                    }`}
                  >
                    {subsection.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
