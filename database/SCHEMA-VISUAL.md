# Three Seas Digital — Database Schema Visual Reference

> **MySQL 8.0+ | 51 Tables | 4 Views | 6 Groups**
>
> Last updated: 2026-03-01

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core CRM Tables (25 tables)](#core-crm-tables)
4. [Business Intelligence Tables (26 tables)](#business-intelligence-tables)
5. [Database Views (4 views)](#database-views)
6. [Index Reference](#index-reference)

---

## Schema Overview

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                   THREE SEAS DIGITAL DATABASE                   │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                 │
 │  CORE CRM (schema.sql)          BUSINESS INTEL (schema-bi.sql)  │
 │  ─────────────────────          ──────────────────────────────   │
 │  25 tables + 1 view alias       26 tables                       │
 │                                                                 │
 │  ● Users & Auth (3)             ● Audit System (9)              │
 │  ● Clients & CRM (8)            ● Growth Tracking (4)           │
 │  ● Sales Pipeline (5)           ● Client Interaction (3)        │
 │  ● Finance (3)                  ● Client Financials (4)         │
 │  ● Operations (4)               ● Intervention Tracking (4)     │
 │  ● Communications (2)           ● Reporting (2)                 │
 │                                                                 │
 │  VIEWS (views.sql)                                              │
 │  ─────────────────                                              │
 │  4 aggregation views for dashboards                             │
 │                                                                 │
 └─────────────────────────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram

### High-Level Relationships

```
                              ┌──────────┐
                     ┌───────→│  users   │←──────────┐
                     │        └──────────┘            │
                     │          │  │  │                │
              assigned_to   user_id │ created_by   user_id
                     │          │  │  │                │
    ┌──────────────┐ │  ┌───────┘  │  └────┐   ┌─────────────────┐
    │ appointments │─┘  │          │       │   │  activity_log   │
    └──────────────┘    │          │       │   └─────────────────┘
           │            │          │       │
  ┌────────┘     ┌──────┘    ┌─────┘       │
  │              │           │             │
  │      ┌───────────┐  ┌───────────┐  ┌───────────────┐
  │      │notifications│  │  sessions │  │ saved_filters │
  │      └───────────┘  └───────────┘  └───────────────┘
  │                          │
  │ follow_up_notes          │
  │                          │
  ▼                          ▼
                        ┌──────────┐
         ┌─────────────→│ clients  │←────────────────────────────┐
         │              └──────────┘                              │
         │                │ │ │ │ │                               │
         │     ┌──────────┘ │ │ │ └──────────────┐               │
         │     │            │ │ │                 │               │
         │     ▼            │ │ ▼                 ▼               │
         │ ┌────────────┐   │ │ ┌──────────┐  ┌──────────────┐   │
         │ │client_notes│   │ │ │ invoices │  │   projects   │   │
         │ └────────────┘   │ │ └──────────┘  └──────────────┘   │
         │                  │ │      │           │  │             │
         │ ┌────────────┐   │ │      │           │  │             │
         │ │ client_tags│   │ │      ▼           │  ▼             │
         │ └────────────┘   │ │ ┌──────────┐    │ ┌────────────┐ │
         │                  │ │ │ payments │    │ │project_tasks│ │
         │ ┌──────────────┐ │ │ └──────────┘    │ └────────────┘ │
         │ │client_docs   │ │ │                  │                │
         │ └──────────────┘ │ │                  ▼                │
         │                  │ │    ┌──────────────────────┐       │
         │ ┌──────────────┐ │ │    │ project_milestones   │       │
         │ │ time_entries │─┘ │    └──────────────────────┘       │
         │ └──────────────┘   │                                   │
         │                    │    ┌──────────────────────┐       │
         │ ┌──────────┐       │    │ project_developers   │       │
         │ │ expenses │       │    │   (users ↔ projects) │       │
         │ └──────────┘       │    └──────────────────────┘       │
         │                    │                                   │
    ┌────┴──────┐             │                                   │
    │ prospects │             │                                   │
    └───────────┘             │                                   │
         │                    │                                   │
         ▼                    │                                   │
  ┌───────────────┐           │     ┌─────────────────────┐       │
  │prospect_notes │           │     │ BI: business_audits │───────┘
  ├───────────────┤           │     └─────────────────────┘
  │prospect_docs  │           │              │
  └───────────────┘           │              ▼
                              │     ┌─────────────────────────┐
    ┌──────────┐              │     │ BI: audit_scores        │
    │  leads   │              │     │ BI: audit_recommendations│
    └──────────┘              │     │ BI: interventions       │
         │                    │     │ BI: growth_targets      │
         ▼                    │     │ BI: client_financials   │
    ┌────────────┐            │     └─────────────────────────┘
    │ lead_notes │            │
    └────────────┘            │
                              │
    ┌──────────────────┐      │
    │ business_database│      │
    ├──────────────────┤      │
    │ market_research  │      │
    ├──────────────────┤      │
    │ email_templates  │      │
    └──────────────────┘      │
    (standalone tables)       │
```

---

## Core CRM Tables

### Users & Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                          users                               │
├──────────────────┬──────────────────┬────────────────────────┤
│ Column           │ Type             │ Constraints            │
├──────────────────┼──────────────────┼────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                     │
│ username         │ VARCHAR(100)     │ UNIQUE, NOT NULL       │
│ email            │ VARCHAR(255)     │ UNIQUE, NOT NULL       │
│ name             │ VARCHAR(255)     │ NOT NULL               │
│ display_name     │ VARCHAR(255)     │                        │
│ password_hash    │ VARCHAR(255)     │ NOT NULL               │
│ role             │ ENUM             │ DEFAULT 'pending'      │
│                  │                  │ owner|admin|manager|   │
│                  │                  │ sales|accountant|it|   │
│                  │                  │ developer|analyst|     │
│                  │                  │ pending                │
│ status           │ ENUM             │ DEFAULT 'pending'      │
│                  │                  │ active|approved|       │
│                  │                  │ pending|rejected       │
│ color            │ VARCHAR(7)       │ DEFAULT '#3b82f6'      │
│ last_login       │ TIMESTAMP        │ NULLABLE               │
│ refresh_token    │ TEXT             │                        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()          │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE            │
└──────────────────┴──────────────────┴────────────────────────┘
  IDX: idx_username(username), idx_status(status)

┌─────────────────────────────────────────────────────────────┐
│                         sessions                             │
├──────────────────┬──────────────────┬────────────────────────┤
│ Column           │ Type             │ Constraints            │
├──────────────────┼──────────────────┼────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                     │
│ user_id          │ VARCHAR(36)      │ FK → users.id CASCADE  │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE│
│ token_hash       │ VARCHAR(255)     │ NOT NULL               │
│ user_type        │ ENUM             │ admin|client           │
│ expires_at       │ TIMESTAMP        │ NOT NULL               │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()          │
└──────────────────┴──────────────────┴────────────────────────┘
  IDX: idx_token(token_hash), idx_expires(expires_at)

┌─────────────────────────────────────────────────────────────┐
│                       activity_log                           │
├──────────────────┬──────────────────┬────────────────────────┤
│ Column           │ Type             │ Constraints            │
├──────────────────┼──────────────────┼────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                     │
│ action           │ VARCHAR(100)     │ NOT NULL               │
│ details          │ JSON             │                        │
│ user_id          │ VARCHAR(36)      │ FK → users.id SET NULL │
│ user_name        │ VARCHAR(255)     │ DEFAULT 'System'       │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()          │
└──────────────────┴──────────────────┴────────────────────────┘
  IDX: idx_action(action), idx_created(created_at)
```

### Clients & CRM

```
┌─────────────────────────────────────────────────────────────┐
│                         clients                              │
├──────────────────┬──────────────────┬────────────────────────┤
│ Column           │ Type             │ Constraints            │
├──────────────────┼──────────────────┼────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                     │
│ name             │ VARCHAR(255)     │ NOT NULL               │
│ email            │ VARCHAR(255)     │ UNIQUE, NOT NULL       │
│ phone            │ VARCHAR(50)      │ DEFAULT ''             │
│ password_hash    │ VARCHAR(255)     │                        │
│ service          │ VARCHAR(255)     │ DEFAULT ''             │
│ tier             │ ENUM             │ free|basic|premium|    │
│                  │                  │ enterprise             │
│ status           │ ENUM             │ active|pending|        │
│                  │                  │ archived|rejected      │
│ source           │ ENUM             │ manual|appointment|    │
│                  │                  │ signup|prospect|       │
│                  │                  │ pipeline               │
│ source_prospect_id│ VARCHAR(36)     │                        │
│ source_appointment_id│ VARCHAR(36)  │                        │
│ business_name    │ VARCHAR(255)     │ DEFAULT ''             │
│ business_address │ TEXT             │                        │
│ date_of_birth    │ DATE             │                        │
│ approved_at      │ TIMESTAMP        │ NULLABLE               │
│ approved_by      │ VARCHAR(255)     │                        │
│ archived_at      │ TIMESTAMP        │ NULLABLE               │
│ archived_by      │ VARCHAR(255)     │                        │
│ restored_at      │ TIMESTAMP        │ NULLABLE               │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()          │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE            │
└──────────────────┴──────────────────┴────────────────────────┘
  IDX: idx_email, idx_status, idx_tier, idx_status_tier, idx_created_at
  ★ Central entity — referenced by 30+ tables via FK

┌──────────────────────────────────────────────────────────────┐
│                       client_notes                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ text             │ TEXT             │ NOT NULL                │
│ author           │ VARCHAR(255)     │ DEFAULT 'System'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       client_tags                             │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ INT              │ PK AUTO_INCREMENT       │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ tag              │ VARCHAR(100)     │ NOT NULL                │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (client_id, tag)

┌──────────────────────────────────────────────────────────────┐
│                     client_documents                          │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ name             │ VARCHAR(255)     │ NOT NULL                │
│ type             │ ENUM             │ proposal|contract|      │
│                  │                  │ agreement|invoice|      │
│                  │                  │ receipt|report|intake|  │
│                  │                  │ welcome_packet|         │
│                  │                  │ bi_discovery|other      │
│ description      │ TEXT             │                         │
│ file_path        │ VARCHAR(500)     │                         │
│ file_size        │ INT              │                         │
│ mime_type        │ VARCHAR(100)     │                         │
│ uploaded_by      │ VARCHAR(255)     │ DEFAULT 'System'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      documents                                │
│               (polymorphic: client or prospect)               │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ owner_type       │ ENUM             │ client|prospect         │
│ owner_id         │ VARCHAR(36)      │ NOT NULL                │
│ name             │ VARCHAR(255)     │ NOT NULL                │
│ type             │ ENUM             │ (same as client_docs)   │
│ description      │ TEXT             │                         │
│ file_path        │ VARCHAR(500)     │                         │
│ file_type        │ VARCHAR(100)     │                         │
│ file_size        │ INT              │                         │
│ uploaded_by      │ VARCHAR(255)     │ DEFAULT 'System'        │
│ uploaded_at      │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_owner(owner_type, owner_id)

┌──────────────────────────────────────────────────────────────┐
│                   prospect_documents                          │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ prospect_id      │ VARCHAR(36)      │ FK → prospects.id CASC  │
│ name             │ VARCHAR(255)     │ NOT NULL                │
│ type             │ ENUM             │ (same as client_docs)   │
│ description      │ TEXT             │                         │
│ file_path        │ VARCHAR(500)     │                         │
│ file_size        │ INT              │                         │
│ mime_type        │ VARCHAR(100)     │                         │
│ uploaded_by      │ VARCHAR(255)     │ DEFAULT 'System'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     notifications                             │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ user_id          │ VARCHAR(36)      │ FK → users.id CASCADE   │
│ type             │ ENUM             │ warning|info|success|   │
│                  │                  │ error                   │
│ title            │ VARCHAR(255)     │ NOT NULL                │
│ message          │ TEXT             │ NOT NULL                │
│ link             │ VARCHAR(500)     │                         │
│ is_read          │ BOOLEAN          │ DEFAULT FALSE           │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### Sales Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                        leads                                  │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ business_name    │ VARCHAR(255)     │ NOT NULL                │
│ address          │ TEXT             │                         │
│ phone            │ VARCHAR(50)      │                         │
│ email            │ VARCHAR(255)     │                         │
│ type             │ VARCHAR(100)     │                         │
│ category         │ VARCHAR(100)     │                         │
│ website          │ VARCHAR(500)     │                         │
│ status           │ VARCHAR(50)      │ DEFAULT 'new'           │
│ source           │ VARCHAR(50)      │ DEFAULT 'manual'        │
│ coordinates      │ JSON             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_status, idx_business_name

┌──────────────────────────────────────────────────────────────┐
│                      lead_notes                               │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ lead_id          │ VARCHAR(36)      │ FK → leads.id CASCADE   │
│ text             │ TEXT             │ NOT NULL                │
│ author           │ VARCHAR(255)     │ DEFAULT 'System'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      prospects                                │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ name             │ VARCHAR(255)     │ NOT NULL                │
│ business_name    │ VARCHAR(255)     │                         │
│ contact_name     │ VARCHAR(255)     │                         │
│ email            │ VARCHAR(255)     │                         │
│ phone            │ VARCHAR(50)      │                         │
│ service          │ VARCHAR(255)     │                         │
│ stage            │ ENUM             │ inquiry|new|booked|     │
│                  │                  │ confirmed|negotiating|  │
│                  │                  │ closed|won|lost         │
│ deal_value       │ DECIMAL(10,2)    │ DEFAULT 0               │
│ estimated_value  │ DECIMAL(10,2)    │                         │
│ probability      │ INT              │ DEFAULT 25, CHK 0-100   │
│ expected_close   │ DATE             │                         │
│ outcome          │ ENUM             │ won|lost (NULLABLE)     │
│ loss_reason      │ ENUM             │ budget|timing|competitor│
│                  │                  │ |no-response|scope|other│
│ notes            │ TEXT             │                         │
│ revisit_date     │ DATE             │                         │
│ source           │ VARCHAR(50)      │ DEFAULT 'manual'        │
│ appointment_id   │ VARCHAR(36)      │                         │
│ closed_at        │ TIMESTAMP        │ NULLABLE                │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_stage, idx_outcome, idx_email

┌──────────────────────────────────────────────────────────────┐
│                    prospect_notes                             │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ prospect_id      │ VARCHAR(36)      │ FK → prospects.id CASC  │
│ text             │ TEXT             │ NOT NULL                │
│ author           │ VARCHAR(255)     │ DEFAULT 'System'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     appointments                              │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ name             │ VARCHAR(255)     │ NOT NULL                │
│ client_name      │ VARCHAR(255)     │                         │
│ email            │ VARCHAR(255)     │ NOT NULL                │
│ phone            │ VARCHAR(50)      │                         │
│ service          │ VARCHAR(255)     │                         │
│ message          │ TEXT             │                         │
│ type             │ VARCHAR(100)     │ DEFAULT 'consultation'  │
│ notes            │ TEXT             │                         │
│ date             │ DATE             │ NOT NULL                │
│ time             │ VARCHAR(20)      │ NOT NULL                │
│ status           │ ENUM             │ pending|confirmed|      │
│                  │                  │ cancelled|completed     │
│ assigned_to      │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ converted_to_client│ VARCHAR(36)    │                         │
│ follow_up_status │ VARCHAR(50)      │                         │
│ follow_up_date   │ DATE             │                         │
│ follow_up_priority│ ENUM            │ low|medium|high         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_date, idx_status, idx_assigned, idx_assigned_date, idx_status_date

┌──────────────────────────────────────────────────────────────┐
│                    follow_up_notes                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ appointment_id   │ VARCHAR(36)      │ FK → appointments CASC  │
│ text             │ TEXT             │ NOT NULL                │
│ author           │ VARCHAR(255)     │ DEFAULT 'System'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘
  VIEW ALIAS: appointment_notes → follow_up_notes
```

### Finance

```
┌──────────────────────────────────────────────────────────────┐
│                       invoices                                │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ title            │ VARCHAR(255)     │ NOT NULL                │
│ amount           │ DECIMAL(10,2)    │ NOT NULL, CHK >= 0      │
│ status           │ ENUM             │ unpaid|paid|overdue|    │
│                  │                  │ cancelled|pending       │
│ due_date         │ DATE             │                         │
│ description      │ TEXT             │                         │
│ recurring        │ BOOLEAN          │ DEFAULT FALSE           │
│ frequency        │ ENUM             │ weekly|biweekly|monthly │
│                  │                  │ |quarterly|yearly       │
│ next_due_date    │ DATE             │                         │
│ parent_invoice_id│ VARCHAR(36)      │                         │
│ paid_at          │ TIMESTAMP        │ NULLABLE                │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_client, idx_status, idx_due_date, idx_client_status

┌──────────────────────────────────────────────────────────────┐
│                       payments                                │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ invoice_id       │ VARCHAR(36)      │ FK → invoices.id NULL   │
│ client_name      │ VARCHAR(255)     │                         │
│ service          │ VARCHAR(255)     │                         │
│ service_tier     │ VARCHAR(50)      │                         │
│ amount           │ DECIMAL(10,2)    │ NOT NULL, CHK > 0       │
│ method           │ VARCHAR(50)      │ DEFAULT 'invoice'       │
│ status           │ ENUM             │ completed|pending|      │
│                  │                  │ refunded                │
│ notes            │ TEXT             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_client, idx_created, idx_invoice

┌──────────────────────────────────────────────────────────────┐
│                       expenses                                │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ category         │ ENUM             │ wages|fuel|food|        │
│                  │                  │ meetings|trips|receipts │
│ amount           │ DECIMAL(10,2)    │ NOT NULL, CHK >= 0      │
│ description      │ TEXT             │                         │
│ date             │ DATE             │ NOT NULL                │
│ receipt_path     │ VARCHAR(500)     │                         │
│ receipt_name     │ VARCHAR(255)     │                         │
│ vendor           │ VARCHAR(255)     │                         │
│ notes            │ TEXT             │                         │
│ created_by       │ VARCHAR(255)     │ DEFAULT 'Unknown'       │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_category, idx_date, idx_category_date
  (standalone — no FK)
```

### Operations

```
┌──────────────────────────────────────────────────────────────┐
│                       projects                                │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ title            │ VARCHAR(255)     │ NOT NULL                │
│ name             │ VARCHAR(255)     │                         │
│ description      │ TEXT             │                         │
│ status           │ ENUM             │ planning|in-progress|   │
│                  │                  │ review|completed|       │
│                  │                  │ archived                │
│ progress         │ INT              │ DEFAULT 0, CHK 0-100    │
│ start_date       │ DATE             │                         │
│ due_date         │ DATE             │                         │
│ end_date         │ DATE             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_client, idx_status, idx_client_status

┌──────────────────────────────────────────────────────────────┐
│                   project_developers                          │
│                    (junction table)                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ project_id       │ VARCHAR(36)      │ PK, FK → projects CASC  │
│ user_id          │ VARCHAR(36)      │ PK, FK → users CASCADE  │
└──────────────────┴──────────────────┴─────────────────────────┘
  Composite PK: (project_id, user_id)

┌──────────────────────────────────────────────────────────────┐
│                     project_tasks                             │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ project_id       │ VARCHAR(36)      │ FK → projects.id CASC   │
│ title            │ VARCHAR(255)     │ NOT NULL                │
│ description      │ TEXT             │                         │
│ status           │ ENUM             │ todo|in-progress|       │
│                  │                  │ review|done             │
│ goal             │ TEXT             │                         │
│ assignee         │ VARCHAR(36)      │                         │
│ assigned_to      │ VARCHAR(36)      │                         │
│ due_date         │ DATE             │                         │
│ priority         │ ENUM             │ low|normal|high|urgent  │
│ sort_order       │ INT              │ DEFAULT 0               │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  project_milestones                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ project_id       │ VARCHAR(36)      │ FK → projects.id CASC   │
│ title            │ VARCHAR(255)     │ NOT NULL                │
│ description      │ TEXT             │                         │
│ due_date         │ DATE             │                         │
│ completed        │ BOOLEAN          │ DEFAULT FALSE           │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     time_entries                              │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id NULL    │
│ project_id       │ VARCHAR(36)      │ FK → projects.id NULL   │
│ task_id          │ VARCHAR(36)      │                         │
│ user_id          │ VARCHAR(36)      │                         │
│ user_name        │ VARCHAR(255)     │                         │
│ description      │ TEXT             │                         │
│ hours            │ DECIMAL(5,2)     │ NOT NULL, CHK > 0       │
│ date             │ DATE             │ NOT NULL                │
│ billable         │ BOOLEAN          │ DEFAULT TRUE            │
│ billed           │ BOOLEAN          │ DEFAULT FALSE           │
│ billed_at        │ TIMESTAMP        │ NULLABLE                │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_client, idx_project, idx_date, idx_project_date, idx_user
```

### Communications & Research

```
┌──────────────────────────────────────────────────────────────┐
│                    email_templates                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ name             │ VARCHAR(255)     │ NOT NULL                │
│ subject          │ VARCHAR(500)     │ NOT NULL                │
│ body             │ TEXT             │ NOT NULL                │
│ category         │ ENUM             │ invoice|appointment|    │
│                  │                  │ follow-up|project|      │
│                  │                  │ general                 │
│ is_default       │ BOOLEAN          │ DEFAULT FALSE           │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  (standalone — no FK)

┌──────────────────────────────────────────────────────────────┐
│                   business_database                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ lookup_key       │ VARCHAR(500)     │ UNIQUE                  │
│ name             │ VARCHAR(255)     │                         │
│ business_name    │ VARCHAR(255)     │                         │
│ address          │ TEXT             │                         │
│ phone            │ VARCHAR(50)      │                         │
│ email            │ VARCHAR(255)     │                         │
│ website          │ VARCHAR(500)     │                         │
│ type             │ VARCHAR(100)     │                         │
│ category         │ VARCHAR(100)     │                         │
│ owner            │ VARCHAR(255)     │                         │
│ notes            │ TEXT             │                         │
│ coordinates      │ JSON             │                         │
│ enrichment       │ JSON             │                         │
│ intel            │ JSON             │                         │
│ source           │ VARCHAR(50)      │ DEFAULT 'manual'        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  (standalone — no FK)

┌──────────────────────────────────────────────────────────────┐
│                    market_research                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ lookup_key       │ VARCHAR(500)     │ UNIQUE                  │
│ location         │ VARCHAR(255)     │                         │
│ data             │ JSON             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  (standalone — no FK)
```

---

## Business Intelligence Tables

### Group 1: Business Audit System (9 tables)

```
 ┌───────────────────────┐
 │  audit_categories     │←──────────────────────────────────────┐
 └───────────────────────┘                                       │
        │           │                                            │
        ▼           ▼                                            │
 ┌────────────┐ ┌─────────────────────────┐                      │
 │audit_sub-  │ │recommendation_templates │                      │
 │criteria    │ └─────────────────────────┘                      │
 └────────────┘            │                                     │
        │                  │                                     │
        │     ┌────────────┘                                     │
        │     │                                                  │
        │     │    ┌──────────────────────┐    ┌──────────┐      │
        │     │    │  business_audits     │←───│ clients  │      │
        │     │    └──────────────────────┘    └──────────┘      │
        │     │         │          │                              │
        │     │         ▼          │                              │
        │     │    ┌──────────────┐│                              │
        │     │    │audit_scores  ││                              │
        │     │    └──────────────┘│                              │
        │     │         │          │                              │
        ▼     │         │          ▼                              │
 ┌────────────┴────┐    │    ┌───────────────────────┐           │
 │audit_subcriteria│    │    │audit_recommendations  │───────────┘
 │_scores          │    │    └───────────────────────┘
 └─────────────────┘    │              │
                        │              ▼
                        │    ┌───────────────────────┐
                        │    │recommendation_threads │
                        │    └───────────────────────┘
                        │
                        │    ┌───────────────────────┐
                        └───→│  business_intakes     │
                             └───────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│                    audit_categories                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ name             │ VARCHAR(100)     │ NOT NULL                │
│ slug             │ VARCHAR(100)     │ UNIQUE, NOT NULL        │
│ description      │ TEXT             │                         │
│ is_base          │ BOOLEAN          │ DEFAULT FALSE           │
│ default_weight   │ DECIMAL(5,2)     │ DEFAULT 0               │
│ max_score        │ DECIMAL(3,1)     │ DEFAULT 10.0            │
│ display_order    │ INT              │ DEFAULT 0               │
│ sort_order       │ INT              │ DEFAULT 0               │
│ icon             │ VARCHAR(50)      │                         │
│ color            │ VARCHAR(7)       │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   audit_subcriteria                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ category_id      │ VARCHAR(36)      │ FK → audit_categories   │
│ name             │ VARCHAR(200)     │ NOT NULL                │
│ description      │ TEXT             │                         │
│ max_score        │ DECIMAL(3,1)     │ DEFAULT 10.0            │
│ display_order    │ INT              │ DEFAULT 0               │
│ sort_order       │ INT              │ DEFAULT 0               │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                recommendation_templates                      │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ title            │ VARCHAR(300)     │ NOT NULL                │
│ category_id      │ VARCHAR(36)      │ FK → audit_categories   │
│ category         │ VARCHAR(100)     │                         │
│ trigger_condition│ TEXT             │                         │
│ description      │ TEXT             │                         │
│ expected_outcome │ TEXT             │                         │
│ estimated_cost_min│ DECIMAL(10,2)   │                         │
│ estimated_cost_max│ DECIMAL(10,2)   │                         │
│ estimated_timeline│ VARCHAR(100)    │                         │
│ linked_service   │ VARCHAR(100)     │                         │
│ priority         │ ENUM             │ critical|high|med|low   │
│ impact           │ ENUM             │ high|medium|low         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    business_intakes                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ industry         │ VARCHAR(100)     │                         │
│ sub_industry     │ VARCHAR(100)     │                         │
│ years_in_operation│ INT             │                         │
│ employee_count_range│ VARCHAR(50)   │                         │
│ annual_revenue_range│ VARCHAR(50)   │                         │
│ target_market    │ TEXT             │                         │
│ business_model   │ VARCHAR(50)      │                         │
│ competitors      │ JSON             │                         │
│ current_website_url│ VARCHAR(500)   │                         │
│ hosting_provider │ VARCHAR(100)     │                         │
│ tech_stack       │ VARCHAR(200)     │                         │
│ domain_age_years │ INT              │                         │
│ has_ssl          │ BOOLEAN          │ DEFAULT FALSE           │
│ is_mobile_responsive│ BOOLEAN      │ DEFAULT FALSE           │
│ last_website_update│ DATE           │                         │
│ social_platforms │ JSON             │                         │
│ email_marketing_tool│ VARCHAR(100)  │                         │
│ paid_advertising │ JSON             │                         │
│ content_marketing│ JSON             │                         │
│ seo_efforts      │ VARCHAR(50)      │                         │
│ pain_points      │ JSON             │                         │
│ goals            │ JSON             │                         │
│ previous_agency  │ VARCHAR(50)      │                         │
│ budget_range     │ VARCHAR(100)     │                         │
│ timeline_expectations│ VARCHAR(200) │                         │
│ decision_makers  │ JSON             │                         │
│ notes            │ TEXT             │                         │
│ created_by       │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    business_audits                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ version          │ INT              │ NOT NULL, DEFAULT 1     │
│ audit_type       │ ENUM             │ initial|quarterly|      │
│                  │                  │ milestone|ad_hoc        │
│ overall_score    │ DECIMAL(3,1)     │ CHK 0-10               │
│ status           │ ENUM             │ draft|in_progress|      │
│                  │                  │ published               │
│ audit_date       │ DATE             │                         │
│ published_at     │ TIMESTAMP        │ NULLABLE                │
│ audited_by       │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ created_by       │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ notes            │ TEXT             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (client_id, version)

┌──────────────────────────────────────────────────────────────┐
│                      audit_scores                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ audit_id         │ VARCHAR(36)      │ FK → business_audits    │
│ category_id      │ VARCHAR(36)      │ FK → audit_categories   │
│ score            │ DECIMAL(3,1)     │ NOT NULL, CHK 0-10      │
│ weight           │ DECIMAL(5,2)     │                         │
│ internal_notes   │ TEXT             │                         │
│ client_summary   │ TEXT             │                         │
│ evidence_urls    │ JSON             │                         │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (audit_id, category_id)

┌──────────────────────────────────────────────────────────────┐
│                 audit_subcriteria_scores                      │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ audit_score_id   │ VARCHAR(36)      │ FK → audit_scores       │
│ subcriteria_id   │ VARCHAR(36)      │ FK → audit_subcriteria  │
│ score            │ DECIMAL(3,1)     │ NOT NULL, CHK 0-10      │
│ notes            │ TEXT             │                         │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (audit_score_id, subcriteria_id)

┌──────────────────────────────────────────────────────────────┐
│                  audit_recommendations                        │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ audit_id         │ VARCHAR(36)      │ FK → business_audits    │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ template_id      │ VARCHAR(36)      │ FK → rec_templates NULL │
│ category_id      │ VARCHAR(36)      │ FK → audit_categories   │
│ title            │ VARCHAR(300)     │ NOT NULL                │
│ description      │ TEXT             │ NOT NULL                │
│ expected_outcome │ TEXT             │                         │
│ priority         │ ENUM             │ critical|high|med|low   │
│ impact           │ ENUM             │ high|medium|low         │
│ estimated_cost_min│ DECIMAL(10,2)   │                         │
│ estimated_cost_max│ DECIMAL(10,2)   │                         │
│ estimated_timeline│ VARCHAR(100)    │                         │
│ linked_service   │ VARCHAR(100)     │                         │
│ status           │ ENUM             │ proposed|pending|       │
│                  │                  │ accepted|in_progress|   │
│                  │                  │ completed|declined      │
│ client_response  │ TEXT             │                         │
│ client_responded_at│ TIMESTAMP      │ NULLABLE                │
│ completed_at     │ TIMESTAMP        │ NULLABLE                │
│ decline_reason   │ TEXT             │                         │
│ dependencies     │ JSON             │                         │
│ display_order    │ INT              │ DEFAULT 0               │
│ created_by       │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  IDX: idx_client_status, idx_audit

┌──────────────────────────────────────────────────────────────┐
│                 recommendation_threads                        │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ recommendation_id│ VARCHAR(36)      │ FK → audit_recs CASCADE │
│ author_type      │ ENUM             │ admin|client            │
│ author_id        │ VARCHAR(36)      │ NOT NULL                │
│ message          │ TEXT             │ NOT NULL                │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### Group 2: Growth Tracking (4 tables)

```
 ┌──────────┐
 │ clients  │
 └──────────┘
      │
      ├──────────────────────────────┐
      │                              │
      ▼                              ▼
 ┌─────────────────┐    ┌────────────────────────────┐
 │ growth_targets  │    │ data_source_connections    │
 └─────────────────┘    └────────────────────────────┘
      │                              │
      ▼                              ▼
 ┌─────────────────┐    ┌────────────────────────────┐
 │growth_snapshots │    │ data_sync_log             │
 └─────────────────┘    └────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│                     growth_targets                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ metric_name      │ VARCHAR(200)     │ NOT NULL                │
│ metric_slug      │ VARCHAR(200)     │ NOT NULL                │
│ baseline_value   │ DECIMAL(15,2)    │ NOT NULL                │
│ target_value     │ DECIMAL(15,2)    │ NOT NULL                │
│ current_value    │ DECIMAL(15,2)    │                         │
│ unit             │ VARCHAR(50)      │                         │
│ target_date      │ DATE             │ NOT NULL                │
│ data_source      │ ENUM             │ google_analytics|       │
│                  │                  │ search_console|pagespeed│
│                  │                  │ |facebook|instagram|    │
│                  │                  │ google_business|twitter|│
│                  │                  │ linkedin|mailchimp|     │
│                  │                  │ manual                  │
│ source_config    │ JSON             │                         │
│ measurement_freq │ ENUM             │ daily|weekly|biweekly|  │
│                  │                  │ monthly                 │
│ status           │ ENUM             │ active|achieved|missed| │
│                  │                  │ paused                  │
│ achieved_at      │ TIMESTAMP        │ NULLABLE                │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   growth_snapshots                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ target_id        │ VARCHAR(36)      │ FK → growth_targets     │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ value            │ DECIMAL(15,2)    │ NOT NULL                │
│ previous_value   │ DECIMAL(15,2)    │                         │
│ change_percent   │ DECIMAL(8,2)     │                         │
│ progress_percent │ DECIMAL(8,2)     │ CHK 0-100              │
│ source           │ ENUM             │ automated|manual        │
│ source_raw       │ JSON             │                         │
│ admin_note       │ TEXT             │                         │
│ is_override      │ BOOLEAN          │ DEFAULT FALSE           │
│ recorded_at      │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                data_source_connections                        │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ source_type      │ ENUM             │ google_analytics|       │
│                  │                  │ search_console|pagespeed│
│                  │                  │ |facebook|instagram|    │
│                  │                  │ google_business|twitter|│
│                  │                  │ linkedin|mailchimp      │
│ status           │ ENUM             │ connected|disconnected| │
│                  │                  │ error|pending           │
│ access_token     │ TEXT             │                         │
│ refresh_token    │ TEXT             │                         │
│ token_expires_at │ TIMESTAMP        │ NULLABLE                │
│ account_id       │ VARCHAR(200)     │                         │
│ account_name     │ VARCHAR(200)     │                         │
│ config           │ JSON             │                         │
│ last_sync_at     │ TIMESTAMP        │ NULLABLE                │
│ last_error       │ TEXT             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (client_id, source_type)

┌──────────────────────────────────────────────────────────────┐
│                     data_sync_log                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ connection_id    │ VARCHAR(36)      │ FK → data_source_conn   │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ status           │ ENUM             │ success|partial|failed  │
│ metrics_synced   │ INT              │ DEFAULT 0               │
│ error_message    │ TEXT             │                         │
│ duration_ms      │ INT              │                         │
│ started_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ completed_at     │ TIMESTAMP        │ NULLABLE                │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### Group 3: Client Interaction (3 tables)

```
┌──────────────────────────────────────────────────────────────┐
│                    service_requests                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ recommendation_id│ VARCHAR(36)      │ FK → audit_recs NULL    │
│ title            │ VARCHAR(300)     │ NOT NULL                │
│ description      │ TEXT             │                         │
│ budget_range     │ VARCHAR(100)     │                         │
│ urgency          │ ENUM             │ low|medium|high|asap    │
│ status           │ ENUM             │ submitted|reviewing|    │
│                  │                  │ quoted|approved|        │
│                  │                  │ in_progress|completed|  │
│                  │                  │ cancelled               │
│ admin_response   │ TEXT             │                         │
│ quoted_amount    │ DECIMAL(10,2)    │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    client_feedback                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ target_type      │ ENUM             │ project|milestone|      │
│                  │                  │ recommendation|general  │
│ target_id        │ VARCHAR(36)      │                         │
│ rating           │ INT              │ CHK 1-5                 │
│ comment          │ TEXT             │                         │
│ admin_response   │ TEXT             │                         │
│ responded_at     │ TIMESTAMP        │ NULLABLE                │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               client_notification_prefs                      │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│                  │                  │ UNIQUE                  │
│ email_digest     │ ENUM             │ none|daily|weekly       │
│ notify_new_scores│ BOOLEAN          │ DEFAULT TRUE            │
│ notify_new_recs  │ BOOLEAN          │ DEFAULT TRUE            │
│ notify_metrics   │ BOOLEAN          │ DEFAULT TRUE            │
│ notify_invoices  │ BOOLEAN          │ DEFAULT TRUE            │
│ notify_documents │ BOOLEAN          │ DEFAULT TRUE            │
│ notify_projects  │ BOOLEAN          │ DEFAULT TRUE            │
│ notify_admin_msgs│ BOOLEAN          │ DEFAULT TRUE            │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### Group 4: Client Financials (4 tables)

```
 ┌──────────┐
 │ clients  │
 └──────────┘
      │
      ├─────────────────────────────────────┐
      │                                     │
      ▼                                     ▼
 ┌──────────────────────┐          ┌────────────────┐
 │ client_financials    │          │ client_ad_spend│
 └──────────────────────┘          └────────────────┘
      │            │
      ▼            ▼
 ┌────────────┐ ┌───────────────────┐
 │ revenue    │ │ revenue           │
 │ _channels  │ │ _products         │
 └────────────┘ └───────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│                   client_financials                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ period_year      │ INT              │ NOT NULL                │
│ period_month     │ INT              │ NOT NULL, CHK 1-12      │
│ gross_revenue    │ DECIMAL(15,2)    │                         │
│ net_revenue      │ DECIMAL(15,2)    │                         │
│ online_revenue   │ DECIMAL(15,2)    │                         │
│ offline_revenue  │ DECIMAL(15,2)    │                         │
│ new_customer_rev │ DECIMAL(15,2)    │                         │
│ returning_cust_rev│ DECIMAL(15,2)   │                         │
│ transaction_count│ INT              │                         │
│ avg_order_value  │ DECIMAL(10,2)    │                         │
│ cogs             │ DECIMAL(15,2)    │                         │
│ total_mktg_spend │ DECIMAL(15,2)    │                         │
│ our_fees         │ DECIMAL(15,2)    │                         │
│ total_expenses   │ DECIMAL(15,2)    │                         │
│ gross_profit     │ DECIMAL(15,2)    │                         │
│ net_profit       │ DECIMAL(15,2)    │                         │
│ profit_margin    │ DECIMAL(8,4)     │                         │
│ new_customers    │ INT              │                         │
│ total_customers  │ INT              │                         │
│ cust_acq_cost    │ DECIMAL(10,2)    │                         │
│ data_completeness│ ENUM             │ full|partial|estimated  │
│ source           │ ENUM             │ manual|automated|       │
│                  │                  │ imported|mixed          │
│ notes            │ TEXT             │                         │
│ entered_by       │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (client_id, period_year, period_month)

┌──────────────────────────────────────────────────────────────┐
│                client_revenue_channels                        │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ financial_id     │ VARCHAR(36)      │ FK → client_financials  │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ channel_name     │ VARCHAR(100)     │ NOT NULL                │
│ revenue          │ DECIMAL(15,2)    │ NOT NULL                │
│ transaction_count│ INT              │                         │
│ conversion_rate  │ DECIMAL(8,4)     │                         │
│ cost             │ DECIMAL(15,2)    │                         │
│ roi              │ DECIMAL(8,2)     │                         │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                client_revenue_products                        │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ financial_id     │ VARCHAR(36)      │ FK → client_financials  │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ product_name     │ VARCHAR(200)     │ NOT NULL                │
│ revenue          │ DECIMAL(15,2)    │ NOT NULL                │
│ units_sold       │ INT              │                         │
│ average_price    │ DECIMAL(10,2)    │                         │
│ margin_percent   │ DECIMAL(8,4)     │                         │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    client_ad_spend                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ platform         │ ENUM             │ google_ads|meta_ads|    │
│                  │                  │ tiktok_ads|linkedin_ads|│
│                  │                  │ twitter_ads|bing_ads|   │
│                  │                  │ other                   │
│ period_year      │ INT              │ NOT NULL                │
│ period_month     │ INT              │ NOT NULL                │
│ spend            │ DECIMAL(15,2)    │ NOT NULL                │
│ impressions      │ BIGINT           │                         │
│ clicks           │ INT              │                         │
│ conversions      │ INT              │                         │
│ conversion_value │ DECIMAL(15,2)    │                         │
│ ctr              │ DECIMAL(8,4)     │                         │
│ cpc              │ DECIMAL(8,2)     │                         │
│ cpa              │ DECIMAL(10,2)    │                         │
│ roas             │ DECIMAL(8,2)     │                         │
│ source           │ ENUM             │ manual|automated        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘
  UNIQUE: (client_id, platform, period_year, period_month)
```

### Group 5: Intervention Tracking (4 tables)

```
 ┌──────────┐   ┌───────────┐   ┌──────────────────────┐
 │ clients  │   │ projects  │   │ audit_recommendations│
 └──────────┘   └───────────┘   └──────────────────────┘
      │              │                    │
      └──────┬───────┘────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │  interventions   │
      └──────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌─────────┐ ┌────────┐ ┌────────────────────┐
    │metrics  │ │alerts  │ │snapshots           │
    └─────────┘ └────────┘ └────────────────────┘
         │
         ▼
    ┌─────────────────────────┐
    │intervention_snapshots   │
    └─────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│                     interventions                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ recommendation_id│ VARCHAR(36)      │ FK → audit_recs NULL    │
│ project_id       │ VARCHAR(36)      │ FK → projects.id NULL   │
│ title            │ VARCHAR(300)     │ NOT NULL                │
│ description      │ TEXT             │                         │
│ intervention_type│ ENUM             │ website|seo|social|     │
│                  │                  │ advertising|email|      │
│                  │                  │ chatbot|branding|       │
│                  │                  │ content|technical|      │
│                  │                  │ performance|analytics|  │
│                  │                  │ other                   │
│ status           │ ENUM             │ planned|in_progress|    │
│                  │                  │ completed|paused|       │
│                  │                  │ launched|measuring|     │
│                  │                  │ measured|archived       │
│ planned_date     │ DATE             │                         │
│ implementation_date│ DATE           │                         │
│ measurement_start│ DATE             │                         │
│ measurement_end  │ DATE             │                         │
│ measurement_days │ INT              │ DEFAULT 90              │
│ cost_to_client   │ DECIMAL(10,2)    │                         │
│ our_cost         │ DECIMAL(10,2)    │                         │
│ overall_roi      │ DECIMAL(10,2)    │                         │
│ revenue_impact   │ DECIMAL(15,2)    │                         │
│ payback_days     │ INT              │                         │
│ effectiveness    │ ENUM             │ pending|exceptional|    │
│                  │                  │ strong|moderate|weak|   │
│                  │                  │ negative                │
│ before_screenshot│ TEXT             │                         │
│ after_screenshot │ TEXT             │                         │
│ report_url       │ TEXT             │                         │
│ created_by       │ VARCHAR(36)      │ FK → users.id SET NULL  │
│ notes            │ TEXT             │                         │
│ client_summary   │ TEXT             │                         │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  intervention_metrics                         │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ intervention_id  │ VARCHAR(36)      │ FK → interventions CASC │
│ metric_name      │ VARCHAR(200)     │ NOT NULL                │
│ metric_slug      │ VARCHAR(200)     │ NOT NULL                │
│ unit             │ VARCHAR(50)      │                         │
│ baseline_value   │ DECIMAL(15,2)    │ NOT NULL                │
│ baseline_period_start│ DATE         │                         │
│ baseline_period_end│ DATE           │                         │
│ baseline_source  │ TEXT             │                         │
│ target_value     │ DECIMAL(15,2)    │                         │
│ current_value    │ DECIMAL(15,2)    │                         │
│ change_absolute  │ DECIMAL(15,2)    │                         │
│ change_percent   │ DECIMAL(10,2)    │                         │
│ attribution      │ ENUM             │ primary|contributing|   │
│                  │                  │ indirect|negative       │
│ attribution_pct  │ DECIMAL(5,2)     │ DEFAULT 100, CHK 0-100  │
│ growth_target_id │ VARCHAR(36)      │ FK → growth_targets NULL│
│ data_source      │ ENUM             │ google_analytics|       │
│                  │                  │ search_console|pagespeed│
│                  │                  │ |facebook|instagram|    │
│                  │                  │ google_business|        │
│                  │                  │ financial|manual        │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
│ updated_at       │ TIMESTAMP        │ AUTO UPDATE             │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                intervention_snapshots                         │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ intervention_metric_id│ VARCHAR(36) │ FK → intv_metrics CASC  │
│ intervention_id  │ VARCHAR(36)      │ FK → interventions CASC │
│ value            │ DECIMAL(15,2)    │ NOT NULL                │
│ change_from_base │ DECIMAL(10,2)    │                         │
│ days_since_launch│ INT              │                         │
│ checkpoint       │ ENUM             │ 7d|14d|30d|60d|90d|    │
│                  │                  │ 180d|custom             │
│ source           │ ENUM             │ automated|manual        │
│ notes            │ TEXT             │                         │
│ recorded_at      │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  intervention_alerts                          │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ intervention_id  │ VARCHAR(36)      │ FK → interventions CASC │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ alert_type       │ ENUM             │ target_exceeded|        │
│                  │                  │ negative_trend|high_roi|│
│                  │                  │ measurement_complete|   │
│                  │                  │ all_positive|           │
│                  │                  │ engagement_drop         │
│ message          │ TEXT             │ NOT NULL                │
│ severity         │ ENUM             │ info|warning|success|   │
│                  │                  │ critical                │
│ is_read_admin    │ BOOLEAN          │ DEFAULT FALSE           │
│ is_read_client   │ BOOLEAN          │ DEFAULT FALSE           │
│ sent_to_client   │ BOOLEAN          │ DEFAULT FALSE           │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### Group 6: Reporting (2 tables)

```
┌──────────────────────────────────────────────────────────────┐
│                     saved_filters                            │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ user_id          │ VARCHAR(36)      │ FK → users.id CASCADE   │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ user_type        │ ENUM             │ admin|client            │
│ name             │ VARCHAR(200)     │ NOT NULL                │
│ section          │ VARCHAR(100)     │ NOT NULL                │
│ filter_config    │ JSON             │ NOT NULL                │
│ is_default       │ BOOLEAN          │ DEFAULT FALSE           │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   scheduled_reports                           │
├──────────────────┬──────────────────┬─────────────────────────┤
│ id               │ VARCHAR(36)      │ PK                      │
│ client_id        │ VARCHAR(36)      │ FK → clients.id CASCADE │
│ report_type      │ ENUM             │ scorecard|financial_    │
│                  │                  │ summary|growth_report|  │
│                  │                  │ intervention_report|    │
│                  │                  │ full_dashboard          │
│ frequency        │ ENUM             │ weekly|biweekly|        │
│                  │                  │ monthly|quarterly       │
│ format           │ ENUM             │ pdf|csv|xlsx            │
│ recipients       │ JSON             │                         │
│ last_sent_at     │ TIMESTAMP        │ NULLABLE                │
│ next_send_at     │ TIMESTAMP        │ NULLABLE                │
│ is_active        │ BOOLEAN          │ DEFAULT TRUE            │
│ created_at       │ TIMESTAMP        │ DEFAULT NOW()           │
└──────────────────┴──────────────────┴─────────────────────────┘
```

---

## Database Views

### v_client_health_summary
> One row per client with latest audit score, recommendation counts, intervention stats.
> **Used by:** AuditQueue, HealthOverview, ClientsDatabaseTab, Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       v_client_health_summary                          │
├──────────────────────────────┬──────────────────────────────────────────┤
│ Column                       │ Source                                   │
├──────────────────────────────┼──────────────────────────────────────────┤
│ client_id                    │ clients.id                               │
│ client_name                  │ clients.name                             │
│ client_email                 │ clients.email                            │
│ client_tier                  │ clients.tier                             │
│ client_status                │ clients.status                           │
│ latest_audit_id              │ business_audits.id (MAX version)         │
│ latest_audit_date            │ business_audits.audit_date               │
│ latest_overall_score         │ business_audits.overall_score            │
│ audit_status                 │ business_audits.status                   │
│ total_recommendations        │ COUNT(audit_recommendations)             │
│ accepted_recommendations     │ SUM(accepted/in_progress/completed)      │
│ completed_recommendations    │ SUM(completed)                           │
│ total_interventions          │ COUNT(interventions)                     │
│ completed_interventions      │ SUM(completed interventions)             │
│ avg_intervention_roi         │ AVG(interventions.overall_roi)           │
└──────────────────────────────┴──────────────────────────────────────────┘
  JOINs: clients → business_audits → audit_recommendations → interventions
```

### v_client_financial_summary
> Lifetime financial aggregation per client.
> **Used by:** ClientFinancials, ClientAnalytics, Portal Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     v_client_financial_summary                          │
├──────────────────────────────┬──────────────────────────────────────────┤
│ client_id                    │ GROUP BY key                              │
│ total_months                 │ COUNT(*)                                  │
│ total_gross_revenue          │ SUM(gross_revenue)                        │
│ total_net_revenue            │ SUM(net_revenue)                          │
│ total_expenses               │ SUM(total_expenses)                       │
│ total_gross_profit           │ SUM(gross_profit)                         │
│ total_net_profit             │ SUM(net_profit)                           │
│ avg_monthly_revenue          │ AVG(gross_revenue)                        │
│ avg_profit_margin            │ AVG(profit_margin)                        │
│ total_new_customers          │ SUM(new_customers)                        │
│ total_marketing_spend        │ SUM(total_marketing_spend)                │
│ latest_period_code           │ MAX(year*100 + month)                     │
└──────────────────────────────┴──────────────────────────────────────────┘
  Source: client_financials GROUP BY client_id
```

### v_intervention_roi_summary
> Per-client intervention aggregation with ROI and effectiveness.
> **Used by:** InterventionTracker, ClientAnalytics Section H

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    v_intervention_roi_summary                           │
├──────────────────────────────┬──────────────────────────────────────────┤
│ client_id                    │ GROUP BY key                              │
│ total_interventions          │ COUNT(*)                                  │
│ completed_count              │ SUM(completed)                            │
│ in_progress_count            │ SUM(in_progress)                          │
│ planned_count                │ SUM(planned)                              │
│ avg_roi                      │ AVG(completed ROI)                        │
│ total_client_investment      │ SUM(cost_to_client)                       │
│ total_our_cost               │ SUM(our_cost)                             │
│ total_monthly_revenue_impact │ SUM(revenue_impact_monthly)               │
│ avg_effectiveness_score      │ AVG(rating mapped to 1-5)                 │
└──────────────────────────────┴──────────────────────────────────────────┘
  Source: interventions GROUP BY client_id
```

### v_audit_queue_status
> Drives the Audit Queue UI with traffic-light scoring.
> **Used by:** AuditQueue, HealthOverview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      v_audit_queue_status                               │
├──────────────────────────────┬──────────────────────────────────────────┤
│ client_id                    │ clients.id                               │
│ client_name                  │ clients.name                             │
│ client_tier                  │ clients.tier                             │
│ client_status                │ clients.status                           │
│ latest_audit_date            │ business_audits.audit_date               │
│ days_since_last_audit        │ DATEDIFF(NOW(), audit_date)              │
│ latest_overall_score         │ business_audits.overall_score            │
│ traffic_light                │ green(≥7) / amber(≥4) / red(<4) / none  │
│ audit_count                  │ COUNT(business_audits)                   │
│ latest_audit_status          │ business_audits.status                   │
└──────────────────────────────┴──────────────────────────────────────────┘
  FILTER: clients.status IN ('active', 'approved')
```

### View Alias

```
appointment_notes  →  SELECT * FROM follow_up_notes
```

---

## Index Reference

### Core CRM Indexes

| Table | Index | Columns |
|-------|-------|---------|
| users | idx_username | username |
| users | idx_status | status |
| clients | idx_email | email |
| clients | idx_status | status |
| clients | idx_tier | tier |
| clients | idx_status_tier | status, tier |
| clients | idx_created_at | created_at |
| invoices | idx_client | client_id |
| invoices | idx_status | status |
| invoices | idx_due_date | due_date |
| invoices | idx_client_status | client_id, status |
| payments | idx_client | client_id |
| payments | idx_created | created_at |
| payments | idx_invoice | invoice_id |
| projects | idx_client | client_id |
| projects | idx_status | status |
| projects | idx_client_status | client_id, status |
| appointments | idx_date | date |
| appointments | idx_status | status |
| appointments | idx_assigned | assigned_to |
| appointments | idx_assigned_date | assigned_to, date |
| appointments | idx_status_date | status, date |
| time_entries | idx_client | client_id |
| time_entries | idx_project | project_id |
| time_entries | idx_date | date |
| time_entries | idx_project_date | project_id, date |
| time_entries | idx_user | user_id |
| leads | idx_status | status |
| leads | idx_business_name | business_name |
| prospects | idx_stage | stage |
| prospects | idx_outcome | outcome |
| prospects | idx_email | email |
| expenses | idx_category | category |
| expenses | idx_date | date |
| expenses | idx_category_date | category, date |
| sessions | idx_token | token_hash |
| sessions | idx_expires | expires_at |

### BI Indexes

| Table | Index | Columns |
|-------|-------|---------|
| business_audits | idx_client_version | client_id, version |
| business_audits | idx_status | status |
| audit_scores | idx_audit_category | audit_id, category_id |
| audit_recommendations | idx_client_status | client_id, status |
| audit_recommendations | idx_audit | audit_id |
| growth_targets | idx_client_status | client_id, status |
| growth_snapshots | idx_target_date | target_id, recorded_at |
| client_financials | idx_client_period | client_id, year, month |
| client_ad_spend | idx_client_period | client_id, year, month |
| interventions | idx_client_status | client_id, status |
| intervention_metrics | idx_intervention | intervention_id |
| intervention_snapshots | idx_intervention_date | intervention_id, recorded_at |
| intervention_snapshots | idx_metric | intervention_metric_id |
| intervention_alerts | idx_client | client_id |

---

## FK Dependency Order (Installation Sequence)

```
Phase 1 (no dependencies):
  users, clients, leads, prospects, expenses,
  email_templates, business_database, market_research,
  audit_categories

Phase 2 (depends on Phase 1):
  sessions, activity_log, notifications,
  client_notes, client_tags, client_documents,
  lead_notes, prospect_notes, prospect_documents,
  appointments, invoices, projects,
  audit_subcriteria, recommendation_templates,
  business_intakes, business_audits,
  growth_targets, data_source_connections,
  client_financials, client_ad_spend,
  client_feedback, client_notification_prefs,
  scheduled_reports, saved_filters

Phase 3 (depends on Phase 2):
  follow_up_notes, payments,
  project_developers, project_tasks, project_milestones,
  time_entries, documents,
  audit_scores, audit_recommendations,
  growth_snapshots, data_sync_log,
  client_revenue_channels, client_revenue_products,
  interventions, service_requests

Phase 4 (depends on Phase 3):
  audit_subcriteria_scores,
  recommendation_threads,
  intervention_metrics, intervention_alerts

Phase 5 (depends on Phase 4):
  intervention_snapshots
```

---

*Generated from `database/schema.sql`, `database/schema-bi.sql`, and `database/views.sql`*
