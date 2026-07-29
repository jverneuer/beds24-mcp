# Beds24 API — Account (Category Index)

Account-related methods for reading account data, modifying sub-accounts, and creating new sub-accounts.

## Child files

- **[account.md](account.md)** — The three account methods: `getAccount` (returns account info, usage, and charging data), `setAccount` (modify a sub-account's enabled state, role, notes, and message), and `createAccount` (create sub-accounts with role and email routing). Includes all role and email-routing enumerations.

## Overarching topics

- Authentication (`apiKey` object, 16–64 char length, configured at SETTINGS >> ACCOUNT >> ACCOUNT ACCESS)
- getAccount (returns account info, usage data, and charging information; full schema not documented in source)
- setAccount (modify sub-accounts via `setAccount` wrapper with top-level `action` + `subaccounts` map)
- createAccount (create sub-accounts; array payload supports batch creation)
- Account roles (Admin, Read Only, Cleaner, Front Desk, Back Office, Sub Master, Channel Manager, No Cards, Cleaner Manager)
- Email routing (system emails, booking emails, booking reply-to; each with Administrator/Property/Master/Cc variants)
- Sub-account management (enabled toggle, role assignment, private notes, message to sub-account)
