-- Migration: Add New Analytics Card Types - Part 2
-- Date: 2026-01-10
-- Purpose: Use the new card types added in Part 1

-- ===============================================
-- PREREQUISITE: Run 009-ADD-NEW-ANALYTICS-CARDS-PART1.sql FIRST
-- ===============================================

-- ===============================================
-- PART 2: Update Initialize Function
-- ===============================================

CREATE OR REPLACE FUNCTION initialize_analytics_cards(
  p_festival_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert default analytics cards if they don't exist
  INSERT INTO analytics_cards (festival_id, card_type, is_visible, sort_order, card_config)
  VALUES
    (p_festival_id, 'festival_snapshot', TRUE, 10, '{}'::jsonb),
    (p_festival_id, 'collection_target', TRUE, 20, '{}'::jsonb),
    (p_festival_id, 'previous_year_summary', TRUE, 30, '{}'::jsonb),
    (p_festival_id, 'donation_buckets', TRUE, 40, '{}'::jsonb),
    (p_festival_id, 'time_of_day', TRUE, 50, '{}'::jsonb),
    (p_festival_id, 'daily_net_balance', TRUE, 60, '{}'::jsonb),
    (p_festival_id, 'top_expenses', TRUE, 70, '{"top_count": 3}'::jsonb),
    (p_festival_id, 'transaction_count_by_day', TRUE, 80, '{}'::jsonb),
    (p_festival_id, 'collections_by_group', TRUE, 90, '{}'::jsonb),
    (p_festival_id, 'collections_by_mode', TRUE, 100, '{}'::jsonb),
    (p_festival_id, 'expenses_by_category', TRUE, 110, '{}'::jsonb),
    (p_festival_id, 'expenses_by_mode', TRUE, 120, '{}'::jsonb),
    (p_festival_id, 'top_donators', TRUE, 130, '{"top_count": 5}'::jsonb),
    (p_festival_id, 'average_donation_per_donor', TRUE, 140, '{}'::jsonb),
    (p_festival_id, 'collection_vs_expense_comparison', TRUE, 150, '{}'::jsonb)
  ON CONFLICT (festival_id, card_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION initialize_analytics_cards(UUID) TO authenticated, anon;

COMMENT ON FUNCTION initialize_analytics_cards IS 'Initialize default analytics cards for a festival including new card types';

-- ===============================================
-- PART 3: Initialize New Cards for Existing Festivals
-- ===============================================

-- Add new cards to all existing festivals
DO $$
DECLARE
  fest RECORD;
BEGIN
  FOR fest IN SELECT id FROM festivals
  LOOP
    -- Insert only the new card types if they don't exist
    INSERT INTO analytics_cards (festival_id, card_type, is_visible, sort_order, card_config)
    VALUES
      (fest.id, 'average_donation_per_donor', TRUE, 140, '{}'::jsonb),
      (fest.id, 'collection_vs_expense_comparison', TRUE, 150, '{}'::jsonb)
    ON CONFLICT (festival_id, card_type) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'New analytics cards added to all existing festivals';
END $$;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- View all analytics cards to verify new types are added
-- SELECT festival_id, card_type, is_visible, sort_order FROM analytics_cards ORDER BY festival_id, sort_order;

-- View only the new card types
-- SELECT f.code, ac.card_type, ac.is_visible, ac.sort_order 
-- FROM analytics_cards ac
-- JOIN festivals f ON ac.festival_id = f.id
-- WHERE ac.card_type IN ('average_donation_per_donor', 'collection_vs_expense_comparison')
-- ORDER BY f.code, ac.sort_order;
