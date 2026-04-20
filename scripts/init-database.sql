-- init-database.sql
-- Run once by sqlserver-init container against the sa/master connection.
-- Creates XcelerateDB, schemas, and schema-scoped users needed for
-- EXECUTE AS USER multi-tenancy (contractor-backend + xipp-backend use this).
-- Flyway migrations also create schemas with IF NOT EXISTS — fully idempotent.

-- ─────────────────────────────────────────
-- Create database
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'XcelerateDB')
BEGIN
    CREATE DATABASE XcelerateDB;
END
GO

USE XcelerateDB;
GO

-- ─────────────────────────────────────────
-- Create schemas up front so users can be
-- assigned DEFAULT_SCHEMA immediately.
-- Flyway V1.0 + V2.0 also create these with
-- IF NOT EXISTS — fully idempotent.
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'common')
    EXEC('CREATE SCHEMA [common]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'tenant1')
    EXEC('CREATE SCHEMA [tenant1]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'tenant2')
    EXEC('CREATE SCHEMA [tenant2]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'tenant3')
    EXEC('CREATE SCHEMA [tenant3]');
GO

-- ─────────────────────────────────────────
-- Schema-scoped users (no login required)
-- ─────────────────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'common' AND type = 'S')
    CREATE USER [common] WITHOUT LOGIN WITH DEFAULT_SCHEMA = common;
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'tenant1' AND type = 'S')
    CREATE USER [tenant1] WITHOUT LOGIN WITH DEFAULT_SCHEMA = tenant1;
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'tenant2' AND type = 'S')
    CREATE USER [tenant2] WITHOUT LOGIN WITH DEFAULT_SCHEMA = tenant2;
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'tenant3' AND type = 'S')
    CREATE USER [tenant3] WITHOUT LOGIN WITH DEFAULT_SCHEMA = tenant3;
GO

-- Ensure DEFAULT_SCHEMA is set correctly (idempotent update)
ALTER USER [tenant1] WITH DEFAULT_SCHEMA = tenant1;
ALTER USER [tenant2] WITH DEFAULT_SCHEMA = tenant2;
ALTER USER [tenant3] WITH DEFAULT_SCHEMA = tenant3;
GO

-- ─────────────────────────────────────────
-- Permissions
-- ─────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::[tenant1] TO [tenant1];
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::[tenant2] TO [tenant2];
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::[tenant3] TO [tenant3];
GO

-- All tenant users need read/write on common schema
-- (getuserToken() queries common.rest_comp_details while EXECUTE AS USER = 'tenantN')
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::[common] TO [tenant1];
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::[common] TO [tenant2];
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::[common] TO [tenant3];
GO

-- Tenant users need EXECUTE on dbo schema for stored procedures
-- (opportunity_list_summary_java21, task_list_summary_procedure, user_license_count, user_list_summary, etc.)
GRANT EXECUTE ON SCHEMA::[dbo] TO [tenant1];
GRANT EXECUTE ON SCHEMA::[dbo] TO [tenant2];
GRANT EXECUTE ON SCHEMA::[dbo] TO [tenant3];
GO
