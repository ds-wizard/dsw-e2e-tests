-- The default tenant is seeded for a cloud deployment, point it to this local stack
-- instead (the client takes the API URL from the bootstrap response).
UPDATE tenant
SET server_domain = 'localhost:8080',
    server_url    = 'http://localhost:8080',
    client_url    = 'http://localhost:8080'
WHERE uuid = '00000000-0000-0000-0000-000000000000';

-- Tours are a dialog that takes focus and blocks clicks underneath it, and the AI
-- assistant has nothing to talk to here.
UPDATE settings_features
SET tours_enabled = false,
    ai_assistant_enabled = false
WHERE tenant_uuid = '00000000-0000-0000-0000-000000000000';
