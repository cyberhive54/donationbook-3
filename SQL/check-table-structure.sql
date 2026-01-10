-- Check the admins table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- Check if there are any admins at all
SELECT COUNT(*) as total_admins FROM admins;

-- Check admins for this festival
SELECT 
    a.admin_id,
    a.admin_code,
    a.admin_name,
    a.is_active,
    f.code as festival_code,
    f.event_name
FROM admins a
JOIN festivals f ON a.festival_id = f.id
WHERE f.code = 'EAXNKJXD';
