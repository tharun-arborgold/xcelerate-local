-- seed-demo.sql  (Level 3 — Demo Business Data)
-- Idempotent. Runs AFTER seed-identity.sql. Simulates a real contractor customer:
--   - 3 contacts (homeowner, adjuster, property manager)
--   - 1 master job (Water damage, linked to homeowner contact)
--   - 2 files/subjobs (26-1-W Water, 26-1-R Reconstruction)
--   - 1 opportunity (Mold referral, linked to adjuster)
--
-- Depends on: seed-identity.sql (company 1, location 1, user 1 must exist)
--
-- To apply to running DB:
--   ./stack seed <slot> --custom
--
-- To include on infra reset:
--   ./stack infra reset --custom

USE XcelerateDB;
GO

-- ═══════════════════════════════════════════════════════════════
-- CONTACTS (CRM)
-- ═══════════════════════════════════════════════════════════════

-- Contact 1: Homeowner (person)
IF NOT EXISTS (SELECT 1 FROM tenant1.contact_details WHERE contact_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.contact_details ON;
    INSERT INTO tenant1.contact_details (
        contact_id, contact_hash_code,
        contact_first_name, contact_last_name,
        contact_address1, city, state, zip,
        contact_mobile_phone, contact_email,
        contact_type, contact_status,
        contact_entered_by, contact_entered_datetime,
        contact_updated_by, contact_updated_datetime,
        source
    ) VALUES (
        1, 'CONT001',
        'James', 'Mitchell',
        '742 Evergreen Terrace', 'Springfield', 'IL', '62701',
        '5551234567', 'james.mitchell@email.com',
        'People', 'Active',
        1, GETDATE(), 1, GETDATE(),
        'System'
    );
    SET IDENTITY_INSERT tenant1.contact_details OFF;
END
GO

-- Contact 2: Insurance Adjuster (person)
IF NOT EXISTS (SELECT 1 FROM tenant1.contact_details WHERE contact_id = 2)
BEGIN
    SET IDENTITY_INSERT tenant1.contact_details ON;
    INSERT INTO tenant1.contact_details (
        contact_id, contact_hash_code,
        contact_first_name, contact_last_name,
        contact_work_phone, contact_email,
        contact_type, contact_status,
        contact_entered_by, contact_entered_datetime,
        contact_updated_by, contact_updated_datetime,
        source
    ) VALUES (
        2, 'CONT002',
        'Sarah', 'Chen',
        '5559876543', 'sarah.chen@nationwide.com',
        'People', 'Active',
        1, GETDATE(), 1, GETDATE(),
        'System'
    );
    SET IDENTITY_INSERT tenant1.contact_details OFF;
END
GO

-- Contact 3: Property Management Company (organization)
IF NOT EXISTS (SELECT 1 FROM tenant1.contact_details WHERE contact_id = 3)
BEGIN
    SET IDENTITY_INSERT tenant1.contact_details ON;
    INSERT INTO tenant1.contact_details (
        contact_id, contact_hash_code,
        contact_first_name, contact_last_name,
        contact_address1, city, state, zip,
        contact_work_phone, contact_email,
        contact_type, contact_status,
        contact_entered_by, contact_entered_datetime,
        contact_updated_by, contact_updated_datetime,
        source
    ) VALUES (
        3, 'CONT003',
        'Greenfield', 'Property Management',
        '100 Commerce Blvd', 'Springfield', 'IL', '62702',
        '5558885500', 'info@greenfieldpm.com',
        'Organization', 'Active',
        1, GETDATE(), 1, GETDATE(),
        'System'
    );
    SET IDENTITY_INSERT tenant1.contact_details OFF;
END
GO

-- ═══════════════════════════════════════════════════════════════
-- MASTER JOB
-- ═══════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM tenant1.mast_num_details WHERE mast_num_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.mast_num_details ON;
    INSERT INTO tenant1.mast_num_details (
        mast_num_id, master_name,
        mast_num_hash, mast_num_code,
        rest_comp_location_id, company_id,
        customer_id, customer_type,
        first_name, last_name, mobile, email,
        loss_address, loss_address_city, loss_address_state, loss_address_zip,
        is_billing_address_same,
        property_type, damage_type, restoration_type,
        is_insured, responsible_party,
        status, source,
        created_by, created_datetime, updated_by, updated_datetime,
        loss_date, master_job_received_date,
        sms_broadcasting_enabled
    ) VALUES (
        1, '742 Evergreen Terrace - Water Damage',
        'MAST001', 'MJ-0001',
        1, 1,
        1, 'Individual',
        'James', 'Mitchell', '5551234567', 'james.mitchell@email.com',
        '742 Evergreen Terrace', 'Springfield', 'IL', '62701',
        'Yes',
        'Residential', 'Water', 'EMS',
        'Yes', 'Insurance',
        'Open', 'System',
        1, GETDATE(), 1, GETDATE(),
        DATEADD(day, -14, GETDATE()), DATEADD(day, -14, GETDATE()),
        0
    );
    SET IDENTITY_INSERT tenant1.mast_num_details OFF;
END
GO

-- Link homeowner contact to master job
IF NOT EXISTS (SELECT 1 FROM tenant1.mast_num_contacts WHERE mast_num_id = 1 AND contact_id = 1)
BEGIN
    INSERT INTO tenant1.mast_num_contacts (mast_num_id, contact_id, contact_type, source)
    VALUES (1, 1, 'Insured', 'System');
END
GO

-- ═══════════════════════════════════════════════════════════════
-- FILES / SUBJOBS
-- ═══════════════════════════════════════════════════════════════

-- File 1: Water EMS job
IF NOT EXISTS (SELECT 1 FROM tenant1.job_details WHERE job_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.job_details ON;
    INSERT INTO tenant1.job_details (
        job_id, mast_num_id, rest_comp_location_id,
        job_hash_code, job_code,
        job_type, current_job_status, master_number_copy,
        first_name, last_name, mobile, email,
        loss_address, loss_address_city, loss_address_state, loss_address_zip,
        is_billing_address_same, is_insured,
        property_type, company_id, link_to_master,
        created_by, created_datetime, updated_by, updated_datetime,
        loss_date, source
    ) VALUES (
        1, 1, 1,
        'JOB001', '26-1-W',
        'Water', 'Open', 'MJ-0001',
        'James', 'Mitchell', '5551234567', 'james.mitchell@email.com',
        '742 Evergreen Terrace', 'Springfield', 'IL', '62701',
        'Yes', 'Yes',
        'Residential', 1, 'Yes',
        1, GETDATE(), 1, GETDATE(),
        DATEADD(day, -14, GETDATE()), 'System'
    );
    SET IDENTITY_INSERT tenant1.job_details OFF;
END
GO

-- File 2: Reconstruction job
IF NOT EXISTS (SELECT 1 FROM tenant1.job_details WHERE job_id = 2)
BEGIN
    SET IDENTITY_INSERT tenant1.job_details ON;
    INSERT INTO tenant1.job_details (
        job_id, mast_num_id, rest_comp_location_id,
        job_hash_code, job_code,
        job_type, current_job_status, master_number_copy,
        first_name, last_name, mobile, email,
        loss_address, loss_address_city, loss_address_state, loss_address_zip,
        is_billing_address_same, is_insured,
        property_type, company_id, link_to_master,
        created_by, created_datetime, updated_by, updated_datetime,
        loss_date, source
    ) VALUES (
        2, 1, 1,
        'JOB002', '26-1-R',
        'Reconstruction', 'Open', 'MJ-0001',
        'James', 'Mitchell', '5551234567', 'james.mitchell@email.com',
        '742 Evergreen Terrace', 'Springfield', 'IL', '62701',
        'Yes', 'Yes',
        'Residential', 1, 'Yes',
        1, GETDATE(), 1, GETDATE(),
        DATEADD(day, -14, GETDATE()), 'System'
    );
    SET IDENTITY_INSERT tenant1.job_details OFF;
END
GO

-- ═══════════════════════════════════════════════════════════════
-- OPPORTUNITY
-- ═══════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM tenant1.opportunity_details WHERE opportunity_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.opportunity_details ON;
    INSERT INTO tenant1.opportunity_details (
        opportunity_id,
        opportunity_hash_code,
        rest_comp_location_id,
        opportunity_name,
        first_name, last_name, mobile, email,
        current_opportunity_status,
        job_type,
        referred_source,
        company_id,
        created_by, created_datetime,
        updated_by, updated_datetime,
        source
    ) VALUES (
        1,
        'OPP001',
        1,
        'Mold Inspection - Adjuster Referral',
        'Robert', 'Davis', '5552223333', 'robert.davis@email.com',
        'New',
        'Mold',
        'Referral',
        1,
        1, GETDATE(),
        1, GETDATE(),
        'System'
    );
    SET IDENTITY_INSERT tenant1.opportunity_details OFF;
END
GO

-- ═══════════════════════════════════════════════════════════════
-- COMMON TASKS (master task templates)
-- ═══════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM tenant1.m_tasks WHERE task_id = 1)
BEGIN
    SET IDENTITY_INSERT tenant1.m_tasks ON;
    INSERT INTO tenant1.m_tasks (task_id, task_code, task_name, status, source, created_by, created_datetime, updated_by, updated_datetime)
    VALUES (1, 'T-001', 'Initial Inspection', 'Active', 'System', 1, GETDATE(), 1, GETDATE());
    SET IDENTITY_INSERT tenant1.m_tasks OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM tenant1.m_tasks WHERE task_id = 2)
BEGIN
    SET IDENTITY_INSERT tenant1.m_tasks ON;
    INSERT INTO tenant1.m_tasks (task_id, task_code, task_name, status, source, created_by, created_datetime, updated_by, updated_datetime)
    VALUES (2, 'T-002', 'Moisture Readings', 'Active', 'System', 1, GETDATE(), 1, GETDATE());
    SET IDENTITY_INSERT tenant1.m_tasks OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM tenant1.m_tasks WHERE task_id = 3)
BEGIN
    SET IDENTITY_INSERT tenant1.m_tasks ON;
    INSERT INTO tenant1.m_tasks (task_id, task_code, task_name, status, source, created_by, created_datetime, updated_by, updated_datetime)
    VALUES (3, 'T-003', 'Photo Documentation', 'Active', 'System', 1, GETDATE(), 1, GETDATE());
    SET IDENTITY_INSERT tenant1.m_tasks OFF;
END
GO

PRINT 'Custom seed data complete.';
PRINT '  Contacts: 3 (James Mitchell homeowner, Sarah Chen adjuster, Greenfield PM org)';
PRINT '  Master Jobs: 1 (MJ-0001 Water Damage @ 742 Evergreen Terrace)';
PRINT '  Files: 2 (26-1-W Water, 26-1-R Reconstruction)';
PRINT '  Opportunities: 1 (Mold Inspection referral)';
PRINT '  Task templates: 3';
GO
