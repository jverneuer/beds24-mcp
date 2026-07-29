# Beds24 Booking Lifecycle — System Logic Facts

> Facts extracted from the Beds24 wiki (via Jina Reader). Every factual statement ends with its source URL and extraction date.
> If a source omits a detail, it is stated as unknown — nothing is guessed.

---

## 1. How bookings enter the system

- Bookings enter Beds24 in three ways: (1) channel manager imports from booking channels (OTAs), (2) online bookings from the booking page (entered automatically), (3) manual entry of offline bookings. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- Manual bookings are added in the Calendar via the "Add booking" button or imported from a `.csv` file under `SETTINGS > PROPERTIES`. [extracted 2026-07-28] [wiki → Booking.com: Import Properties from Booking.com to Beds24](https://wiki.beds24.com/index.php/Booking.com:_Import_Properties_from_Booking.com_to_Beds24)
- Upcoming bookings can be automatically imported from Booking.com, Airbnb, and Expedia via `SETTINGS > CHANNEL MANAGER` when the channel manager is set up but not yet activated. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)

---

## 2. Availability logic (how inventory is consumed)

- Availability is calculated **per room** based on existing bookings and prices set. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- Inventory is defined by: rooms set up under `SETTINGS > PROPERTIES > ROOMS > SETUP` **minus** current bookings. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- **If there are no prices for a certain date the system shows no availability.** To show inventory the system needs valid prices (Daily Price or Fixed Price); otherwise it shows 0. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- The inventory cannot be set higher than total rooms minus existing bookings. It can be adjusted quickly in the CALENDAR via the "Inventory" row (rooms remaining to sell). [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- The channel manager closes a room on any date lacking a valid price for sending. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)

---

## 3. Overbooking protection

- Configured at `SETTINGS > PROPERTIES > ROOMS > SETUP`; recommended value is **"Property"**. [extracted 2026-07-28] [wiki → Overbooking](https://wiki.beds24.com/index.php/Overbooking)
- With the **Property** setting, a two-part check applies:
  1. Bookings within an individual room are capped at that room's quantity.
  2. Bookings across the entire property are capped at the total room count for the property.
- A room gets **closed** once total bookings across all rooms reach or exceed total rooms in the property — this can be triggered by an overbooking that originated in a *different* room. [extracted 2026-07-28] [wiki → Overbooking](https://wiki.beds24.com/index.php/Overbooking)
- **Hidden rooms are excluded** from property availability calculations. [extracted 2026-07-28] [wiki → Overbooking](https://wiki.beds24.com/index.php/Overbooking)
- **Key distinction:** having more than one booking assigned to the same unit is NOT classified as an overbooking. The system tries to place a guest in a single available room first; if none is available for the full stay it assigns to the room type anyway (so per-date inventory computes accurately), resulting in a need to shuffle guests but not a true overbooking. [extracted 2026-07-28] [wiki → Overbooking](https://wiki.beds24.com/index.php/Overbooking)
- **Signals:** negative inventory in the CALENDAR indicates an overbooking; a warning appears in "Potential Issues" on the DASHBOARD and under SUPPORT. Positive/zero inventory means no overbooking. [extracted 2026-07-28] [wiki → Overbooking](https://wiki.beds24.com/index.php/Overbooking)
- Connecting one physical room more than once to a booking channel risks overbookings (warning in the room-type combination guide). [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)

---

## 4. Booking statuses and lifecycle

- The wiki's `Booking_Status_Lifecycle` and `Booking_status` pages were empty/404 at extraction time; status definitions are therefore sourced from channel-specific pages and the setup guide. [extracted 2026-07-28]
- **Booking.com connection status lifecycle** (channel side): XML: Being built → XML: Ready to check → XML: Ready to Open → Open/Bookable → Autoclosed (zero availability) → Closed. "Duplicate" indicates a match to another property. [extracted 2026-07-28] [wiki → Booking.com: Create and update properties and rooms on Booking.com](https://wiki.beds24.com/index.php/Booking.com:_Create_and_update_properties_and_rooms_on_Booking.com)
- For OTA bookings, only **confirmed** bookings are imported (e.g., Booking.com "Requests" must be accepted in the extranet first). [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- For the booking page, Booking Type can be set to "Request" to accept only requests instead of confirmed bookings. [extracted 2026-07-28] [wiki → Responsive Booking Page](https://wiki.beds24.com/index.php/Responsive_Booking_Page)

---

## 5. Group bookings

- A **group booking** is two or more linked individual bookings. Individual bookings within a group can be added or removed. [extracted 2026-07-28] [wiki → Group Bookings](https://wiki.beds24.com/index.php/Group_Bookings)
- Creation: click "Add Booking", enter guest details, on the "Details" tab set "Quantity", then click the SPLIT button. Users are prompted whether charges should be copied across the split bookings. [extracted 2026-07-28] [wiki → Group Bookings](https://wiki.beds24.com/index.php/Group_Bookings)
- Groups are managed via the "Invoice" tab; the "Group Tab" shows associated booking IDs; bulk actions apply to several/all bookings of a group. [extracted 2026-07-28] [wiki → Group Bookings](https://wiki.beds24.com/index.php/Group_Bookings)
- In the new calendar, group bookings are marked with an icon for recognition. [extracted 2026-07-28] [wiki → Group Bookings](https://wiki.beds24.com/index.php/Group_Bookings)

---

## 6. Cancellations

- The wiki's `Cancellation` and `OTA_Cancellation` pages were empty/404 at extraction time; cancellation logic is sourced from channel pages. [extracted 2026-07-28]
- **Airbnb:** booking modifications and cancellations are imported; guest-initiated modifications trigger an email from Airbnb first — if accepted, Beds24 imports the change. Cancellations can be done in the Airbnb extranet. [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)
- **Booking.com:** modification/cancellation import can be disabled per booking. No-shows, invalid cards, date changes, guest misconduct, cancellation requests can be reported to Booking.com. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Expedia:** modifications and cancellations imported (can be disabled per booking). Cancellation fees are NOT transmitted by Expedia — must be manually adjusted. From the "Detail" tab: report invalid cards, date changes, no-shows; cancel as requested by guest (waive/refund fees); cancel if payment invalid (Hotel Collect only). [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- **Vrbo:** setting a booking to "Cancelled" sends "Cancelled by guest" (default); host cancellation uses a substatus selector sending "Cancelled by Owner." **Never delete Vrbo bookings** — Vrbo expects to read the status even when cancelled. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Auto-Replenishment interaction (Booking.com):** Beds24 automatically reopens rooms when availability exists. If Auto-Replenishment is enabled on Booking.com, it re-opens a closed room upon guest cancellation WITHOUT waiting for Beds24's update — this can cause overbooking if another source holds the booking. Opt-out in Booking.com extranet. [extracted 2026-07-28] [wiki → Booking.com: Import Properties from Booking.com to Beds24](https://wiki.beds24.com/index.php/Booking.com:_Import_Properties_from_Booking.com_to_Beds24)
- **"Allow Channel Modifications"** can be toggled under `SETTINGS > CHANNEL MANAGER` to block channel modifications by default. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)

---

## 7. OTA (channel-manager) bookings vs manual / direct bookings

- **OTA bookings** arrive via the channel manager import (automatic). They carry channel-specific info codes and payment handling (channel-collect vs hotel-collect). [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Direct bookings** use the Beds24 booking page (property booking page for single property; the multi-property page is just a directory linking to individual pages). [extracted 2026-07-28] [wiki → Responsive Booking Page](https://wiki.beds24.com/index.php/Responsive_Booking_Page)
- **Manual bookings** are entered by staff in the Calendar or via CSV. When invoicees exist, charges on manually created bookings can be assigned to an invoicee instead of the guest. [extracted 2026-07-28] [wiki → Invoicees](https://wiki.beds24.com/index.php/Invoicees)
- Bookings with dependencies can only be assigned to a room in the same property as the room mapped to the channel. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

---

## 8. Auto Actions (automation of the booking lifecycle)

- An **Auto Action** is an action usable manually or programmed to run automatically at a time relative to the booking, check-in, or check-out date. It has one or more trigger conditions and one or more actions. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- Found under `SETTINGS > GUEST MANAGEMENT > AUTO ACTION`. Account-level functions applying per account to specific/all owned/all visible properties. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Triggers** operate through: Trigger Time (days relative to event), Trigger Event (Booking / Check-in / Check-out), Trigger Window (duration after trigger time). Also "Between Booking and Check-in", "Check In From/To". [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Booking Source:** "Direct" covers website, manual, and API bookings (excluding channel manager); use Referrer field to filter manual-only. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Action types:** Messaging/Email (plain text for Message API channels, HTML box for emails, template variables allowed), SMS (current booking info only, marketing prohibited, 160-char limit, incurs fee), Booking (modify booking info, one-time or allow-repeats), Booking Info (add/remove info codes to sequence actions), Invoice (auto-assign numbers, add/update items/pending payments), API (HTTP POST), Webhook. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Chaining/sequencing:** info codes act as flags to coordinate workflows. Auto Action 1 adds a code (e.g. CLEANWED1); Auto Action 2 uses that code in its Trigger to run next. Example: only trigger a security deposit action when info code equals STRIPEPAYMENT or CARDTOSTRIPE. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Batch processing:** Auto Actions are NOT real-time — processed in batches. They test up to 1000 bookings per cycle; excess wait for next cycle. It is NOT possible to specify a specific time for the trigger. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Emails:** auto-sent from `SETTINGS > ACCOUNT > OUTGOING EMAIL` address; manual "Send now" uses the logged-in user's email. Booking and Invoice changes are applied before the mail is sent. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)
- **Multi-account:** Auto Actions are created per account; visible in another account only for properties belonging to the original account made available there. Clone function copies between accounts. [extracted 2026-07-28] [wiki → Auto Actions](https://wiki.beds24.com/index.php/Auto_Actions)

---

## 9. Yield Optimiser (automated price adjustment)

- Menu location: `PRICES > YIELD OPTIMISER`. Core function: automatically adjust prices based on demand shortly before check-in. Rules can move prices up or down. [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)
- Multiple rules can coexist; each may target one or multiple rooms. A rule fires only when its trigger condition is satisfied. A rule will NOT adjust a price if that room's multiplier has been manually overridden. [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)
- Each rule has a start/end date (validity window) and a percentage representing what portion of normal price to charge when triggered (e.g. 40% of EUR 100 = EUR 40; 150% = EUR 150). [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)
- Triggers evaluate **per date**; rules can apply to bookings arriving up to 30 days out; window can be narrowed; trigger can be tied to a minimum number of rooms available on a given night. [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)
- **Multiple rules firing together compound multiplicatively** (order irrelevant): EUR 100 with Rule 1 = 120% and Rule 2 = 150% yields EUR 180. [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)
- The multiplier applies to all prices. Max allowed value 250%. For Fixed Prices the multiplier can be disabled via "Allow Multiplier" = No. To restore automatic control: in the Calendar Price multiplier row choose "Auto" and specify a date range. [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)
- A rule can be opted out of applying for channel management. Adjusted values show with a blue background in the Calendar; manual overrides show white. [extracted 2026-07-28] [wiki → Yield Optimiser](https://wiki.beds24.com/index.php/Yield_Optimiser)

---

## 10. Credit card handling and payment lifecycle

- Credit card details are stored in the system until the guest checks out, then deleted a few days after checkout. [extracted 2026-07-28] [wiki → View Credit Card Details](https://wiki.beds24.com/index.php/View_Credit_Card_Details)
- Viewing requires: owner account (always has access) or sub-account with "View Credit Cards" enabled; login with primary account password (secondary password cannot view cards); secure HTTPS; password changed within last 90 days; password re-entry. [extracted 2026-07-28] [wiki → View Credit Card Details](https://wiki.beds24.com/index.php/View_Credit_Card_Details)
- Gateway-collected cards follow a one-time display rule: displayed once then deleted after viewing. [extracted 2026-07-28] [wiki → View Credit Card Details](https://wiki.beds24.com/index.php/View_Credit_Card_Details)
- **Virtual cards** (Booking.com/Expedia): auto-charge available when channel virtual cards activated, "Auto Process Virtual Cards" = Yes, and Stripe MCC = "Lodging". Setting "Virtual Cards" = Yes without Stripe creates an uncollectable pending payment. Manual charging allowed only on the valid-from/check-out date. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Info codes** track payment status: BOOKINGCOMCARD (invalid card), BOOKINGCOMFLAG, BOOKINGCOMVIRTCARD, BOOKINGCOMBANKTRANS, CARDTOSTRIPE, STRIPEPAYMENT, STRIPEFAIL, CARDEXPIRES, EXPEDIACOLLECT. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- If a card expires before check-in, info code CARDEXPIRES is added to the booking "Info" tab; deleted when the card is updated. [extracted 2026-07-28] [wiki → View Credit Card Details](https://wiki.beds24.com/index.php/View_Credit_Card_Details)
- **Channel-collect payments** appear on the booking invoice only if `SETTINGS > CHANNEL MANAGER > "Import Channel Collect Payments"` = Yes. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)

---

## 11. Upsell Items (fees added at booking time)

- Upsell Items are shown on the booking page **after** the guest selects their room(s). They offer optional extras or add mandatory fees (taxes, cleaning). Up to 20 per property. [extracted 2026-07-28] [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)
- **They cannot be exported to OTAs** — if needed on a channel they must be configured directly within the channel. [extracted 2026-07-28] [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)
- Types: Optional (checkbox), Optional Quantity, Optional Percentage, Obligatory (auto-added, e.g. cleaning), Obligatory Cleaning (booking page only, not sent to OTAs), Obligatory Percentage (e.g. sales tax), Refundable (withheld from comparison sites). [extracted 2026-07-28] [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)
- Order matters for percentage calculations (applied to room price plus items above them). Each item can carry its own VAT rate. [extracted 2026-07-28] [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)

---

## Note on sources

- The `Booking_Status_Lifecycle`, `Booking_status`, `Cancellation`, `OTA_Cancellation`, `Add_Booking`, and `Overbooking_Protection` pages were empty/404 at extraction time. Booking lifecycle facts are therefore synthesized from `Introduction`, `Overbooking`, `Group_Bookings`, `Auto_Actions`, `Yield_Optimiser`, the channel-specific sync pages (`Booking.com:_Synchronise_bookings_prices_availability`, `Connect_Airbnb_Account`, `Expedia.com`, `Homeaway.com`), `View_Credit_Card_Details`, `Upsell_Items`, and `Responsive_Booking_Page`. [extracted 2026-07-28]
