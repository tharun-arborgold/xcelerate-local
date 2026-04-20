-- seed-template.sql  (Level 1 — Provisioning Template)
-- Data that is IDENTICAL across every tenant when provisioned.
-- These are system defaults that site-provisioner seeds from a fixed template —
-- not specific to any customer. No company ID, no user credentials.
--
-- Depends on: Flyway migrations (V1.29 seeds common.job_type_categories,
--             V2.25 already inserted 16 XCEL-6474 types as In-Active)
-- Followed by: seed-identity.sql

USE XcelerateDB;
GO

-- ─────────────────────────────────────────
-- tenant1.m_roles  (default roles — same template for every tenant)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.m_roles WHERE role_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.m_roles ON;
    INSERT INTO tenant1.m_roles (role_id, role_name, status, source)
    VALUES (1, 'Admin', 'Active', 'System');
    SET IDENTITY_INSERT tenant1.m_roles OFF;
END
GO

-- ─────────────────────────────────────────
-- tenant1.m_divisions  (default divisions — same template for every tenant)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tenant1.m_divisions WHERE division_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.m_divisions ON;
    INSERT INTO tenant1.m_divisions (division_id, division_name, status, source)
    VALUES (1, 'General', 'Active', 'System');
    SET IDENTITY_INSERT tenant1.m_divisions OFF;
END
GO

-- ─────────────────────────────────────────
-- tenant1.file_types  (original 11 legacy job types — same for every tenant)
--
-- These pre-date Flyway and are seeded from the site-provisioner template.
-- V2.25 UPDATEs existing rows (workflow_type/category_id/icon) but does NOT
-- insert them — so they must exist before V2.25 runs, or be seeded here.
-- The 16 XCEL-6474 types are inserted by V2.25 as In-Active (correct default).
--
-- category_id resolved by JOIN on common.job_type_categories (V1.29 seeds these).
-- ─────────────────────────────────────────
DECLARE @ftOffset INT = ISNULL((SELECT MAX(file_type_order) FROM tenant1.file_types), 0);

INSERT INTO tenant1.file_types (
    file_type, suffix, status, source, budget_percentage, file_type_order,
    workflow_type, category_id, file_type_icon,
    created_by, created_datetime, updated_by, updated_datetime
)
SELECT
    v.file_type, v.suffix, 'Active', 'System', 50.0,
    @ftOffset + v.sort_order,
    v.workflow_type, c.category_id, v.file_type_icon,
    1, GETDATE(), 1, GETDATE()
FROM (VALUES
    ('Water',             'W',   'EMS',    'Emergency Services',            'flood-fill',            1),
    ('Reconstruction',    'R',   'NONEMS', 'Structure & Building Services', 'building-fill',         2),
    ('Content',           'C',   'NONEMS', 'Contents Restoration',          'box-1-fill',            3),
    ('Mold',              'M',   'NONEMS', 'Environmental / Hazardous',     'microscope-fill',       4),
    ('Asbestos',          'A',   'NONEMS', 'Environmental / Hazardous',     'radioactive-alert-line',5),
    ('Board Up',          'B',   'EMS',    'Emergency Services',            'door-closed-fill',      6),
    ('Consulting',        'CST', 'NONEMS', 'Other',                         'briefcase-fill',        7),
    ('Bio',               'BIO', 'EMS',    'Environmental / Hazardous',     'hazard-line',           8),
    ('Structure Cleaning','S',   'NONEMS', 'Cleaning Services',             'cleaning-bucket-line',  9),
    ('Roofing',           'RF',  'NONEMS', 'Structure & Building Services', 'roof-top-line',         10),
    ('Other',             'O',   'NONEMS', 'Other',                         'more-fill',             11)
) AS v(file_type, suffix, workflow_type, category_name, file_type_icon, sort_order)
INNER JOIN common.job_type_categories c ON c.name = v.category_name
WHERE NOT EXISTS (
    SELECT 1 FROM tenant1.file_types t WHERE LTRIM(RTRIM(t.file_type)) = v.file_type
);
GO

-- ─────────────────────────────────────────
-- tenant1.m_kpi + tenant1.job_kpi_targets
-- KPI definitions and default targets (same for every tenant at provisioning).
-- Values sourced from production KPI configuration.
-- ─────────────────────────────────────────

-- Insert KPI definitions
INSERT INTO tenant1.m_kpi (kpi_name, uom, status, source, created_by, created_datetime, updated_by, updated_datetime)
SELECT v.kpi_name, v.uom, 'Active', 'System', 1, GETDATE(), 1, GETDATE()
FROM (VALUES
    ('Cycle Time',                   'Days'),
    ('WIP Time',                     'Days'),
    ('Total Final Invoice Time',     'Days'),
    ('Days to Start',                'Days'),
    ('Estimate Bid Time',            'Hours'),
    ('Final Estimate Upload Time',   'Hours'),
    ('Onsite Arrival Time',          'Hours'),
    ('Target Completion Accuracy',   'Days'),
    ('Contact Customer Time',        'Hours'),
    ('Days to Sign',                 'Days'),
    ('Final Invoice Delay Time',     'Hours'),
    ('Gross Profit %',               '%'),
    ('Labor Efficiency Ratio',       NULL)
) AS v(kpi_name, uom)
WHERE NOT EXISTS (
    SELECT 1 FROM tenant1.m_kpi k WHERE k.kpi_name = v.kpi_name
);
GO

-- Insert KPI targets, referencing the kpi_id from m_kpi
INSERT INTO tenant1.job_kpi_targets (
    kpi_id, kpi_name, uom,
    water, recon, content, mold, asbestos, board_up, consulting, bio, structure_cleaning, others, roofing,
    created_by, created_datetime, updated_by, updated_datetime, source
)
SELECT
    m.kpi_id, m.kpi_name, m.uom,
    v.water, v.recon, v.content, v.mold, v.asbestos, v.board_up, v.consulting, v.bio, v.structure_cleaning,
    NULL,   -- others (not in standard template)
    NULL,   -- roofing (not in standard template)
    1, GETDATE(), 1, GETDATE(), 'System'
FROM tenant1.m_kpi m
JOIN (VALUES
    ('Cycle Time',                  10.0,  70.0,  90.0,  7.0,  7.0,  3.0,  5.0,  3.0,  14.0),
    ('WIP Time',                     5.0,  60.0,  70.0,  3.0,  3.0,  1.0,  2.0,  1.0,   7.0),
    ('Total Final Invoice Time',     2.0,   2.0,   2.0,  2.0,  2.0,  2.0,  2.0,  2.0,   2.0),
    ('Days to Start',                0.1,  14.0,   3.0,  3.0,  3.0,  0.1,  1.0,  0.1,   3.0),
    ('Estimate Bid Time',           24.0,  72.0,  24.0, 24.0, 24.0, 24.0, 24.0, 24.0,  24.0),
    ('Final Estimate Upload Time',  48.0,  24.0,  24.0, 24.0, 24.0, 24.0, 24.0, 24.0,  24.0),
    ('Onsite Arrival Time',          4.0,  24.0,  24.0, 24.0, 24.0,  4.0, 48.0, 24.0,  48.0),
    ('Target Completion Accuracy',   1.0,  14.0,  14.0,  1.0,  1.0,  1.0,  1.0,  1.0,   3.0),
    ('Contact Customer Time',        0.2,   6.0,   4.0,  4.0,  4.0,  0.2,  6.0,  2.0,   4.0),
    ('Days to Sign',                 0.1,   3.0,   3.0,  3.0,  3.0,  0.1,  0.1,  0.1,   3.0),
    ('Final Invoice Delay Time',    24.0,  24.0,  24.0, 24.0, 24.0, 24.0, 24.0, 24.0,  24.0),
    ('Gross Profit %',              70.0,  40.0,  60.0, 60.0, 60.0, 75.0, 75.0, 75.0,  55.0),
    ('Labor Efficiency Ratio',       4.0,   4.0,   4.0,  4.0,  4.0,  4.0,  4.0,  4.0,   4.0)
) AS v(kpi_name, water, recon, content, mold, asbestos, board_up, consulting, bio, structure_cleaning)
ON m.kpi_name = v.kpi_name
WHERE NOT EXISTS (
    SELECT 1 FROM tenant1.job_kpi_targets t WHERE t.kpi_id = m.kpi_id
);
GO

-- ─────────────────────────────────────────
-- common.m_screens  (top-level screen definitions for Permissions grid)
-- Consumed by MScreenDetailsServiceImpl.getRolesMScreenDetails()
--   → findByStatusOrderByScreenOrder('Active')
-- ─────────────────────────────────────────
INSERT INTO common.m_screens (screen_name, status, source, created_by, created_datetime, updated_by, updated_datetime, screen_order)
SELECT v.screen_name, 'Active', 'System', 1, GETDATE(), 1, GETDATE(), v.screen_order
FROM (VALUES
    ('Dashboard',        1),
    ('New Master Job',   2),
    ('Opportunities',    3),
    ('Master Jobs',      4),
    ('Files',            5),
    ('File Details',     6),
    ('Tasks',            7),
    ('Scheduler',        8),
    ('CRM',              9),
    ('Admin',           10),
    ('Reports',         11),
    ('Time Tracking',   12),
    ('QuickBooks',      13),
    ('Integrations',    14),
    ('Training Library',15),
    ('Netsuite',        16)
) AS v(screen_name, screen_order)
WHERE NOT EXISTS (
    SELECT 1 FROM common.m_screens s WHERE s.screen_name = v.screen_name
);
GO

-- ─────────────────────────────────────────
-- common.m_role_screens  (sub-component definitions for expandable rows in Permissions grid)
-- Consumed by: findByStatus('Active') then filtered by screen_name
-- ─────────────────────────────────────────
INSERT INTO common.m_role_screens (screen_name, component_name, status, source, created_by, created_datetime, updated_by, updated_datetime)
SELECT v.screen_name, v.component_name, 'Active', 'System', 1, GETDATE(), 1, GETDATE()
FROM (VALUES
    -- Self-referencing sub-rows (top-level screens that also appear as their own child)
    ('Dashboard',        'Dashboard'),
    ('New Master Job',   'New Master Job'),
    ('Opportunities',    'Opportunities'),
    ('Reports',          'Reports'),
    ('Training Library', 'Training Library'),
    ('Netsuite',         'NetSuite'),
    -- Admin sub-components
    ('Admin', 'TaskCreation'),
    ('Admin', 'UserCreation'),
    ('Admin', 'KpiTargets'),
    ('Admin', 'Configurable'),
    ('Admin', 'ProgramType'),
    ('Admin', 'Companysetup'),
    ('Admin', 'Integrations'),
    ('Admin', 'Customizedstatus'),
    ('Admin', 'Permission'),
    ('Admin', 'Forms'),
    ('Admin', 'File Types'),
    ('Admin', 'TaskTemplate'),
    ('Admin', 'TaskPack'),
    ('Admin', 'TaskPackAssignment'),
    -- CRM sub-components
    ('CRM', 'People'),
    ('CRM', 'Organization'),
    ('CRM', 'Activities'),
    ('CRM', 'Leaderboards'),
    ('CRM', 'Notes'),
    ('CRM', 'Activities Beta'),
    ('CRM', 'Edit Sales Rep'),
    -- Master Jobs sub-components
    ('Master Jobs', 'My Open'),
    ('Master Jobs', 'All Open'),
    ('Master Jobs', 'All Master Jobs'),
    -- Files sub-components
    ('Files', 'My Open'),
    ('Files', 'All Open'),
    ('Files', 'All Files'),
    -- File Details sub-components
    ('File Details', 'Notes'),
    ('File Details', 'Documents'),
    ('File Details', 'Financial'),
    ('File Details', 'Tasks'),
    ('File Details', 'Warranty'),
    ('File Details', 'Time Tracking'),
    ('File Details', 'Schedule'),
    ('File Details', 'Edit Notes'),
    ('File Details', 'Work Orders'),
    -- Tasks sub-components
    ('Tasks', 'My Tasks'),
    ('Tasks', 'All Open Tasks'),
    ('Tasks', 'All Tasks'),
    ('Tasks', 'Revision Required Tasks'),
    -- Scheduler sub-components
    ('Scheduler', 'By File'),
    ('Scheduler', 'By Employee'),
    -- Time Tracking sub-components
    ('Time Tracking', 'PayrollAdmin'),
    ('Time Tracking', 'PayrollTimeCard'),
    ('Time Tracking', 'PayrollDetailCost'),
    ('Time Tracking', 'Payroll Time Details'),
    ('Time Tracking', 'TimeCardApprovals'),
    -- QuickBooks sub-components
    ('QuickBooks', 'QuickBooks'),
    -- Integrations sub-components
    ('Integrations', 'QuickBooks'),
    ('Integrations', 'Encircle'),
    ('Integrations', 'NetSuite')
) AS v(screen_name, component_name)
WHERE NOT EXISTS (
    SELECT 1 FROM common.m_role_screens r
    WHERE r.screen_name = v.screen_name AND r.component_name = v.component_name
);
GO

PRINT 'seed-template.sql complete: roles, divisions, 11 legacy job types, 13 KPI targets, 16 screens, 57 sub-components';
GO
