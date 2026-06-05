# Dashboard Earnings & Purchases Fix

This document summarizes the changes made to fix the issue where sold ticket prices and earnings were not appearing correctly on the User Dashboard.

## Changes Overview

### 1. Hook: `usePurchasedTickets`
**File:** `src/hooks/useTickets.ts`
- Added a new hook `usePurchasedTickets` to fetch all tickets where the current user is the `buyer_id`. This allows the dashboard to accurately count user purchases.

### 2. User Dashboard Enhancements
**File:** `src/pages/UserDashboard.tsx`
- **Earnings Logic:** Refactored the `totalEarnings` calculation. It now sums the value of all sold quantities across all user listings: `(ticket.price * (ticket.quantity - ticket.quantity_available))`. This ensures that both automatic sales and manually marked sales are reflected in the earnings stat.
- **Purchases Logic:** Updated the "Purchases" stat to use the new `usePurchasedTickets` hook for an accurate count.
- **Manual Sale Sync:** Updated `handleMarkSold` and `handleSellAllActive` to set `quantity_available` to `0` when tickets are marked as sold. This keeps the earnings calculation in sync with the ticket status.
- **UI Improvements:** Improved contrast for sold ticket prices in the dashboard list (changed from `text-gray-500` to `text-gray-300`) for better visibility.

### 3. Order History Integration
**File:** `src/pages/TicketDetailsPage.tsx`
- **Order Creation:** Updated the `handleAcceptRequest` function to automatically insert a record into the `orders` table when a sale is completed via the wallet system. This ensures these transactions appear in the "Recent Orders" table on the dashboard and in the payment history.

## Impact
Users will now see real-time updates to their "Earnings" and "Purchases" stats on the dashboard. Manual sales are correctly accounted for, and a full audit trail is created in the orders history for every completed transaction.
