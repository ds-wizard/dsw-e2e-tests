-- Define the constant tenant UUID
WITH tenant AS (
    SELECT '00000000-0000-0000-0000-000000000000'::UUID AS tenant_uuid
),
-- Get all user UUIDs
users AS (
    SELECT uuid AS user_uuid FROM user_entity
),
-- Define all tour IDs
tours AS (
    SELECT unnest(ARRAY[
        'dashboard',
        'projects_create',
        'projects_detail',
        'projects_detail_share-modal',
        'projects_index',
        'users_edit_tours'
    ]) AS tour_id
)

-- Insert all combinations into user_tour
INSERT INTO user_tour (user_uuid, tour_id, tenant_uuid, created_at)
SELECT 
    u.user_uuid,
    t.tour_id,
    tn.tenant_uuid,
    NOW()
FROM users u
CROSS JOIN tours t
CROSS JOIN tenant tn;
