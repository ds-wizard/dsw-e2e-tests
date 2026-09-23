-- Wizard-server seeds its default roles (Admin/Data Steward/Researcher) with
-- UUIDs like 'a0000000-0000-0000-0000-000000000001' that are not valid RFC 4122
-- UUIDs (the version nibble is '0' instead of 1-5). The client strictly validates
-- UUIDs and rejects them (e.g. "json.config.authentication.defaultRoleUuid ...
-- Not a valid UUID"), so replace them here with real v4 UUIDs, updating every
-- place that references them.
DO $$
DECLARE
    r RECORD;
    new_uuid UUID;
BEGIN
    FOR r IN
        SELECT uuid FROM role
        WHERE uuid <> '00000000-0000-0000-0000-000000000000'::uuid
          AND substring(uuid::text FROM 15 FOR 1) !~ '^[1-5]$'
    LOOP
        new_uuid := gen_random_uuid();

        INSERT INTO role (uuid, name, permissions, is_admin, tenant_uuid, created_at, updated_at)
        SELECT new_uuid, name, permissions, is_admin, tenant_uuid, created_at, updated_at
        FROM role WHERE uuid = r.uuid;

        UPDATE user_entity SET role_uuid = new_uuid WHERE role_uuid = r.uuid;
        UPDATE config_authentication SET default_role_uuid = new_uuid WHERE default_role_uuid = r.uuid;

        DELETE FROM role WHERE uuid = r.uuid;
    END LOOP;
END $$;

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
