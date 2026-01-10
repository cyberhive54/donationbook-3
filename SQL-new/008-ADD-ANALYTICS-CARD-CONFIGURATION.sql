-- Migration: Add Analytics Card Configuration System
-- Date: 2026-01-10
-- Purpose: Allow super admin to control which analytics cards are shown, hidden, or reordered on visitor analytics page

-- ===============================================
-- PART 1: Create Analytics Card Configuration Table
-- ===============================================

-- Available analytics card types
CREATE TYPE analytics_card_type AS ENUM (
  'festival_snapshot',          -- Total collection, expense, balance, donors, transactions (5 cards)
  'collection_target',          -- Collection target progress bar
  'previous_year_summary',      -- Previous year comparison
  'donation_buckets',           -- Collections by donation amount (bar chart)
  'time_of_day',                -- Collections by time of day (bar chart)
  'daily_net_balance',          -- Daily net balance line/bar chart
  'top_expenses',               -- Top 3 expenses list + percentage bars
  'transaction_count_by_day',   -- Daily transaction count (bar chart)
  'collections_by_group',       -- Pie chart - collections by group
  'collections_by_mode',        -- Pie chart - collections by mode
  'expenses_by_category',       -- Pie chart - expenses by category
  'expenses_by_mode',           -- Pie chart - expenses by mode
  'top_donators'                -- Top 5 donators bar chart
);

-- Create analytics card configuration table
CREATE TABLE IF NOT EXISTS analytics_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  card_type analytics_card_type NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  card_config JSONB DEFAULT '{}'::jsonb, -- Custom config per card (e.g., top N items)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(festival_id, card_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_cards_festival ON analytics_cards(festival_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cards_visible ON analytics_cards(festival_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_analytics_cards_sort ON analytics_cards(festival_id, sort_order);

COMMENT ON TABLE analytics_cards IS 'Configuration for which analytics cards to show on visitor analytics page';
COMMENT ON COLUMN analytics_cards.card_type IS 'Type of analytics card';
COMMENT ON COLUMN analytics_cards.is_visible IS 'Whether card is shown on analytics page';
COMMENT ON COLUMN analytics_cards.sort_order IS 'Display order (lower number = higher position)';
COMMENT ON COLUMN analytics_cards.card_config IS 'Card-specific configuration (e.g., {"top_count": 5} for top donators)';

-- ===============================================
-- PART 2: Create Function to Initialize Default Cards
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
    (p_festival_id, 'top_donators', TRUE, 130, '{"top_count": 5}'::jsonb)
  ON CONFLICT (festival_id, card_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION initialize_analytics_cards(UUID) TO authenticated, anon;

COMMENT ON FUNCTION initialize_analytics_cards IS 'Initialize default analytics cards for a festival';

-- ===============================================
-- PART 3: Create Function to Update Card Configuration
-- ===============================================

CREATE OR REPLACE FUNCTION update_analytics_card(
  p_festival_id UUID,
  p_card_type analytics_card_type,
  p_is_visible BOOLEAN,
  p_sort_order INTEGER,
  p_card_config JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_updated_id UUID;
BEGIN
  -- Update or insert analytics card configuration
  INSERT INTO analytics_cards (festival_id, card_type, is_visible, sort_order, card_config, updated_at)
  VALUES (p_festival_id, p_card_type, p_is_visible, p_sort_order, COALESCE(p_card_config, '{}'::jsonb), NOW())
  ON CONFLICT (festival_id, card_type) 
  DO UPDATE SET 
    is_visible = EXCLUDED.is_visible,
    sort_order = EXCLUDED.sort_order,
    card_config = CASE 
      WHEN p_card_config IS NOT NULL THEN EXCLUDED.card_config 
      ELSE analytics_cards.card_config 
    END,
    updated_at = NOW()
  RETURNING id INTO v_updated_id;

  RETURN json_build_object(
    'success', true,
    'card_id', v_updated_id,
    'message', 'Analytics card configuration updated'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update card: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_analytics_card(UUID, analytics_card_type, BOOLEAN, INTEGER, JSONB) TO authenticated, anon;

COMMENT ON FUNCTION update_analytics_card IS 'Update or insert analytics card configuration for a festival';

-- ===============================================
-- PART 4: Create Function to Bulk Update Card Order
-- ===============================================

CREATE OR REPLACE FUNCTION update_analytics_cards_order(
  p_festival_id UUID,
  p_card_orders JSONB -- Format: [{"card_type": "festival_snapshot", "sort_order": 10}, ...]
)
RETURNS JSON AS $$
DECLARE
  v_card JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Loop through each card order update
  FOR v_card IN SELECT * FROM jsonb_array_elements(p_card_orders)
  LOOP
    UPDATE analytics_cards
    SET 
      sort_order = (v_card->>'sort_order')::INTEGER,
      updated_at = NOW()
    WHERE festival_id = p_festival_id
      AND card_type = (v_card->>'card_type')::analytics_card_type;
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'message', 'Card order updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update card order: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_analytics_cards_order(UUID, JSONB) TO authenticated, anon;

COMMENT ON FUNCTION update_analytics_cards_order IS 'Bulk update sort order for analytics cards';

-- ===============================================
-- PART 5: Create View for Visible Analytics Cards
-- ===============================================

CREATE OR REPLACE VIEW visible_analytics_cards AS
SELECT 
  ac.id,
  ac.festival_id,
  f.code AS festival_code,
  ac.card_type,
  ac.is_visible,
  ac.sort_order,
  ac.card_config,
  ac.created_at,
  ac.updated_at
FROM analytics_cards ac
JOIN festivals f ON ac.festival_id = f.id
WHERE ac.is_visible = TRUE
ORDER BY ac.festival_id, ac.sort_order;

COMMENT ON VIEW visible_analytics_cards IS 'Shows only visible analytics cards ordered by sort_order';

-- ===============================================
-- PART 6: Initialize Cards for Existing Festivals
-- ===============================================

-- Initialize analytics cards for all existing festivals
DO $$
DECLARE
  fest RECORD;
BEGIN
  FOR fest IN SELECT id FROM festivals
  LOOP
    PERFORM initialize_analytics_cards(fest.id);
  END LOOP;
END $$;

-- ===============================================
-- PART 7: Create Trigger to Auto-Initialize Cards for New Festivals
-- ===============================================

CREATE OR REPLACE FUNCTION auto_initialize_analytics_cards()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_analytics_cards(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_initialize_analytics_cards
  AFTER INSERT ON festivals
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_analytics_cards();

COMMENT ON FUNCTION auto_initialize_analytics_cards IS 'Automatically initialize analytics cards when a new festival is created';

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- View all analytics cards for a festival
-- SELECT * FROM analytics_cards WHERE festival_id = 'your-festival-id' ORDER BY sort_order;

-- View only visible cards for a festival
-- SELECT * FROM visible_analytics_cards WHERE festival_id = 'your-festival-id';

-- Initialize cards for a specific festival
-- SELECT initialize_analytics_cards('your-festival-id');

-- Update a card configuration
-- SELECT update_analytics_card(
--   'your-festival-id'::UUID,
--   'top_donators'::analytics_card_type,
--   TRUE,
--   50,
--   '{"top_count": 10}'::jsonb
-- );

-- Bulk update card order
-- SELECT update_analytics_cards_order(
--   'your-festival-id'::UUID,
--   '[
--     {"card_type": "festival_snapshot", "sort_order": 10},
--     {"card_type": "collection_target", "sort_order": 20},
--     {"card_type": "daily_net_balance", "sort_order": 30}
--   ]'::jsonb
-- );
