-- seed-identity.sql  (Level 2 — Customer Identity)
-- Customer-specific setup that site-provisioner creates for THIS tenant.
-- Every value here would differ for a real customer (company name, URL,
-- admin credentials, location). For local dev we use placeholder values.
--
-- This is what makes the app usable: login works, screens are accessible.
-- No business data (jobs/contacts/etc.) — that is seed-demo.sql (Level 3).
--
-- Depends on: seed-template.sql (m_roles must exist before user_user_roles)
-- Followed by: seed-demo.sql (optional)
--
-- Login:  admin / admin123  at  http://localhost:4200/

USE XcelerateDB;
GO

-- ═══════════════════════════════════════════════════════════════
-- COMMON SCHEMA — company + user identity
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- common.rest_comp_details  (tenant registry)
-- Queried by:
--   loginValidateWithClientUrl → WHERE rest_comp_url LIKE %dataUrl%
--   validateLogin              → resolves company + schema
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM common.rest_comp_details WHERE rest_comp_id = 1)
BEGIN
    SET IDENTITY_INSERT common.rest_comp_details ON;
    INSERT INTO common.rest_comp_details (
        rest_comp_id,
        rest_comp_hashcode,
        rest_comp_code,
        rest_comp_name,
        rest_comp_short_name,
        rest_comp_address,
        rest_comp_phone_number1,
        rest_comp_email,
        rest_comp_status,
        rest_comp_type,
        rest_comp_url,
        schema_name,
        rest_comp_max_users,
        source,
        time_zone,
        google_integration,
        outlook_integration,
        okta_integration,
        is_analytics_enabled,
        is_chat_enable,
        rest_comp_logo,
        rest_comp_plan_id
    ) VALUES (
        1,
        'LOCAL001',
        'LOCAL001',
        'Apex Restoration Services',
        'Apex',
        '1250 Commerce Drive, Atlanta, GA 30301',
        '4045550192',
        'admin@apexrestoration.com',
        'Active',
        'Contractor',
        'http://localhost:4200/',   -- must match dataUrl sent by frontend
        'tenant1',                  -- drives EXECUTE AS USER in stored procs
        100,
        'System',
        'US/Eastern',
        'No',   -- google_integration — standard password login
        'No',   -- outlook_integration
        'No',   -- okta_integration — must be No for password login
        0,
        0,
        0,      -- rest_comp_logo (primitive int, not null)
        0       -- rest_comp_plan_id (primitive int, not null)
    );
    SET IDENTITY_INSERT common.rest_comp_details OFF;
END
GO
UPDATE common.rest_comp_details SET rest_comp_logo = 0    WHERE rest_comp_id = 1 AND rest_comp_logo IS NULL;
GO
UPDATE common.rest_comp_details SET rest_comp_plan_id = 0 WHERE rest_comp_id = 1 AND rest_comp_plan_id IS NULL;
GO

-- ─────────────────────────────────────────
-- common.user_user_details  (admin user, common side)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM common.user_user_details WHERE user_detail_id = 1)
BEGIN
    SET IDENTITY_INSERT common.user_user_details ON;
    INSERT INTO common.user_user_details (
        user_detail_id,
        user_id,
        user_name,
        first_name,
        last_name,
        email_id,
        status,
        source,
        is_analytics_enabled,
        created_by
    ) VALUES (
        1, 1,
        'admin',
        'Local', 'Admin',
        'admin@apexrestoration.com',
        'Active', 'System',
        0, 0
    );
    SET IDENTITY_INSERT common.user_user_details OFF;
END
GO
UPDATE common.user_user_details SET created_by = 0 WHERE user_detail_id = 1 AND created_by IS NULL;
GO

-- ─────────────────────────────────────────
-- common.user_user_authentication  (credentials: admin / admin123)
-- BCrypt hash verified against Spring Security BCryptPasswordEncoder
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM common.user_user_authentication WHERE user_authentication_id = 1)
BEGIN
    SET IDENTITY_INSERT common.user_user_authentication ON;
    INSERT INTO common.user_user_authentication (
        user_authentication_id,
        user_id,
        user_detail_id,
        user_name,
        password,
        restoration_company_id,
        source
    ) VALUES (
        1, 1, 1,
        'admin',
        '$2b$10$yMNEoWqPkFCHtnzOPEAaFusvGJgyCt5w1AoxikhTJrsILJqCMoSa2',
        1,
        'System'
    );
    SET IDENTITY_INSERT common.user_user_authentication OFF;
END
GO
-- Always keep password correct (safe idempotency fix)
UPDATE common.user_user_authentication
SET password = '$2b$10$yMNEoWqPkFCHtnzOPEAaFusvGJgyCt5w1AoxikhTJrsILJqCMoSa2'
WHERE user_authentication_id = 1;
GO

-- ─────────────────────────────────────────
-- common.rest_comp_integrations  (integration defaults)
-- PayrollServiceImpl.getPayrollostDetails() → NPE if missing
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM common.rest_comp_integrations WHERE rest_comp_id = 1)
BEGIN
    INSERT INTO common.rest_comp_integrations (rest_comp_id, status, source, created_by)
    VALUES (1, 'Active', 'System', 0);
END
GO

-- ═══════════════════════════════════════════════════════════════
-- TENANT1 SCHEMA — tenant-side user identity + company + location
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- tenant1.user_user_details  (admin user, tenant side)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.user_user_details WHERE user_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.user_user_details ON;
    INSERT INTO tenant1.user_user_details (
        user_id,
        user_name,
        first_name, last_name,
        email_id,
        status, source,
        admin_access,
        crm_access,
        time_tracking_access,
        launch_screen,
        release_read_status
    ) VALUES (
        1,
        'admin',
        'Local', 'Admin',
        'admin@apexrestoration.com',
        'Active', 'System',
        'Yes', 'Y', 'Yes',
        'Dashboard',
        'Yes'
    );
    SET IDENTITY_INSERT tenant1.user_user_details OFF;
END
GO

-- ─────────────────────────────────────────
-- tenant1.user_user_roles  (role assignment — depends on m_roles from seed-template)
-- locations='*' → XcelerateConstants.ALL_LOCATIONS → all active locations
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.user_user_roles WHERE user_role_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.user_user_roles ON;
    INSERT INTO tenant1.user_user_roles (
        user_role_id,
        user_id,
        role_id,
        locations,
        preferred_location,
        status, source
    ) VALUES (
        1, 1, 1,
        '*',    -- ALL_LOCATIONS
        '1',    -- preferred_location → rest_comp_location_id
        'Active', 'System'
    );
    SET IDENTITY_INSERT tenant1.user_user_roles OFF;
END
GO
UPDATE tenant1.user_user_roles SET locations = '*' WHERE user_role_id = 1 AND locations != '*';
GO

-- ─────────────────────────────────────────
-- tenant1.rest_comp_details  (tenant-side company record)
-- JWT claims: companyName, companyUrl, logo, etc.
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.rest_comp_details WHERE rest_comp_id = 1)
BEGIN
    INSERT INTO tenant1.rest_comp_details (
        rest_comp_id,
        rest_comp_hash_code,
        rest_comp_code,
        rest_comp_name,
        rest_comp_short_name,
        rest_comp_status,
        source,
        rest_comp_max_users,
        rest_comp_plan_id
    ) VALUES (
        1,
        'LOCAL001',
        'LOCAL001',
        'Apex Restoration Services',
        'Apex',
        'Active',
        'System',
        100, 0
    );
END
GO
UPDATE tenant1.rest_comp_details SET rest_comp_max_users = 100 WHERE rest_comp_id = 1 AND rest_comp_max_users IS NULL;
GO
UPDATE tenant1.rest_comp_details SET rest_comp_plan_id   = 0   WHERE rest_comp_id = 1 AND rest_comp_plan_id IS NULL;
GO

-- ─────────────────────────────────────────
-- tenant1.rest_comp_location  (HQ location)
-- locationRepository.findByLocationStatus('Active')
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.rest_comp_location WHERE rest_comp_location_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.rest_comp_location ON;
    INSERT INTO tenant1.rest_comp_location (
        rest_comp_location_id,
        rest_comp_id,
        location_hash,
        location_code,
        location_desc,
        location_address,
        location_city,
        location_state,
        location_zip,
        location_status,
        source
    ) VALUES (
        1, 1,
        'LOC001',
        'Atlanta HQ',
        'Atlanta Headquarters',
        '1250 Commerce Drive',
        'Atlanta',
        'GA',
        '30301',
        'Active', 'System'
    );
    SET IDENTITY_INSERT tenant1.rest_comp_location OFF;
END
GO

-- ─────────────────────────────────────────
-- tenant1.user_screens  (screen permissions for admin user)
-- CanAccessGuard:    screenName == name  &&  componentName IS NULL
-- ScreenaccessGuard: screenName == name  &&  componentName == route.data.component
-- canUserAccess dir: 'ScreenName.ComponentName'
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.user_screens WHERE user_id = 1)
BEGIN
    INSERT INTO tenant1.user_screens (screen_name, component_name, user_id, web_preference, mobile_preference, status, source)
    VALUES
        -- Top-level routes (CanAccessGuard — component_name NULL)
        ('Dashboard',              NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin',                  NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('CRM',                    NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Scheduler',              NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Files',                  NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Opportunities',          NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Master Jobs',            NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Tasks',                  NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Settings',               NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Reports',                NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Analytics',              NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('QuickBooks',             NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('NetSuite',               NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Time Tracking',          NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        ('New Master Job',         NULL, 1, 'Yes', 'Yes', 'Active', 'System'),
        -- Sub-routes (ScreenaccessGuard)
        ('New Master Job',     'New Master Job',    1, 'Yes', 'Yes', 'Active', 'System'),
        -- Admin child routes
        ('Admin', 'Companysetup',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'UserCreation',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'TaskCreation',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'TaskTemplate',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'TaskPack',           1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'TaskPackAssignment', 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'Permission',         1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'Customizedstatus',   1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'KpiTargets',         1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'Configurable',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'ProgramType',        1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'Forms',              1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'File Types',         1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'Integrations',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'ChatSettings',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('Admin', 'ChatSetup',          1, 'Yes', 'Yes', 'Active', 'System'),
        -- CRM tabs
        ('CRM', 'People',              1, 'Yes', 'Yes', 'Active', 'System'),
        ('CRM', 'Organization',        1, 'Yes', 'Yes', 'Active', 'System'),
        ('CRM', 'Activities',          1, 'Yes', 'Yes', 'Active', 'System'),
        ('CRM', 'Activities Beta',     1, 'Yes', 'Yes', 'Active', 'System'),
        ('CRM', 'Leaderboards',        1, 'Yes', 'Yes', 'Active', 'System'),
        ('CRM', 'Notes',               1, 'Yes', 'Yes', 'Active', 'System'),
        -- Master Jobs tabs
        ('Master Jobs', 'My Open',         1, 'Yes', 'Yes', 'Active', 'System'),
        ('Master Jobs', 'All Open',        1, 'Yes', 'Yes', 'Active', 'System'),
        ('Master Jobs', 'All Master Jobs', 1, 'Yes', 'Yes', 'Active', 'System'),
        -- Files tabs
        ('Files', 'My Open',    1, 'Yes', 'Yes', 'Active', 'System'),
        ('Files', 'All Open',   1, 'Yes', 'Yes', 'Active', 'System'),
        ('Files', 'All Files',  1, 'Yes', 'Yes', 'Active', 'System'),
        -- File Details tabs
        ('File Details', NULL,             1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Documents',      1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Notes',          1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Edit Notes',     1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Tasks',          1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Schedule',       1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Financial',      1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Time Tracking',  1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Work Orders',    1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Chat',           1, 'Yes', 'Yes', 'Active', 'System'),
        ('File Details', 'Warranty',       1, 'Yes', 'Yes', 'Active', 'System'),
        -- Tasks tabs
        ('Tasks', 'My Tasks',                1, 'Yes', 'Yes', 'Active', 'System'),
        ('Tasks', 'All Open Tasks',          1, 'Yes', 'Yes', 'Active', 'System'),
        ('Tasks', 'All Tasks',               1, 'Yes', 'Yes', 'Active', 'System'),
        ('Tasks', 'Revision Required Tasks', 1, 'Yes', 'Yes', 'Active', 'System'),
        -- Scheduler tabs
        ('Scheduler', 'By Employee', 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Scheduler', 'By File',     1, 'Yes', 'Yes', 'Active', 'System'),
        -- Time Tracking sub-routes
        ('Time Tracking', 'PayrollAdmin',         1, 'Yes', 'Yes', 'Active', 'System'),
        ('Time Tracking', 'PayrollTimeCard',      1, 'Yes', 'Yes', 'Active', 'System'),
        ('Time Tracking', 'PayrollDetailCost',    1, 'Yes', 'Yes', 'Active', 'System'),
        ('Time Tracking', 'Payroll Time Details', 1, 'Yes', 'Yes', 'Active', 'System'),
        ('Time Tracking', 'TimeCardApprovals',    1, 'Yes', 'Yes', 'Active', 'System'),
        -- QuickBooks
        ('QuickBooks', 'QuickBooks', 1, 'Yes', 'Yes', 'Active', 'System');
END
GO

-- ─────────────────────────────────────────
-- tenant1.m_role_screens  (role-based screen access — Admin role gets all screens)
-- Consumed by MScreenDetailsServiceImpl.getRolesMScreenDetails()
--   → findByScreenNameAndStatus(screenName, 'Yes')
-- status='Yes' grants access; component_name=NULL = top-level screen grant
-- Uses per-row NOT EXISTS so new sub-components can be added on re-seed.
-- ─────────────────────────────────────────
INSERT INTO tenant1.m_role_screens (role_id, screen_name, component_name, status, source, created_by, created_datetime, updated_by, updated_datetime)
SELECT v.role_id, v.screen_name, v.component_name, 'Yes', 'System', 1, GETDATE(), 1, GETDATE()
FROM (VALUES
    -- Top-level screen grants (component_name NULL = main screen checkbox)
    (1, 'Dashboard',        NULL),
    (1, 'New Master Job',   NULL),
    (1, 'Opportunities',    NULL),
    (1, 'Master Jobs',      NULL),
    (1, 'Files',            NULL),
    (1, 'File Details',     NULL),
    (1, 'Tasks',            NULL),
    (1, 'Scheduler',        NULL),
    (1, 'CRM',              NULL),
    (1, 'Admin',            NULL),
    (1, 'Reports',          NULL),
    (1, 'Time Tracking',    NULL),
    (1, 'QuickBooks',       NULL),
    (1, 'Integrations',     NULL),
    (1, 'Training Library', NULL),
    (1, 'Netsuite',         NULL),
    -- Self-referencing sub-rows
    (1, 'Dashboard',        'Dashboard'),
    (1, 'New Master Job',   'New Master Job'),
    (1, 'Opportunities',    'Opportunities'),
    (1, 'Reports',          'Reports'),
    (1, 'Training Library', 'Training Library'),
    (1, 'Netsuite',         'NetSuite'),
    -- Admin sub-components
    (1, 'Admin', 'TaskCreation'),
    (1, 'Admin', 'UserCreation'),
    (1, 'Admin', 'KpiTargets'),
    (1, 'Admin', 'Configurable'),
    (1, 'Admin', 'ProgramType'),
    (1, 'Admin', 'Companysetup'),
    (1, 'Admin', 'Integrations'),
    (1, 'Admin', 'Customizedstatus'),
    (1, 'Admin', 'Permission'),
    (1, 'Admin', 'Forms'),
    (1, 'Admin', 'File Types'),
    (1, 'Admin', 'TaskTemplate'),
    (1, 'Admin', 'TaskPack'),
    (1, 'Admin', 'TaskPackAssignment'),
    -- CRM sub-components
    (1, 'CRM', 'People'),
    (1, 'CRM', 'Organization'),
    (1, 'CRM', 'Activities'),
    (1, 'CRM', 'Leaderboards'),
    (1, 'CRM', 'Notes'),
    (1, 'CRM', 'Activities Beta'),
    (1, 'CRM', 'Edit Sales Rep'),
    -- Master Jobs sub-components
    (1, 'Master Jobs', 'My Open'),
    (1, 'Master Jobs', 'All Open'),
    (1, 'Master Jobs', 'All Master Jobs'),
    -- Files sub-components
    (1, 'Files', 'My Open'),
    (1, 'Files', 'All Open'),
    (1, 'Files', 'All Files'),
    -- File Details sub-components
    (1, 'File Details', 'Notes'),
    (1, 'File Details', 'Documents'),
    (1, 'File Details', 'Financial'),
    (1, 'File Details', 'Tasks'),
    (1, 'File Details', 'Warranty'),
    (1, 'File Details', 'Time Tracking'),
    (1, 'File Details', 'Schedule'),
    (1, 'File Details', 'Edit Notes'),
    (1, 'File Details', 'Work Orders'),
    -- Tasks sub-components
    (1, 'Tasks', 'My Tasks'),
    (1, 'Tasks', 'All Open Tasks'),
    (1, 'Tasks', 'All Tasks'),
    (1, 'Tasks', 'Revision Required Tasks'),
    -- Scheduler sub-components
    (1, 'Scheduler', 'By File'),
    (1, 'Scheduler', 'By Employee'),
    -- Time Tracking sub-components
    (1, 'Time Tracking', 'PayrollAdmin'),
    (1, 'Time Tracking', 'PayrollTimeCard'),
    (1, 'Time Tracking', 'PayrollDetailCost'),
    (1, 'Time Tracking', 'Payroll Time Details'),
    (1, 'Time Tracking', 'TimeCardApprovals'),
    -- QuickBooks sub-components
    (1, 'QuickBooks', 'QuickBooks'),
    -- Integrations sub-components
    (1, 'Integrations', 'QuickBooks'),
    (1, 'Integrations', 'Encircle'),
    (1, 'Integrations', 'NetSuite')
) AS v(role_id, screen_name, component_name)
WHERE NOT EXISTS (
    SELECT 1 FROM tenant1.m_role_screens r
    WHERE r.role_id = v.role_id
      AND r.screen_name = v.screen_name
      AND (r.component_name = v.component_name OR (r.component_name IS NULL AND v.component_name IS NULL))
);
GO

PRINT 'seed-identity.sql complete. Login: admin / admin123 at http://localhost:4200';
GO
