-- Migration: Add Delete Festival Function
-- Date: 2026-01-10
-- Purpose: Create secure function to delete entire festival with all related data
-- Security: Super admin only (requires super_admin_password verification)

-- ===============================================
-- PART 1: Create Function to Delete Festival
-- ===============================================

CREATE OR REPLACE FUNCTION delete_festival_with_password(
  p_festival_code TEXT,
  p_super_admin_password TEXT,
  p_confirmation_phrase TEXT
)
RETURNS JSON AS $$
DECLARE
  v_festival RECORD;
  v_collections_count INTEGER;
  v_expenses_count INTEGER;
  v_admins_count INTEGER;
  v_albums_count INTEGER;
  v_media_count INTEGER;
  v_total_deleted INTEGER := 0;
BEGIN
  -- Verify confirmation phrase (must be: "DELETE FESTIVAL PERMANENTLY")
  IF p_confirmation_phrase != 'DELETE FESTIVAL PERMANENTLY' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid confirmation phrase. Please type: DELETE FESTIVAL PERMANENTLY'
    );
  END IF;

  -- Get festival details and verify super admin password
  SELECT * INTO v_festival
  FROM festivals
  WHERE code = p_festival_code
    AND super_admin_password = p_super_admin_password;

  -- If festival not found or password incorrect
  IF v_festival.id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Festival not found or incorrect super admin password'
    );
  END IF;

  -- Count records before deletion (for reporting)
  SELECT COUNT(*) INTO v_collections_count FROM collections WHERE festival_id = v_festival.id;
  SELECT COUNT(*) INTO v_expenses_count FROM expenses WHERE festival_id = v_festival.id;
  SELECT COUNT(*) INTO v_admins_count FROM admins WHERE festival_id = v_festival.id;
  SELECT COUNT(*) INTO v_albums_count FROM albums WHERE festival_id = v_festival.id;
  SELECT COUNT(*) INTO v_media_count FROM media_items WHERE album_id IN (SELECT id FROM albums WHERE festival_id = v_festival.id);

  -- Start deletion process (order matters due to foreign keys)
  -- Note: Most deletions will cascade automatically, but we'll be explicit for clarity

  -- 1. Delete media items (cascade from albums)
  DELETE FROM media_items 
  WHERE album_id IN (SELECT id FROM albums WHERE festival_id = v_festival.id);
  
  -- 2. Delete albums
  DELETE FROM albums WHERE festival_id = v_festival.id;
  
  -- 3. Delete user passwords (cascade from admins)
  DELETE FROM user_passwords WHERE festival_id = v_festival.id;
  
  -- 4. Delete admin activity logs
  DELETE FROM admin_activity_log WHERE festival_id = v_festival.id;
  
  -- 5. Delete access logs
  DELETE FROM access_logs WHERE festival_id = v_festival.id;
  
  -- 6. Delete collections
  DELETE FROM collections WHERE festival_id = v_festival.id;
  
  -- 7. Delete expenses
  DELETE FROM expenses WHERE festival_id = v_festival.id;
  
  -- 8. Delete analytics config
  DELETE FROM analytics_config WHERE festival_id = v_festival.id;
  
  -- 9. Delete donation buckets
  DELETE FROM donation_buckets WHERE festival_id = v_festival.id;
  
  -- 10. Delete time of day buckets
  DELETE FROM time_of_day_buckets WHERE festival_id = v_festival.id;
  
  -- 11. Delete taxonomy (groups, categories, modes)
  DELETE FROM groups WHERE festival_id = v_festival.id;
  DELETE FROM categories WHERE festival_id = v_festival.id;
  DELETE FROM collection_modes WHERE festival_id = v_festival.id;
  DELETE FROM expense_modes WHERE festival_id = v_festival.id;
  
  -- 12. Delete admins
  DELETE FROM admins WHERE festival_id = v_festival.id;
  
  -- 13. Delete festival code history
  DELETE FROM festival_code_history WHERE festival_id = v_festival.id;
  
  -- 14. Finally, delete the festival itself
  DELETE FROM festivals WHERE id = v_festival.id;

  -- Calculate total records deleted
  v_total_deleted := v_collections_count + v_expenses_count + v_admins_count + v_albums_count + v_media_count;

  -- Return success with deletion summary
  RETURN json_build_object(
    'success', true,
    'message', 'Festival deleted successfully',
    'festival_code', p_festival_code,
    'festival_name', v_festival.event_name,
    'deleted_summary', json_build_object(
      'collections', v_collections_count,
      'expenses', v_expenses_count,
      'admins', v_admins_count,
      'albums', v_albums_count,
      'media_items', v_media_count,
      'total_records', v_total_deleted
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error if something goes wrong
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to delete festival: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission (still requires super admin password)
GRANT EXECUTE ON FUNCTION delete_festival_with_password(TEXT, TEXT, TEXT) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION delete_festival_with_password IS 'Permanently deletes a festival and all related data. Requires super admin password and confirmation phrase.';

-- ===============================================
-- PART 2: Create Function to Export Festival Data (JSON)
-- ===============================================

CREATE OR REPLACE FUNCTION export_festival_data(
  p_festival_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_festival_id UUID;
  v_result JSON;
BEGIN
  -- Get festival ID
  SELECT id INTO v_festival_id
  FROM festivals
  WHERE code = p_festival_code;

  IF v_festival_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Festival not found');
  END IF;

  -- Build complete export JSON
  SELECT json_build_object(
    'success', true,
    'export_date', NOW(),
    'festival', (SELECT row_to_json(f) FROM festivals f WHERE f.id = v_festival_id),
    'collections', (SELECT COALESCE(json_agg(c), '[]'::json) FROM collections c WHERE c.festival_id = v_festival_id),
    'expenses', (SELECT COALESCE(json_agg(e), '[]'::json) FROM expenses e WHERE e.festival_id = v_festival_id),
    'admins', (SELECT COALESCE(json_agg(a), '[]'::json) FROM admins a WHERE a.festival_id = v_festival_id),
    'user_passwords', (SELECT COALESCE(json_agg(up), '[]'::json) FROM user_passwords up WHERE up.festival_id = v_festival_id),
    'albums', (SELECT COALESCE(json_agg(al), '[]'::json) FROM albums al WHERE al.festival_id = v_festival_id),
    'groups', (SELECT COALESCE(json_agg(g), '[]'::json) FROM groups g WHERE g.festival_id = v_festival_id),
    'categories', (SELECT COALESCE(json_agg(cat), '[]'::json) FROM categories cat WHERE cat.festival_id = v_festival_id),
    'collection_modes', (SELECT COALESCE(json_agg(cm), '[]'::json) FROM collection_modes cm WHERE cm.festival_id = v_festival_id),
    'expense_modes', (SELECT COALESCE(json_agg(em), '[]'::json) FROM expense_modes em WHERE em.festival_id = v_festival_id),
    'analytics_config', (SELECT row_to_json(ac) FROM analytics_config ac WHERE ac.festival_id = v_festival_id),
    'access_logs_count', (SELECT COUNT(*) FROM access_logs WHERE festival_id = v_festival_id),
    'activity_logs_count', (SELECT COUNT(*) FROM admin_activity_log WHERE festival_id = v_festival_id)
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Export failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION export_festival_data(TEXT) TO authenticated, anon;

COMMENT ON FUNCTION export_festival_data IS 'Exports complete festival data as JSON for backup before deletion';

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Test export function (safe to run)
-- SELECT export_festival_data('YOUR_FESTIVAL_CODE');

-- Test delete function (DANGEROUS - PERMANENT DELETION)
-- SELECT delete_festival_with_password(
--   'YOUR_FESTIVAL_CODE',
--   'your_super_admin_password',
--   'DELETE FESTIVAL PERMANENTLY'
-- );
