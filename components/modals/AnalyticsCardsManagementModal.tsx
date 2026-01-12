'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, GripVertical, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { AnalyticsCard, AnalyticsCardType } from '@/types';

interface AnalyticsCardsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  festivalId: string;
}

const CARD_LABELS: Record<AnalyticsCardType, string> = {
  'festival_snapshot': 'Festival Snapshot (5 Stats)',
  'collection_target': 'Collection Target Progress',
  'previous_year_summary': 'Previous Year Summary',
  'donation_buckets': 'Collections by Amount',
  'time_of_day': 'Collections by Time of Day',
  'daily_net_balance': 'Daily Net Balance',
  'top_expenses': 'Top Expenses',
  'transaction_count_by_day': 'Daily Transaction Count',
  'collections_by_group': 'Collections by Group (Donut)',
  'collections_by_mode': 'Collections by Mode (Horizontal Bar)',
  'expenses_by_category': 'Expenses by Category (Pie)',
  'expenses_by_mode': 'Expenses by Mode (Radial Bar)',
  'top_donators': 'Top Donators Chart',
  'average_donation_per_donor': 'Average Donation Per Donor',
  'collection_vs_expense_comparison': 'Collection vs Expense Comparison',
  'daily_collection_expense_bidirectional': 'Daily Collection & Expense (Bidirectional)',
};

const CARD_DESCRIPTIONS: Record<AnalyticsCardType, string> = {
  'festival_snapshot': 'Shows 5 key metrics: total collection, expense, balance, donors, and transactions',
  'collection_target': 'Displays progress bar towards collection target goal',
  'previous_year_summary': 'Compares current year performance with previous year',
  'donation_buckets': 'Bar chart showing collections grouped by donation amount ranges',
  'time_of_day': 'Bar chart showing collections grouped by time of day',
  'daily_net_balance': 'Line/bar chart showing daily net balance over time',
  'top_expenses': 'List of top 3 expense items with percentage breakdown',
  'transaction_count_by_day': 'Bar chart showing daily transaction counts',
  'collections_by_group': 'Donut chart showing collection distribution by group with center total',
  'collections_by_mode': 'Horizontal bar chart showing collection distribution by payment mode',
  'expenses_by_category': 'Pie chart showing expense distribution by category',
  'expenses_by_mode': 'Radial bar chart showing expense distribution by payment mode',
  'top_donators': 'Bar chart showing top 5 donators',
  'average_donation_per_donor': 'Shows average donation amount per unique donor with statistics',
  'collection_vs_expense_comparison': 'Line chart comparing daily collections and expenses over date range',
  'daily_collection_expense_bidirectional': 'Bidirectional bar chart with collections above (green) and expenses below (red) the baseline',
};

export default function AnalyticsCardsManagementModal({ isOpen, onClose, festivalId }: AnalyticsCardsManagementModalProps) {
  const [cards, setCards] = useState<AnalyticsCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && festivalId) {
      fetchCards();
    }
  }, [isOpen, festivalId]);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('analytics_cards')
        .select('*')
        .eq('festival_id', festivalId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCards((data as AnalyticsCard[]) || []);
    } catch (error: any) {
      console.error('Error fetching analytics cards:', error);
      toast.error('Failed to load analytics cards');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = (cardId: string) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, is_visible: !card.is_visible } : card
    ));
  };

  const updateTopCount = (cardId: string, topCount: number) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { 
        ...card, 
        card_config: { ...card.card_config, top_count: topCount } 
      } : card
    ));
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newCards = [...cards];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newCards.length) return;
    
    [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
    
    // Update sort_order for all cards
    newCards.forEach((card, idx) => {
      card.sort_order = (idx + 1) * 10;
    });
    
    setCards(newCards);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update each card
      for (const card of cards) {
        const { error } = await supabase.rpc('update_analytics_card', {
          p_festival_id: festivalId,
          p_card_type: card.card_type,
          p_is_visible: card.is_visible,
          p_sort_order: card.sort_order,
          p_card_config: card.card_config || null
        });

        if (error) throw error;
      }

      toast.success('Analytics cards updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Error saving analytics cards:', error);
      toast.error('Failed to save analytics cards');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Analytics Cards</h2>
            <p className="text-sm text-gray-600 mt-1">Control which cards are shown on the visitor analytics page</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No analytics cards found</p>
              <p className="text-sm text-gray-500 mt-2">Cards will be automatically created when you run the SQL migration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className={`border rounded-lg p-4 transition-all ${
                    card.is_visible 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => moveCard(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <GripVertical className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => moveCard(index, 'down')}
                        disabled={index === cards.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <GripVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Card Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {CARD_LABELS[card.card_type] || card.card_type}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {CARD_DESCRIPTIONS[card.card_type] || 'No description available'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">Order: {card.sort_order}</span>
                            {card.card_type === 'top_donators' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Top {card.card_config?.top_count || 5}
                              </span>
                            )}
                            {card.card_type === 'top_expenses' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Top {card.card_config?.top_count || 3}
                              </span>
                            )}
                          </div>
                          
                          {(card.card_type === 'top_donators' || card.card_type === 'top_expenses') && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Show top:
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="3"
                                  max="20"
                                  value={card.card_config?.top_count || (card.card_type === 'top_donators' ? 5 : 3)}
                                  onChange={(e) => updateTopCount(card.id, parseInt(e.target.value) || 5)}
                                  className="w-20 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">
                                  {card.card_type === 'top_donators' ? 'donators' : 'expenses'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleVisibility(card.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              card.is_visible
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            title={card.is_visible ? 'Hide card' : 'Show card'}
                          >
                            {card.is_visible ? (
                              <Eye className="w-5 h-5" />
                            ) : (
                              <EyeOff className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">ℹ️ How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click the eye icon to show/hide cards</li>
              <li>• Use the grip icon to reorder cards (higher = shown first)</li>
              <li>• Configure "Top X" for donators and expenses cards</li>
              <li>• Hidden cards will not appear on the visitor analytics page</li>
              <li>• Changes take effect immediately after saving</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {cards.filter(c => c.is_visible).length} of {cards.length} cards visible
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
