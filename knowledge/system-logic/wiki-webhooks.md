# Beds24 Webhooks + Inventory Webhooks — System Logic

> Source: Beds24 Wiki, extracted 2026-07-28 via Jina Reader.
> Covers: the Webhooks category overview, Booking Webhooks (V1 GET + V2 POST), Inventory Webhooks, and the Auto Action webhook action. Every statement cites the exact Jina URL it was fetched from. Omissions are noted — nothing is guessed.

---

## 1. Webhook Concepts (from the Webhooks category)

- "Webhooks are small messages sent from our server to yours, they can be used to trigger an action on your server in a timely manner, for example to retrieve a new booking via API." [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)
- **Timing:** webhooks are **asynchronous** and there can be a **small variable delay** between a change and a webhook being sent — an **average delay of one minute is to be expected**. They are **not an instant notification**. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)

### 1.1 The four webhook types described in the category
1. **Version 1 Booking Webhook** — uses GET; fires on new booking or modification; configured at **(SETTINGS) PROPERTIES > ACCESS**. URLs are set per property (e.g. `?property=1`); template variables like `[PROPERTYID]` are supported. Guest names may contain URL-unsafe characters that could break delivery. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)
2. **Version 2 Booking Webhook** — uses POST; can include booking data as a JSON object in the body, often eliminating the need for a follow-up API call. Technical docs: `https://api.beds24.com/v2/#/Webhooks/postWebhooks___bookings`. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)
3. **Auto Action Webhook** — fires when an auto action triggers; setup at **(SETTINGS) GUEST MANAGEMENT > AUTO ACTIONS**. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)
4. **Inventory Webhook** — fires on room inventory or price changes; setup at **(SETTINGS) MARKETPLACE > WEBHOOKS**. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)

### 1.2 What the category page did NOT cover
- No retry behavior, no signing/verification details, no specific event-type lists, and no HTTP status-code handling were present on the category page. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)

---

## 2. Booking Webhooks

### 2.1 Configuration paths
- General menu location: **SETTINGS > MARKETPLACE > WEBHOOKS**. [extracted 2026-07-28] [wiki → Booking Webhooks](https://wiki.beds24.com/index.php/Booking_Webhooks)
- API V2 access enabled via **Settings > Properties > Access > Booking webhooks**. [extracted 2026-07-28] [wiki → Booking Webhooks](https://wiki.beds24.com/index.php/Booking_Webhooks)
- Full API V2 technical docs: `https://api.beds24.com/v2/#/Webhooks/postWebhooks___bookings`. [extracted 2026-07-28] [wiki → Booking Webhooks](https://wiki.beds24.com/index.php/Booking_Webhooks)

### 2.2 Version 1 (GET) vs. Version 2 (POST) — behavioral differences
- **V1 (GET):** fires on new booking or modification. URLs are set per property using a query string like `?property=1`. Template variables such as `[PROPERTYID]` are supported. **Guest names may contain URL-unsafe characters that could break delivery** (a known GET-webhook risk). [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)
- **V2 (POST):** can include booking data as a **JSON object in the body**, often eliminating the need for a follow-up API call. [extracted 2026-07-28] [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)

### 2.3 V2 booking webhook payload content
- The **2024-05-28** changelog entry added **personal information** to V2 booking webhooks. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- The **2024-07-30** changelog entry added support for different message types on bookings: `guest`, `host`, `internalNote`, `system` (relevant to webhook message payloads). [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)

### 2.4 Omissions (not present in the fetched booking-webhook pages)
- The dedicated Booking Webhooks wiki page did **not** include specific trigger-event enumeration, full JSON payload schema, retry behavior, signing/HMAC verification, or HTTP status-code handling. For the V2 payload schema, the source points to the external docs at `api.beds24.com/v2`. [extracted 2026-07-28] [wiki → Booking Webhooks](https://wiki.beds24.com/index.php/Booking_Webhooks)

---

## 3. Inventory Webhooks

> Setup: **SETTINGS > MARKETPLACE > WEBHOOKS**. Purpose: "keep external services synchronised with minimum delay whenever changes occur." [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

### 3.1 Setup & configuration
- You must supply a **public-facing URL** to receive the requests. [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- Optional headers can be added for authentication or other needs. [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- A **"Custom Header"** field lets you inject your own data; it is transmitted as HTTP headers to the remote server. [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

### 3.2 Trigger events
The inventory webhook fires due to:
- New bookings
- Modifications to booked dates
- Cancellations
- An inventory change
- A price change on a room type
[extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

- **Non-triggering event:** "Changes to restrictions like minimum stay do not trigger a web hook." [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

### 3.3 Payload structure
- The request body carries JSON containing the roomId that triggered it. Example payload:
  `{"roomId":"123456","propId":"12345","ownerId":"1234","action":"SYNC_ROOM"}` [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- Fields present: `roomId`, `propId`, `ownerId`, `action` (value: `"SYNC_ROOM"`). [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

### 3.4 Retry behavior
- The system expects an **HTTP status code in the 200–299 range**. [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- If it does not receive one, the request is **retried multiple times across the following 30 minutes**, after which it gives up. [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

### 3.5 Difference from booking webhooks
- **Template variables cannot be used** with inventory webhooks. This webhook "operates on a room level," and template variables are "only available in the context of a booking." [extracted 2026-07-28] [wiki → Inventory Webhooks](https://wiki.beds24.com/index.php/Inventory_Webhooks)

---

## 4. Auto Action Webhook

> Auto Actions are functions run manually or automatically at a time relative to booking time, check-in date, or check-out date. **Location: SETTINGS > GUEST MANAGEMENT > AUTO ACTIONS**. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.1 Auto Action capabilities (the webhook is one action type)
Auto Actions can perform these actions (the webhook-relevant ones called out):
- Send pre-drafted emails, messages, or SMS
- Modify booking data
- Modify invoice data
- **Trigger webhooks**
- **Send HTTP POST notifications** (API action)
[extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.2 Setup mechanics
- **Add:** "Add New Action" — start empty or from a template. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Modify / Copy / Delete:** via Edit → Save / "Save as copy" / "Delete". [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Sending mode:** Manual (triggered from the MAIL/ACTION tab per booking) or Auto (fires automatically based on Trigger-tab rules). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.3 Outgoing email setup (for email-type actions)
- Required path: **SETTINGS > ACCOUNT > OUTGOING EMAIL**. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Auto sends: the email address of the account that created the Auto Action is the sender. Manual sends: uses the logged-in user's email address. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.4 Subaccount / multi-account behavior
- Auto Actions are **per-account** functions. They apply according to the "Property" setting in the Trigger tab: specific property/group, all owned by account, or all visible in account. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- For account B (where not created): only available if the property belongs to account A and has been made available in account B. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Clone function:** copies an independent clone to another account via User icon → Account Management (old panel: SUB ACCOUNT top right). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- For cross-account use: create at **Master level** with Property = "All visible in account" and ensure the master has access. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.5 Trigger conditions (exact field names)
- **Property/Room/Unit filters:** All properties / All Owned by / All visible in account / Specific property; if specific property selected, can also pick a Room id. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Can **Exclude specific Beds24 Room ids** (from Room Setup). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Can specify **Offers/Units in Room Types**. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Send/Exclude Property Groups** using GROUP KEYWORDS entered at **SETTINGS > BOOKING PAGE > MULTIPLE PROPERTIES > PROPERTY SETTINGS > GROUP KEYWORDS**. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Time settings:** Trigger Time and Trigger Event define when the action is allowed to start; once started, runs during the Time Window period, then stops. Both are relative to Trigger Event (check-in, check-out, or time of booking). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Between Booking and Check-in:** includes/excludes same-day/near-term bookings by number of days. **Check In From / Check In To:** for date-range-specific triggers. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Booking Source:** "Direct" = own website, manual entries, API imports (not channel manager). For manual-only, enter username in the "Referrer" field. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Booking Conditions:** Group Booking Trigger; Invoice Balance (used for payments/reminders). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Info Codes:** enter values to include/exclude bookings. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Booking Fields:** drop-down fields with AND/OR logic; can use Smart Template Variables for dynamic values. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.6 Action types (exact)
- **Messaging/Email:** Message API = text in PLAIN text box; Email = text in HTML box. Auto-send requires outgoing email setup. Manual-send opens in a window for editing before sending. **~2000-character limit** on this form of email generation. PDF attachments allowed: invoice or booking template. Cannot attach other files — link to a website file instead. Alias-email addresses from channels may block attachments. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **SMS:** fee per SMS when activated; only for info about current booking (no marketing/discounts/vouchers — legal); sends in account language, not booking language; truncated at 160 characters. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Booking:** execution "One time only" (default) or "Allow Repeats" within the trigger time period; emails always fire once regardless. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Booking Info:** auto add/remove info codes; used for reporting and to trigger/exclude bookings from other auto actions; enables sequencing (e.g. only send a message after another action already fired). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Invoice:** automatically assign invoice number; add/update invoice items or pending payments (pending payments can use Payment Rules from **SETTINGS > PAYMENTS > PAYMENT RULES**); invoice changes apply before mail is sent. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **API:** auto actions that send HTTP POST notifications. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Webhook:** auto actions that fire a webhook when trigger conditions are met. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.7 Same-day / near-term booking handling
- For same-day: set "Between Booking and Check-in" = 0 and 0; other actions set to 1–999 to skip. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- For near-term (e.g. 0–2 days): consolidate confirmation + check-in instructions into one message; other actions set to 3–999. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.8 Smart Logic Template Variables
- Example: `[IF=:[CURRENTDATE:{%u}]:3:yes|no]` tests if the current date is Wednesday. `%u` = ISO-8601 day (Mon=1 through Sun=7). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.9 Performance & testing
- Tests up to **1000 bookings per cycle**; larger sets process in subsequent cycles. Optimize by shrinking the testing window and refining trigger conditions. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Test tab:** shows count and list of bookings being tested; can enter a booking number to simulate the trigger with diagnostics. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Optimization tip: multiple actions (email, SMS, update booking, info code, webhook, pending payment, invoice item, assign invoice number) can be combined in a single auto action if they apply at the same time. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Cannot set a specific wall-clock time:** "Immediate + 14 hrs" means the first time the booking is checked, then batch-processed. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.10 Interaction with channels
- Auto Action emails to real email addresses go directly to the guest. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Masked email addresses route through the channel messaging API if available (currently **Booking.com, Airbnb, Expedia, VRBO**). If no messaging connection, falls back to email from the Mail & Actions tab. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- "Booking Source = Channel Manager" filter triggers only on channel-imported bookings. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

### 4.11 Troubleshooting (common non-send causes)
- Outgoing email not working (test via **SETTINGS > ACCOUNT > OUTGOING EMAIL → "Send Test Email"**). [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Auto Action not set to auto-send; invalid guest email; Plain Text box empty (required for Message API); booking not set to allow Auto Actions (Mails tab); trigger conditions not met. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Auto Action not editable: account needs write access to all properties the action applies to. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Firewall error on save: content triggering firewall (script, HTML, or SQL-injection-like text patterns such as "and"/"or"). Add content bit-by-bit to isolate, then reword. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

---

## 5. Key Field / Condition Summary (Auto Actions, exact names)

- Trigger Event: **Booking, Check-in, Check-out**
- Trigger Time: **Immediate, +/- days/hours**
- Time Window / Trigger Window
- Between Booking and Check-in
- Check In From / Check In To
- Booking Source: **Direct, Channel Manager, All**
- Referrer
- Group Booking Trigger
- Invoice Balance: **Zero, Not Zero, Any Payment made**
- Booking Status: **All not cancelled, Cancelled, Confirmed, All**
- Booking Info Codes (include/exclude)
- Send Only To Property Groups / Exclude Property Groups
- Exclude (Room ids)
- Execution: **One time only / Allow Repeats**
- Send Message types: **Booking API/Smart Email, Booking API and Email Smart, Internal Only, Guest email**
- Attachment: **Invoice Template 1 / Booking Template**
- Booking Info Code + Booking Info Text
- Invoice item: **Type (Amount), Description, Amount, per (Room), Period (one time), VAT**
- Flag Text / Flag Colour
- SMS: **Send SMS Message (Enable), Phone Number, SMS Message**
- Template variable fields in Booking Fields with AND/OR
[extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

---

## 6. Omissions / Gaps (not found in any fetched webhook source)

- **Booking Webhooks V2:** full JSON payload schema, signing/HMAC verification, retry behavior, and HTTP status-code handling were **not** present in the fetched wiki pages (the source points to external docs at `api.beds24.com/v2`). [wiki → Booking Webhooks](https://wiki.beds24.com/index.php/Booking_Webhooks)
- **Booking Webhooks V1:** precise trigger-event enumeration and retry behavior were not detailed beyond "new booking or modification." [wiki → Category:Webhooks](https://wiki.beds24.com/index.php/Category:Webhooks)
- Dedicated pages `Booking_Webhooks_V2` and `Auto_Action_Webhook` returned **empty / no content** and could not be used. [wiki → Booking Webhooks V2](https://wiki.beds24.com/index.php/Booking_Webhooks_V2)
