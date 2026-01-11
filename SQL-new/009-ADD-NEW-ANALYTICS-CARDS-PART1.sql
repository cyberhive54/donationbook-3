-- Migration: Add New Analytics Card Types
-- Date: 2026-01-10
-- Purpose: Add 'average_donation_per_donor' and 'collection_vs_expense_comparison' card types

-- ===============================================
-- PART 1: Add New Card Types to Enum (MUST BE SEPARATE TRANSACTION)
-- ===============================================
-- Run this part first, then commit before running Part 2

-- Add new values to the enum type
ALTER TYPE analytics_card_type ADD VALUE IF NOT EXISTS 'average_donation_per_donor';
ALTER TYPE analytics_card_type ADD VALUE IF NOT EXISTS 'collection_vs_expense_comparison';

-- IMPORTANT: Commit the transaction here before continuing
-- In Supabase SQL Editor, this happens automatically between statements
-- In a script, you must COMMIT; here

-- ===============================================
-- END OF PART 1 - COMMIT TRANSACTION
-- ===============================================
