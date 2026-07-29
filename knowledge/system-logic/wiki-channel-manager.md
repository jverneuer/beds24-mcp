# Beds24 Channel Manager — System Logic Facts

> Facts extracted from the Beds24 wiki (via Jina Reader). Every factual statement ends with its source URL and extraction date.
> If a source omits a detail, it is stated as unknown — nothing is guessed.

---

## 1. What the channel manager is

- The channel manager is the component that connects Beds24 to external booking channels (OTAs) and keeps them updated when a new booking arrives. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- It is enabled under `SETTINGS > CHANNEL MANAGER`. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- A **Channel Manager Link** is a connection between a Beds24 room type and the same room type at a booking channel. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- When the channel manager is active, every property gets its own distinct mapping. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)

---

## 2. Connection types: API vs iCal

- The channel manager supports two connection types: **API** (direct programmatic integration) and **iCal** (calendar-based sync). Some channels offer both (e.g., Airbnb API vs Airbnb iCal, VRBO/XML vs iCal). [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **API channels** typically support richer bidirectional data flow: inventory + prices + stay rules + bookings + modifications + cancellations. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **iCal channels** are primarily one-way/limited: export availability only (no prices/stay rules), with some supporting booking import. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- iCal and API **cannot both be used for the same room**. [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)

---

## 3. General sync directions (data flow)

### 3.1 Outbound (Beds24 → channel)
The channel manager can push to connected channels:
- **Inventory** (availability/room counts) — supported by nearly all channels. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Prices** — most API channels; most iCal channels do NOT receive prices. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Occupancy-based prices** — a subset of API channels. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Min-stay / max-stay restrictions** — varies by channel. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Multiple prices / rate plans** — varies by channel. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Closed-on-Arrival / Closed-on-Departure** — varies by channel. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Content** (descriptions, images) — only a few channels: Booking.com, Airbnb API, Hometogo, Marriott, Homeaway XML. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

### 3.2 Inbound (channel → Beds24)
- **Bookings** — nearly all channels. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Modifications** — varies; many API channels support it. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Cancellations** — varies similarly. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Messages** — supported channels allow two-way messaging from within Beds24 (Airbnb, Booking.com, Expedia, Vrbo group). [extracted 2026-07-28] [wiki → Messages](https://wiki.beds24.com/index.php/Messages)

### 3.3 Speed characteristics
- Most API channels import bookings in **less than 1 minute**; iCal channels are slower and variable (e.g., Airbnb iCal ~15 min, up to 24 hours and unreliable). [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- Export (Beds24 → channel) is **less than 1 minute** for nearly all channels. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- Availability and price changes push **instantly** to most channels; setting changes (min stays, room qty, multiplier) send on the next routine update (manual "Update" push available for instant). [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

### 3.4 Max data export windows
How far into the future data is pushed: 12 months (common default), 16 months (Booking.com), 18 months (Expedia), 24 months (Airbnb API, Google Calendar), 540 days (Tiket). [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

---

## 4. Airbnb integration

- Beds24 offers a **certified 2-way API integration** (not iCal-based). [extracted 2026-07-28] [wiki → Airbnb](https://wiki.beds24.com/index.php/Airbnb)
- Multiple Airbnb accounts can link to a single Beds24 account; new Airbnb accounts can be created from within Beds24. [extracted 2026-07-28] [wiki → Airbnb](https://wiki.beds24.com/index.php/Airbnb)
- Connection path: `SETTINGS > CHANNEL MANAGER > AIRBNB > ACCOUNTS`. Process: click "Connect with Airbnb", log in, agree to terms, click "Allow", click "Return". [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)
- **Co-host limitation:** Airbnb does not allow co-hosts to connect/disconnect listings — only owners can make API connections. [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)
- **Eligibility:** Airbnb restricts API access in some cities; ineligible hosts fall back to **Airbnb iCal** (calendar sync only). [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)

### 4.1 Airbnb push (Beds24 → Airbnb)
- Inventory (available rooms), minimum stay, maximum stay, closed-to-arrival/departure dates, prices (optionally with a multiplier), and new listings with content/photos/amenities/prices/availability. [extracted 2026-07-28] [wiki → Airbnb](https://wiki.beds24.com/index.php/Airbnb)
- **Sync types** chosen per listing in MAPPING:
  - **Prices & Availability** — price data only (guest count, extra person price, base price, taxes/fees, max/min stay, max days in advance).
  - **Limited** — advance notice/same-day cut-off, last-minute/early-bird/weekly/monthly discounts, availability; imports bookings.
  - **Everything** — overrides Airbnb's descriptive content with Beds24 content (cannot be edited in Airbnb afterward). [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)

### 4.2 Airbnb pull (Airbnb → Beds24)
- Bookings, booking modifications, booking cancellations. [extracted 2026-07-28] [wiki → Airbnb](https://wiki.beds24.com/index.php/Airbnb)
- Blocked dates in Airbnb are NOT imported — must be blocked in the Beds24 Calendar before connecting. [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)

### 4.3 Airbnb messages and reviews
- Two-way messaging with guests is handled directly inside Beds24 (send and receive). [extracted 2026-07-28] [wiki → Airbnb](https://wiki.beds24.com/index.php/Airbnb)
- After checkout, a review can be sent to Airbnb via the booking's "Mail & Actions" tab; incoming reviews appear there and replies can be sent. [extracted 2026-07-28] [wiki → Airbnb](https://wiki.beds24.com/index.php/Airbnb)

### 4.4 Airbnb iCal vs API
| Dimension | API | iCal |
|---|---|---|
| Speed | ~1 min | Up to 24 hrs (unreliable) |
| Bookings | Full data (name, guests, price, email) | Limited (no name, no price, no email) |
| Modifications/cancellations | Imported | Imported |
| Pricing | Syncs prices | No prices |
| Guest comms | Direct from booking | n/a |
| Listing creation | Yes | No |
| Content/pictures | Pushable | No |
| Availability | Automatic push | Export only |



### 4.5 Airbnb booking behavior
- Default is **Instant Book only** (recommended). Request-to-book possible per listing only if the listing is NOT on any other OTA that supports instant book. [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)
- No booking confirmation needed from host — all API-managed listings are instant-book and auto-confirmed. [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)
- Disconnect sets all listings in that Airbnb account to **manual** (managed manually going forward). [extracted 2026-07-28] [wiki → Connect Airbnb Account](https://wiki.beds24.com/index.php/Connect_Airbnb_Account)

---

## 5. Booking.com integration

- **Export (Beds24 → Booking.com):** prices, availability, rules. **Import (Booking.com → Beds24):** new bookings, modifications, cancellations. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Rooms/room types in Beds24 must match the Booking.com setup before connecting. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Cannot import historical bookings from before the channel connection date (add manually or via CSV). [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Only **confirmed** bookings are imported — "Requests" must be accepted in the Booking.com extranet first. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Upon activation, Booking.com removes their stored prices/availability and replaces them with data sent from Beds24 (the channel manager takes control). [extracted 2026-07-28] [wiki → Booking.com: Import Properties from Booking.com to Beds24](https://wiki.beds24.com/index.php/Booking.com:_Import_Properties_from_Booking.com_to_Beds24)
- Sending inventory to Booking.com requires prices to be sent from Beds24 — pricing via the Booking.com extranet is disabled once connected. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

### 5.1 Booking.com pricing models
- Connection supports **Occupancy Pricing (OBP)**; newly connected properties are auto-set to OBP. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Daily Prices:** send price per date/occupancy; extra person price included; multiple occupancy prices per rate plan. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Fixed Prices:** send 1-person, 2-person, and room price; extra person/child and Fixed Price discounts NOT sent. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Derived (RLO) prices:** Booking.com calculates occupancy prices from one base; to send per-occupancy from Beds24, linked prices must be removed by Booking.com, then Beds24 switched to OBP. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Dorms: bed price must be sent as the room price (Booking.com rejects a single price for a dorm). [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

### 5.2 Booking.com rate plans
- Booking.com rate plans can be created in Beds24 for additional pricing options (non-refundable, meal-inclusive). [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Every Booking.com rate plan must map to a Beds24 price; standard plan via `SETTINGS > CHANNEL MANAGER > BOOKING.COM`, additional plans mapped directly in the price. [extracted 2026-07-28] [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)
- Pricing models: **OBP** (recommended), **Per Day Pricing (Standard)**, **Derived Prices (RLO)**. [extracted 2026-07-28] [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)
- Dorms: Booking.com does not support occupancy pricing; set Booking.com to "Standard" and Beds24 Rate Type to "Per Day Pricing". [extracted 2026-07-28] [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)
- Rate plans are deleted via the Booking.com extranet, not Beds24. [extracted 2026-07-28] [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)

### 5.3 Booking.com restrictions and availability
- Restrictions sent Beds24 → Booking.com: min stay, max stay, closed to arrival, closed to departure. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Max stay default is 30 days; can be raised via Booking.com property policy ("30+ Nights Monthly Stays") and must match Beds24's "MAX LENGHT OF STAY" — mismatch causes rejection. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- By default all available rooms are sent; per-channel inventory limits can be set in `SETTINGS > CHANNEL MANAGER > CHANNEL INVENTORY`. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

### 5.4 Booking.com promotions
- Promotions created/modified/deactivated in `SETTINGS > CHANNEL MANAGER > BOOKING.COM > PROMOTIONS`. [extracted 2026-07-28] [wiki → Booking.com: Promotions](https://wiki.beds24.com/index.php/Booking.com:_Promotions)
- Promotions are self-contained rule sets — they inherit nothing from general settings; all rules must be configured inside the promotion itself. [extracted 2026-07-28] [wiki → Booking.com: Promotions](https://wiki.beds24.com/index.php/Booking.com:_Promotions)

### 5.5 Booking.com disconnect
- Setting Enable = Disable stops Beds24 sending data but does NOT remove data from Booking.com (remains bookable). Full disconnection requires deactivation in the Booking.com extranet. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

---

## 6. Expedia integration

- Uses **Expedia EQC**; also updates Hotels.com, AirAsiaGo, Egencia, Venere, Travelocity, Trivago (via Expedia), Expedia Affiliate Network, Wotif Group, Orbitz, Classic Vacations. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Requires the Expedia hotel ID. Setup: (1) select Beds24 as channel manager in Expedia account; (2) connect Expedia to Beds24; (3) map rooms/rates; (4) enter registration; (5) import existing bookings; (6) activate; (7) check. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- **Exported (Beds24 → Expedia):** inventory, min stay, max stay, closed to arrival/departure, multiple rates, prices (per pricing-model rules). **Imported (Expedia → Beds24):** bookings (all upcoming imported), modifications and cancellations (can be disabled per booking). [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Two pricing models set at property level: **Per Day Pricing (PDP)** (price for max occupancy only) and **Per Occupancy Pricing** (price per occupancy, up to 20 guests). [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Expedia rate plans with length-of-stay enabled are NOT supported in Beds24. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Upsell Items cannot be exported; cancellation fees not sent by Expedia (manual adjustment needed); guest addresses not sent. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- **Expedia Collect:** when Expedia collects payment, the amount sent is what the property must pay Expedia, not the guest-paid amount. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Same Expedia room type ID mapped more than once causes overwrites ("Room code is not unique"). [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Disconnect: untick "Inventory", "Prices", "Bookings" per room; disconnect all options in Expedia Extranet. [extracted 2026-07-28] [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)

---

## 7. Vrbo / Homeaway (XML) integration

- Connection type: **XML**; all updates should be performed in Beds24 because changes in Vrbo are overridden with the next update. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Activation applies per Beds24 account; all properties owned by the connected account/sub-account can send to the connected Vrbo account. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Vrbo requires a **credit card** and a **tax number/tax identifier** to use XML; otherwise iCal is the alternative. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Beds24 → Vrbo:** property listing content, updated content, prices, availability, taxes/fees, cancellation policy, payment schedule, accepted card types. Creates a listing for every room in Beds24. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Vrbo → Beds24:** bookings (only after connection establishment; existing bookings importable via iCal/manual), messages (confirmed bookings only; inquiries not imported), reviews. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Booking default is "instant" book; "Request" not recommended (hurts ranking). Vrbo does not allow same-day bookings. [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Never delete Vrbo bookings** — Vrbo expects to read the booking status even when cancelled. Cancelling sends "Cancelled by guest" (default) or "Cancelled by Owner" (via substatus). [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Vrbo occupancy pricing supports minimum stays up to 30 days; length-of-stay restrictions must be set to "Stay through". [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- The connection also updates brands: Homeaway, Vrbo, abritel, FewoDirekt, Stayz, and many others (full list on the source page). [extracted 2026-07-28] [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)

---

## 8. Agoda integration

- Supports Agoda and AgodaHomes; requires the Agoda hotel ID. Setup: (1) Agoda config, (2) Beds24 config, (3) Map Rooms, (4) Map Rates. [extracted 2026-07-28] [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- **Beds24 → Agoda:** inventory, availability, prices/rates. **Agoda → Beds24:** new bookings, modifications, cancellations (cancellations disableable per booking). [extracted 2026-07-28] [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Per Occupancy Pricing supported; multiple rate plan IDs per room (each with pre-defined conditions, mapped to a different Beds24 rate/offer). [extracted 2026-07-28] [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Upsell Items explicitly NOT exported. [extracted 2026-07-28] [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Availability and price changes push instantly; setting changes send on next update unless "Update" clicked manually. [extracted 2026-07-28] [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)

---

## 9. Google integration

- Beds24 is an official Google partner, distributing direct prices and inventory to Google in real time. [extracted 2026-07-28] [wiki → Google Hotel Ads](https://wiki.beds24.com/index.php/Google_Hotel_Ads)
- Two products: **Google for Vacation Rentals** (commission-free; Google auto-generates a listing from pictures/prices/availability/descriptions; min 8 pictures; direct booking link to Beds24 booking page) and **Google Hotel Ads** (free booking links + paid campaigns; hotels/B&Bs/guest houses only). [extracted 2026-07-28] [wiki → Google Hotel Ads](https://wiki.beds24.com/index.php/Google_Hotel_Ads)
- Vacation rentals without business signage and a permanently staffed front desk are prohibited from having a Google Business Profile and cannot appear on Google Maps. [extracted 2026-07-28] [wiki → Google Hotel Ads](https://wiki.beds24.com/index.php/Google_Hotel_Ads)
- Google Ads (paid) requires a Google Ads connection in addition to Google Hotel Center; fee EUR 0.50 per room on top of normal channel manager fees. [extracted 2026-07-28] [wiki → Google Hotel Ads](https://wiki.beds24.com/index.php/Google_Hotel_Ads)
- Price sync: lowest price for 2 people from offer 1 and offer 2 is sent; 2-person price compulsory (absent = room sends as unavailable); 1/3/4/6/8-guest prices sync if defined. [extracted 2026-07-28] [wiki → Google Hotel Ads](https://wiki.beds24.com/index.php/Google_Hotel_Ads)

---

## 10. Setting prices for booking channels

- Multiple pricing models exist: **Occupancy pricing**, **Occupancy + length-of-stay pricing**, **Per day pricing** (only ONE price per date), and **Derived/Linked prices** (channel derives from a Beds24-sent price). [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- With multiple activated prices having different minimum stays, the system sends the one with the **lowest minimum stay** (per-day model). [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Daily Prices** are recommended; each can serve any mix of channels and the booking page via tick boxes at `PRICES > DAILY PRICE RULES`. Default state: daily prices disabled for all channels. [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Fixed Prices:** only per-night prices can be sent to booking channels; "Price per" must be "Night". [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- If both Daily and Fixed Prices are used, the system offers the **lowest available price** meeting all rules. [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Price Multiplier:** available for many channels (markup/markdown or currency); e.g. `*1.23` raises 23%, `*0.85` lowers to 85%. Max 250% for the Yield Optimiser. [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Export Price:** lets you send a different price to channels than used on the booking page. [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Mapping channel rate codes: if entered directly in a Daily/Fixed Price it is used; if blank, the rate code in Channel Manager settings applies. [extracted 2026-07-28] [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 11. Channel inventory

- By default all available rooms are sent to activated channels. `SETTINGS > CHANNEL MANAGER > CHANNEL INVENTORY` lets users restrict bookings by defining a "maximum bookings" value accepted per channel (date range, max bookings, specific days, per channel). [extracted 2026-07-28] [wiki → Channel Inventory](https://wiki.beds24.com/index.php/Channel_Inventory)

---

## 12. Messaging (channel)

- Direct messaging integrated for: Airbnb, Booking.com, Expedia, Vrbo group (Abritel, FewoDirekt, Stayz). Message list restricted to guests who booked on these channels. [extracted 2026-07-28] [wiki → Messages](https://wiki.beds24.com/index.php/Messages)
- Full conversation threads in the "API Messages" tab within the booking; also a dashboard widget. Messages sent from Beds24 appear on the OTA side too. [extracted 2026-07-28] [wiki → Messages](https://wiki.beds24.com/index.php/Messages)
- Per-channel rules: HTML not supported by any (use plain text in Auto Actions). Booking.com does not allow links or PDFs. Attachments vary by channel. Hard cap 2MB per message. [extracted 2026-07-28] [wiki → Messages](https://wiki.beds24.com/index.php/Messages)
- Booking.com messaging window: booking time until 7 days post-checkout or post-cancellation; guests can message up to 66 days after checkout. Special characters in auto-action messages breach Booking.com security filters and fail. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Bookings must be in a property connected to the channel to use the Message API; otherwise communication falls back to email. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

---

## 13. Account creation from Beds24

- The channel manager can provision a new channel account automatically ("Create Account") — supported only by Booking.com, Airbnb API, Expedia, Hometogo, Marriott, Homeaway XML. [extracted 2026-07-28] [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

---

## 14. Disconnect behaviors (general)

- For most channels, disabling sync stops Beds24 from sending data but does NOT remove existing data from the channel (remains bookable). Full disconnection typically requires action in the channel's extranet. [extracted 2026-07-28] [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)

---

## Note on sources

- The `Channel_Manager` and `Channel_Messages` pages were empty/404 on the wiki; the substantive content comes from `Channel_Manager_Capabilities`, `Connect_Airbnb_Account`, the per-channel pages, `Setting_Prices_for_Booking_Channels`, and `Messages`. [extracted 2026-07-28]
