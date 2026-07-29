# Beds24 Property / Room Structure — System Logic Facts

> Facts extracted from the Beds24 wiki (via Jina Reader). Every factual statement ends with its source URL and extraction date.
> If a source omits a detail, it is stated as unknown — nothing is guessed.

---

## 1. Properties

- Properties encompass Hotels, Hostels, B&Bs, holiday houses, vacation rentals, apartment houses, and camp sites. An account may hold a single property or many of varying types. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- Each property maintains **independent settings** for: booking page, booking rules, booking questions, upsell items, deposit/payment gateways, confirmation messages, auto actions/emails, and yield optimizer rules. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- When different hotel/property codes exist across booking channels, each must be configured as a **separate property** in Beds24. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- Each property must have **at least one room**, even single-unit/whole-property rentals (one room represents the entire property). [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- New properties are created via "ADD NEW PROPERTY" under `SETTINGS > PROPERTIES`, or by **duplicating** an existing property (all rooms and prices are copied). Best practice: configure one property fully, then clone and adjust. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- **Owner ID** = unique ID of an account. **Property ID** = unique ID of a property. **Room ID** = unique ID of a room/rented unit. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)

---

## 2. Rooms

- Rooms divide a property into separately bookable units and **need not correspond to physical rooms** — they can represent bedrooms, vacation rentals, dorm beds, campsites, houseboats, cabins, tours, classes, or cars. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- A property may consist of a single room or multiple room types/categories. Each room or room type can maintain multiple inventories and carry its own pricing and booking rules. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- In `SETTINGS > PROPERTIES > ROOMS`, clicking EDIT sets the name and **"quantity of 'Rooms' of that type available."** [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- Copying a room automatically applies all settings to the copy. To link prices between rooms, prices must first be removed before copying. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- **Quantity** is set per room type in `SETTINGS > PROPERTIES > ROOMS > SETUP` ("Quantity of this type"). After importing from Booking.com, quantity per type does NOT match automatically and must be set manually. [extracted 2026-07-28] [wiki → Booking.com: Import Properties from Booking.com to Beds24](https://wiki.beds24.com/index.php/Booking.com:_Import_Properties_from_Booking.com_to_Beds24)

---

## 3. Room types / categories

- The terms **"room types"** and **"categories"** are used interchangeably (hotels, B&Bs, hostels, aparthotels). Each may have its own pricing and booking rules. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- A **"Room Type"** is used when a room has quantity > 1. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- When using the channel manager, the booking system setup should **mirror the structure of booking channels**. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)

---

## 4. Combining individual rooms into a room type (virtual rooms)

- Applies when individual rooms connect to individual listings at a channel (e.g. Airbnb) but you also sell on a channel requiring a "room type" with quantity > 1 (e.g. Booking.com). Works for 2–12 individual rooms. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **How it works:** bookings are assigned to the real rooms. The virtual room requires availability in at least one real room. Bookings for the virtual room are placed into one of the real rooms. Multi-day bookings for the virtual room are accepted even if a real-room change is required; then the booking stays in the virtual room and needs manual assignment. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **Step 1 — Real rooms:** add a room for each; in SETUP set Name, Quantity = 1, optionally Sell Priority = Hide, Overbooking Protection = Property. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **Step 2 — Virtual room:** add a room per room type; in SETUP set Name, Quantity = number of individual rooms bookable via this type, same characteristics as individual rooms, Overbooking Protection = Property. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **Step 3 — Dependencies for the virtual room** (`SETTINGS > PROPERTIES > ROOMS > DEPENDENCIES`): Requires Availability in = all individual rooms (2–12); Combination Logic = Sum of all bookings; Dependency Level = Ignore Sub Dependencies; Assign Bookings to = First Available Dependency Room; optional "Include Bookings from" mirrors bookings from real rooms into the virtual room. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **Real rooms' default dependencies:** Requires Availability in = nothing; Assign Bookings to = This Room. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **Step 4 — Prices:** individual and virtual rooms can have own prices or be set up in one room and linked. Two options: (1) Link prices (Daily or Fixed); (2) "Use Prices and Restrictions From" another room — applies Daily Prices, Fixed Prices, Price Multipliers (incl. Yield Optimizer), Calendar restrictions, min/max stay. If using this, channel rate IDs cannot be mapped directly in daily prices/rates. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)
- **Manage bookings:** manually add bookings in the "real" rooms, not the virtual room. Occasionally a booking cannot be assigned automatically (requires room change / re-assignment) → assigned to Virtual room, must manually re-assign. If this is unacceptable, do not use room types to sell rooms. [extracted 2026-07-28] [wiki → Combine individual rooms into a roomtype](https://wiki.beds24.com/index.php/Combine_individual_rooms_into_a_roomtype)

---

## 5. Offers

- An **offer** is "the price combined with certain conditions." Each room/unit can have one or more offers. **"Offer 1"** is the standard offer always displayed. [extracted 2026-07-28] [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- A room may be sold with different prices (packages, promotions, discounted conditional prices), each as a separate offer. Each offer can have its own **Booking Type**. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- On the booking page the Offer section is the only mandatory section; one offer is always shown, additional offers are optional (e.g. alternative non-refundable prices or packages). [extracted 2026-07-28] [wiki → Responsive Booking Page](https://wiki.beds24.com/index.php/Responsive_Booking_Page)

---

## 6. Prices (Daily and Fixed)

- **Daily Prices** are prices for one date; multiple prices per date can be defined (different minimum stays or offers). Recommended model. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- **Fixed Prices** have a start and end date and contain rules/conditions for availability. Suited for fixed-ahead pricing with few seasons; allows guest enquiries when no price found but room not fully booked; allows referrer discounts. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- Daily Prices can override Fixed Prices for individual dates or ranges. Rules in Fixed Prices have no effect on daily prices. The system cannot show availability without prices. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)
- **Dynamic prices** can be sent by Pricelabs, RoompriceGenie, or Beyond for use across all sales channels. [extracted 2026-07-28] [wiki → Do the initial Setup](https://wiki.beds24.com/index.php/Do_the_initial_Setup)

---

## 7. Agency and multiple-property setup

- A single user account may hold one or many properties. When the channel manager is active, every property gets its own distinct mapping. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- Separate user accounts can be granted **read-only or full-write access** to properties. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- Guest-facing emails default to the master account's Email settings. If a property needs its own Email account, a **sub account** must be created for it. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- A copy icon throughout pushes a setting value to other rooms or properties. A "Clone" function in SUB ACCOUNTS copies selected settings between properties. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- **Multi-property booking page** is generated automatically, listing each property with a link to its individual booking page. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- One set of prices can be set up and applied with/without an offset (price adjustment) to other properties. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- **Groups** are formed by assigning identical keywords under `SETTINGS > PROPERTIES > DESCRIPTION` "Group Keywords" (comma-separated). These show/hide properties on property list pages; a group selector appears on the calendar. URL params: `group=` filters to matching, `nogroup=` excludes. A trailing `!` restricts to the property's owner account; `!` plus account numbers restricts to specified accounts. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)

---

## 8. Sub accounts

- Created when properties need their own login (User icon > Account Management / SUB ACCOUNTS). Each sub account has a unique username/password and can be given restricted or full access to other accounts or individual properties. Sub accounts may use a distinct email address for guest messaging. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- An "Owner" role sub account can be created, with further access customization. Staff/owners can be granted access to a single property or a group via sub accounts. [extracted 2026-07-28] [wiki → Agency & Multiple Property Setup](https://wiki.beds24.com/index.php/Agency_%26_Multiple_Property_Setup)
- **Agents** use sub-accounts with the "Agent" role, which have access limited to the CALENDAR and can view/manage only their own bookings. Also covers API access (JSON getBookings/setBooking), sell priority restrictions (rooms with priority 10+), and hiding booking fields. [extracted 2026-07-28] [wiki → Category:Agents](https://wiki.beds24.com/index.php/Category:Agents)
- Agents can have dedicated booking pages with unique pricing tracked via URL parameters (`&agent=Agent`, optional referrer). Agent prices via Daily Prices (activate for "Beds24 - agents", specify agent codes) or Fixed Prices (untick "Beds24", tick "Beds24.- agents", specify agent codes). [extracted 2026-07-28] [wiki → Category:Agents](https://wiki.beds24.com/index.php/Category:Agents)

---

## 9. Invoicees (per-booking invoicing splits)

- By default each booking (or group booking) receives one invoice. Invoicees let you assign some/all invoice items to a specific invoicee or create multiple invoices per booking (e.g. agent pays accommodation, guest pays extras). Up to 8 template fields per invoicee. [extracted 2026-07-28] [wiki → Invoicees](https://wiki.beds24.com/index.php/Invoicees)
- Each invoicee may access its own prices via an **agent code** (connection: invoicee Code field ↔ Daily/Fixed Price Channels agent code; Beds24 direct disabled, Agent enabled). [extracted 2026-07-28] [wiki → Invoicees](https://wiki.beds24.com/index.php/Invoicees)
- For channel bookings, a different invoice template per channel is possible by entering the invoicee ID in the channel manager settings for that channel (applies only to new bookings). Hotel-collect vs channel-collect differentiated by prefix (H / C). [extracted 2026-07-28] [wiki → Invoicees](https://wiki.beds24.com/index.php/Invoicees)

---

## Note on sources

- The `Property`, `Room`, `Setup`, `Booking_Engine`, `Booking_Page`, `Calendar`, `Daily_Prices`, and `Dashboard` category/pages were empty/404 at extraction time. Property/room structure facts are synthesized from `Do_the_initial_Setup`, `Combine_individual_rooms_into_a_roomtype`, `Introduction`, `Agency_%26_Multiple_Property_Setup`, `Category:Agents`, `Booking.com:_Import_Properties_from_Booking.com_to_Beds24`, `Responsive_Booking_Page`, and `Invoicees`. [extracted 2026-07-28]
