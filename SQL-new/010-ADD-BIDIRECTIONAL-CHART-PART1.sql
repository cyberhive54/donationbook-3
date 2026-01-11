-- Migration: Add Bidirectional Chart Card Type - Part 1
-- Date: 2026-01-11
-- Purpose: Add 'daily_collection_expense_bidirectional' card type

-- ===============================================
-- PART 1: Add New Card Type to Enum (MUST BE SEPARATE TRANSACTION)
-- ===============================================
-- Run this part first, then commit before running Part 2

-- Add new value to the enum type
ALTER TYPE analytics_card_type ADD VALUE IF NOT EXISTS 'daily_collection_expense_bidirectional';

-- IMPORTANT: Commit the transaction here before continuing
-- In Supabase SQL Editor, this happens automatically between statements

-- ===============================================
-- END OF PART 1 - COMMIT TRANSACTION
-- ===============================================
