# SQL Migration Instructions for New Analytics Cards

## Issue Resolution

The original `009-ADD-NEW-ANALYTICS-CARDS.sql` failed because PostgreSQL requires enum values to be committed before they can be used in the same transaction.

## Solution: Two-Part Migration

### Step 1: Run Part 1 (Add Enum Values)

```sql
-- File: 009-ADD-NEW-ANALYTICS-CARDS-PART1.sql
-- This adds the new enum values
```

**In Supabase SQL Editor:**
1. Open `009-ADD-NEW-ANALYTICS-CARDS-PART1.sql`
2. Copy and paste the entire content
3. Click "Run"
4. Wait for success message

### Step 2: Run Part 2 (Use New Values)

```sql
-- File: 009-ADD-NEW-ANALYTICS-CARDS-PART2.sql
-- This uses the enum values added in Part 1
```

**In Supabase SQL Editor:**
1. Open `009-ADD-NEW-ANALYTICS-CARDS-PART2.sql`
2. Copy and paste the entire content
3. Click "Run"
4. Wait for success message

## What Gets Added

Two new analytics card types:
- `average_donation_per_donor` - Shows average donation statistics
- `collection_vs_expense_comparison` - Line chart comparing collections vs expenses

## Verification

After running both parts, verify with:

```sql
SELECT f.code, ac.card_type, ac.is_visible, ac.sort_order 
FROM analytics_cards ac
JOIN festivals f ON ac.festival_id = f.id
WHERE ac.card_type IN ('average_donation_per_donor', 'collection_vs_expense_comparison')
ORDER BY f.code, ac.sort_order;
```

You should see these two new cards for all existing festivals.

## Why Two Parts?

PostgreSQL's enum type implementation requires:
1. Enum values must be added and committed
2. Only then can they be used in INSERT statements

This is a PostgreSQL limitation, not a bug in the code.
