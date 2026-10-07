-- V1__create_initial_multi_tenant_schema.sql
-- EventPulse Initial Multi-Tenant Schema

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Users table (tenant-scoped via organization_id)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT uq_users_organization_email UNIQUE (organization_id, email)
);

-- Index on users.organization_id for fast tenant filtering and join lookups
CREATE INDEX idx_users_organization_id ON users (organization_id);

-- Projects table (tenant-scoped via organization_id)
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_projects_organization FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT uq_projects_organization_name UNIQUE (organization_id, name)
);

-- Index on projects.organization_id for fast tenant filtering and join lookups
CREATE INDEX idx_projects_organization_id ON projects (organization_id);
