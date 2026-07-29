# Setting Prices for Booking Channels — Beds24 Pricing System Logic

> Source: Beds24 Wiki (wiki.beds24.com), fetched via Jina Reader.
> Focus: system behavior and logic for how prices reach OTAs / booking channels.
> Every factual statement ends with the exact Jina URL it was extracted from and `[extracted 2026-07-28]`.

---

## 1. The three price-transmission models

Beds24 sends prices to channels using three distinct models. Which model a channel uses determines how many prices send and how occupancy is handled.

### 1a. Occupancy pricing
- Sends a price for **1 person, 2 person and room price** (room price = specified occupancy). [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- With Daily Prices: price sends **including occupancy**; **extra person price sends**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- With Fixed Prices: 1-person, 2-person and room price send; room price for specified occupancy; **multiple Fixed Prices with different occupancies can send on the same rate plan**; extra person / extra child / Discounts-tab discounts **cannot** send. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Used by: **Agoda, Expedia**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

### 1b. Occupancy and length-of-stay pricing
- Sends a price for **each occupancy defined in Beds24 plus prices for different length of stay**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Beds24 sends the price for **max. 16 guests**; above that, use "Per Day" pricing with a negative extra person price. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Used by: **Airbnb, VRBO**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

### 1c. Per day pricing
- **Only ONE price can be sent per date.** [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- With multiple prices activated having different minimum stays: system selects the price with the **lowest minimum stay**; of those tied, the **highest occupancy**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Extra Person handling: daily price must be set for **max occupancy** and the extra person price added as a **negative value** so the full-occupancy price can send. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Used by: **Airbnb, Booking.com, Ctrip, Vrbo, Hostelworld, HRS, TripadvisorRentals**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

### 1d. Derived / Linked Prices
- The channel **derives** from a price sent by Beds24 or **links** prices; disadvantage is reduced control from Beds24. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Used by: **Booking.com, Expedia**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 2. Daily Prices vs Fixed Prices reach channels

- Each Daily Price can serve **any combination of channels and the booking page**, controlled via tick boxes at **PRICES > DAILY PRICE RULES**. By default daily prices are disabled for all channels. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Daily Price or Fixed Price settings include an **"Enable" section with tick boxes for each channel**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Channels can be enabled/disabled for all prices in a room at once via **MANAGE ACCOUNT > MANAGE PROPERTIES > MANAGE ROOMS "Channels"**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **PRICES > CHANNEL MAPPING** shows where each price is used; clicking a price opens the editor. Recommended view: "Prices in individual columns". [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Fixed Prices: only per-day prices send (Price per = "Night"); the "Channels" tab defines usage. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Combined logic:** when both Daily and Fixed Prices are used, the system offers the **lowest available price that meets all rules**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 3. Export Price

- Sends a **different price to channels** than used on the booking page. Enter in the "Export Price" field (Fixed Prices → Channels tab) and set **"Channel Management" = "Use Export Price"**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 4. Rate code / rate plan mapping

- Supported by Agoda, Booking.com, Expedia, Ctrip, Hostelworld. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- If a channel rate code is entered **directly in a Daily Price or Fixed Price**, it is used with that price. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- If left blank, the rate code entered in **Channel Manager settings** for that channel is used; the **offer number** of the price then determines which rate code applies. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Multiple rate codes per room allow different prices for occupancy, minimum stay, meal options, or refundable/non-refundable rates. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Use the **"Get Code"** link to retrieve rate IDs from the channel for a room. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 5. Price Multiplier (channel level)

- For many channels a **multiplier** can be added (currency differences or commission loading). [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Configured in channel manager settings; only sends to activated channels. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Some channels can **convert imported booking prices back** to the Beds24 currency. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Multiplier syntax (most channels): `*` followed by the factor — `*1.23` raises 23%; `*0.85` lowers to 85%. To convert imported booking prices, place `*` **after** the factor (divides). [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Currency conversion template variables supported, e.g. `[CONVERT:IDR-EUR]`. [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Airbnb multiplier syntax is `***1.23` / `***0.85` (three asterisks). [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)

---

## 6. Channel-specific pricing logic

### 6a. Agoda
- Models: Single (1 person), double (2 guests), room price (max occupancy); Extra Bed (only if activated); Per Occupancy Pricing. [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Daily Prices: price sends including occupancy; multiple occupancy prices per rate plan; extra person sends. [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Fixed Prices: 1-person, 2-person, room price send; room price for specified occupancy; multiple occupancies per rate plan; extra person/extra child/Discounts-tab discounts **cannot** send. [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Agoda supports **more than one price per room** (different min stays, meals, refundable/non-refundable). [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- Two options: **Derived (Child) Prices** (Agoda auto-calculates child rates from one master rate) or **Multiple Rate Plan Ids** (Agoda sets up multiple rate-plan ids per room; Beds24 maps different rates/offers to each). [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- For dorms Agoda expects only a **single price**. [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)
- **Agoda will depreciate "Per Day Pricing" shortly.** [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Rate validation rules: full occupancy rate must be set; full rate > double rate; rates cannot fall below minimum; default rate within min/max bounds. [extracted 2026-07-28]
  - Source: [wiki → Agoda.com](https://wiki.beds24.com/index.php/Agoda.com)

### 6b. Airbnb (API)
- Models: **Per Day Pricing (default)** or **Per Occupancy (LOS) Pricing**. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Per Day: lowest minimum-stay price wins (tie → highest occupancy); only a global max stay sends; extra person set in Specific Content. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Per Occupancy (LOS): sends Single, Double and room price; daily price sends including occupancy + extra person sends; **restriction strategy must be "Stay through"** ("Arrival" may miscalculate after first night). [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Beds24 sends prices **up to 28 days**; Airbnb applies the **average of the 28-day price for days 29+**. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- **Smart Pricing is NOT available for API-connected listings.** [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Promotions require a **10% drop from the last 30 days median price**. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Early Bird / Last Minute activated for Airbnb send automatically; **Airbnb will not mark these as promotions**. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- 2–28 day discounts configurable; use **either** per-day discounts **or** month/week, not both (per-day overrides per week/month). [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Non-refundable discount (10%) requires sync type "Everything". New Listing Promotion: **20% off next three bookings**, active by default, only when Smart Pricing off and fewer than three bookings. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Rate plans: prices up to **1 year** only send via rate plans; Airbnb does **not** allow Request bookings with rate plans; up to 10 rate plans, max **2 displayed** to guests at once; each length of stay needs a separate rate plan. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Base price must be ≥ €9 and ≤ €21,467; minimum daily price $13; longer-stay discounts must be ≥ shorter-stay discounts. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- Price data updates sent **instantly**. [extracted 2026-07-28]
  - Source: [wiki → Airbnb Mapping](https://wiki.beds24.com/index.php/Airbnb_Mapping)
- **iCal connection:** prices cannot be exported (must be set in Airbnb); bookings assigned the minimum room price when no price supplied by the channel; if min room price set in SETTINGS->PROPERTIES->ROOMS->SETUP it shows in the booking Price field. [extracted 2026-07-28]
  - Source: [wiki → AirBnB.com](https://wiki.beds24.com/index.php/AirBnB.com)
- Airbnb API checks real-time availability before accepting a booking. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

### 6c. Booking.com
- Models: **Occupancy Pricing (OBP)** (newly connected properties auto-set to OBP), **Per Day Pricing**, and **RLO (Derived)**. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Daily Prices: a price for each date and occupancy; multiple occupancy prices per rate plan; extra person sends. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Fixed Prices: 1-person, 2-person, room price send; multiple occupancies per rate plan; extra person/extra child/Discounts-tab discounts **cannot** send. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **RLO (Derived):** Beds24 prices must be the right price for the "base number of guests" in Booking.com so it can calculate; to switch to Occupancy Pricing, remove linked prices at Booking.com then change the model in Beds24. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Booking.com **default max stay = 30 days**; can be raised via Property > Property Policies > 30+ Nights Monthly Stays; the value in Booking.com must **match** the Beds24 value (SETTINGS > CHANNEL MANAGER > BOOKING.COM > SPECIFIC PROPERTY CONTENT > PROPERTY DETAIL > MAX LENGTH OF STAY) or updates are rejected. After raising max stay above 30, min stays > 30 can also be set. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Restrictions sent: min stay, max stay, closed to arrival, closed to departure. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Linked prices:** only the price for the room set up updates instantly; linked rooms update on the next routine update (manual push available). [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Promotions managed in (SETTINGS) CHANNEL MANAGER > BOOKING-COM > PROMOTIONS; min stay does **not** apply to promotions; all rules must be set in the promotion itself. [extracted 2026-07-28]
  - Sources: [wiki → Booking.com: Promotions](https://wiki.beds24.com/index.php/Booking.com:_Promotions) , [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Extras/taxes/fees do **not** auto-send; set in Booking.com Extranet unless managing full content from Beds24. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- **Rate plans:** only mappable if they appear when "Get Codes" is clicked; every rate plan must be mapped to a Beds24 price; standard plan mapped under CHANNEL MANAGER > BOOKING.COM, additional plans mapped in the price. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)
- Rate Type set/changed at SETTINGS > CHANNEL MANAGER > BOOKING.COM > MAPPING > "BOOKING.COM RATE TYPE"; values: Standard (Per Day), OBP (Per Occupancy), RLO (Derived). [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)
- Occupancy pricing **not supported for dorms**; dorms must use "Standard" pricing with Rate Type "Per Day Pricing" so the bed price sends as the room price. Booking.com requires the bed price be sent as the room price for dorms. [extracted 2026-07-28]
  - Sources: [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24) , [wiki → Booking.com: Synchronise bookings prices availability](https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability)
- Deactivating a rate plan blocks prices sent to that rate code; remove inactive rate plans from daily prices/rates/MAPPING. [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Create Booking.com Rate Plans in Beds24](https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24)
- Promotions error notes: "Stay dates cannot be in the past" (early-booker promotion start date cannot precede the first date a guest could book); Booking.com does not permit a promotion containing a min-stay value (verify restrictions in Extranet). [extracted 2026-07-28]
  - Source: [wiki → Booking.com: Promotions](https://wiki.beds24.com/index.php/Booking.com:_Promotions)

### 6d. Expedia
- Models: **Per Day Pricing** (requires a price set for max room occupancy; prices for 1–3 guests not sent) and **Per Occupancy Pricing** (price per occupancy, up to **20 guests**). [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Daily Prices (Occupancy): price sends including occupancy; multiple per rate plan; extra person sends. Fixed Prices: 1/2/room send; multiple occupancies per rate plan; extra person/extra child/Discounts-tab discounts **cannot** send. [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- **Upsell Items cannot be exported** to Expedia. [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- For dorms the price sent is **per bed** (Daily or Fixed for one guest; with Fixed, also enter bed price as "room price"). [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Two multiple-rate options: **Derived (Linked) Prices** (Expedia auto-calculates/links from one rate) or **Multiple Rate Plan Ids** (multiple ids per room; Beds24 maps a different rate/daily price or offer to each). [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Occupancy price model sends a **room price, a double occupancy price, and a single occupancy price**; to update 3/4-person prices use the "Daily price model" with multiple rate plan ids (each with desired max occupancy). [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- LOS restrictions: **Arrival based** or **Stay Through based** (hotel-level in Expedia); Expedia rate plans with LOS **not supported**. [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Auto-closure: the channel manager **closes the room on all dates lacking a valid price** available for sending. [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)
- Depending on acquisition type, Expedia rate plan ids may need to end in **"A"**. [extracted 2026-07-28]
  - Source: [wiki → Expedia.com](https://wiki.beds24.com/index.php/Expedia.com)

### 6e. Vrbo / Homeaway
- Models: **Per Occupancy (LOS)** and **Per Day Pricing**. [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Max 16 guests**; properties above 16 must use Per Day pricing with extra person. [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Vrbo occupancy pricing supports **min stays up to 30 days** only. [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Per Day sends **one price per date** (lowest min stay wins). [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Restriction strategy must be "Stay through"** when sending LOS prices ("Arrival" may miscalculate after first night). Vrbo applies min stay on **Arrival** (only arrival date). [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Discounts: with LOS, Vrbo **calculates and merchandises** the discount from prices sent. With Per Day, length-of-stay discounts set in Specific Room Content; **Vrbo stay discounts are cumulative**; long-stay discount settable. Discounts apply to room price, not extras. [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- **Vrbo does not support promotions.** [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Currency defined by Vrbo; multiplier settable if Beds24 currency differs; manually converting imported prices discouraged (can cause wrong commission). [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- Taxes/fees configurable as flat/per day/per guest; "stay collected" fees excluded from booking price. Cleaning fee required (zero sent if unset). [extracted 2026-07-28]
  - Source: [wiki → Homeaway.com](https://wiki.beds24.com/index.php/Homeaway.com)
- VRBO/Homeaway XML only for agencies with **five or more listings**; availability checked before booking acceptance. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

### 6f. Hostelworld
- Uses a **per-bed** pricing/inventory model (double room = 2 beds, triple = 3 beds). [extracted 2026-07-28]
  - Source: [wiki → HostelWorld.com](https://wiki.beds24.com/index.php/HostelWorld.com)
- **Dorm** price check order: single price first, then double (if no single), then room price. [extracted 2026-07-28]
  - Source: [wiki → HostelWorld.com](https://wiki.beds24.com/index.php/HostelWorld.com)
- **Private room** price check order: room price first, then double/2 (if no room), then single. Guest pays bed price × total beds. [extracted 2026-07-28]
  - Source: [wiki → HostelWorld.com](https://wiki.beds24.com/index.php/HostelWorld.com)
- Extra person/extra child/Discounts-tab discounts **cannot** export. [extracted 2026-07-28]
  - Source: [wiki → HostelWorld.com](https://wiki.beds24.com/index.php/HostelWorld.com)
- **Max booking length = 14 days.** Private rooms sold only when **every bed** in the room is booked together. Only refundable/non-refundable rate types. [extracted 2026-07-28]
  - Source: [wiki → HostelWorld.com](https://wiki.beds24.com/index.php/HostelWorld.com)
- Each Hostelworld rate plan code needs its own **separate Daily Price**, mapped individually via Get Codes. Prices/availability update instantly; setting changes on next cycle unless "Update" clicked. [extracted 2026-07-28]
  - Source: [wiki → HostelWorld.com](https://wiki.beds24.com/index.php/HostelWorld.com)

### 6g. HRS
- **Per-day:** one price per HRS room type. **No rate codes.** [extracted 2026-07-28]
  - Sources: [wiki → Hrs](https://wiki.beds24.com/index.php/Hrs) , [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Extra person/extra child/Discounts-tab discounts **not exportable**. [extracted 2026-07-28]
  - Source: [wiki → Hrs](https://wiki.beds24.com/index.php/Hrs)
- **Room type mapping:** Single and Double = "Primary" types; all others = "Additional". Each HRS rate type/category has **independent availability**; each HRS room-and-rate combo maps to only one Beds24 room type. A primary room must always be mapped. Sending identical availability to multiple rate types risks overbookings. [extracted 2026-07-28]
  - Source: [wiki → Hrs](https://wiki.beds24.com/index.php/Hrs)
- **Hot Deals** have their own separate availability; sending a Hot Deal requires creating and mapping a standard HRS rate first. [extracted 2026-07-28]
  - Source: [wiki → Hrs](https://wiki.beds24.com/index.php/Hrs)

### 6h. Ctrip (Trip)
- **Per day:** only one price per rate code; if multiple activated, system uses the **highest occupancy**. [extracted 2026-07-28]
  - Source: [wiki → Ctrip](https://wiki.beds24.com/index.php/Ctrip)
- Trip does **not** use room codes — rate codes identify both room and rate. Multiple rate plan codes per room, each with pre-defined booking conditions; Beds24 maps a different daily price to each. [extracted 2026-07-28]
  - Source: [wiki → Ctrip](https://wiki.beds24.com/index.php/Ctrip)
- Extra person/extra child/Discounts-tab discounts **cannot** send. [extracted 2026-07-28]
  - Source: [wiki → Ctrip](https://wiki.beds24.com/index.php/Ctrip)
- Breakfast suffix: `/b` (incl. for max guests), `/n` (none), `/1`–`/9` (incl. for that many guests). Payment suffix: `/c` (Trip collect), `/h` (hotel collect). [extracted 2026-07-28]
  - Source: [wiki → Ctrip](https://wiki.beds24.com/index.php/Ctrip)
- Availability can only be sent if prices are set up and activated for the channel. [extracted 2026-07-28]
  - Source: [wiki → Ctrip](https://wiki.beds24.com/index.php/Ctrip)

### 6i. Tripadvisor Rentals
- **Per day:** only ONE price per date (lowest min stay wins). **No rate codes. No decimal places** on prices. [extracted 2026-07-28]
  - Source: [wiki → Tripadvisor Rentals](https://wiki.beds24.com/index.php/Tripadvisor_Rentals)
- Daily or Fixed Prices must have the Tripadvisor Rentals channel ticked and be set as **offer 1** to transmit. A min stay value can accompany the price. [extracted 2026-07-28]
  - Source: [wiki → Tripadvisor Rentals](https://wiki.beds24.com/index.php/Tripadvisor_Rentals)
- Number of guests, extra person price, and weekly/monthly discount configurable in Specific Content. Tax % for excluded taxes in Specific Content; cleaning fee/security deposit under ROOM CONTENT. [extracted 2026-07-28]
  - Source: [wiki → Tripadvisor Rentals](https://wiki.beds24.com/index.php/Tripadvisor_Rentals)
- **Tripadvisor does not support promotions.** [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Known bug: guests included must first be left blank and additional price set to zero before publishing/updating, then re-added. [extracted 2026-07-28]
  - Source: [wiki → Tripadvisor Rentals](https://wiki.beds24.com/index.php/Tripadvisor_Rentals)

---

## 7. Channel Manager Capabilities matrix (price-relevant)

Per-channel support for Prices (P), Occupancy (O), Min Stay (Min), Max Stay (Max), Multiple Prices (MP). Full capability (all Yes): **API, Agoda, Booking.com, Expedia, Holidu Smart Destinations, Tiket**. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

- **Airbnb API:** Prices Yes, Occupancy Yes (Per Occupancy Pricing possible), Multiple Prices No. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **VRBO/Homeaway XML:** Prices + Occupancy Yes; availability checked before booking acceptance; only for agencies with **five or more listings**. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Airbnb iCal:** prices **not provided** (only blocked dates + last four digits of guest phone). [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **EDreamsODIGEO:** Prices/Occupancy/Min Stay/MP Yes, Max Stay No; data export 17 months. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Feratel:** Prices/Occupancy/Min Stay/MP Yes, Max Stay No. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- **Traveloka.com:** Prices/Occupancy/Max Stay/MP Yes, Min Stay No. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)
- Data export maximums vary: Booking.com 16 months, Expedia 18 months, Tiket 540 days, most iCal 12 months, API/Google Calendar 24 months. [extracted 2026-07-28]
  - Source: [wiki → Channel Manager Capabilities](https://wiki.beds24.com/index.php/Channel_Manager_Capabilities)

---

## 8. Discounts and how they do (not) reach channels

- Discounts entered in prices **do not send to OTAs**; they apply only to direct booking-page bookings. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- For OTAs: add a **price multiplier** at the channel level (which can include a price converter), or create separate prices for a specific OTA / all OTAs by selecting the channel(s) in Prices. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- **Airbnb:** with Per Occupancy (LOS), Airbnb calculates the discount from prices sent but does **not** merchandise it. With Per Day, LOS discounts set in CHANNEL MANAGER > AIRBNB > SPECIFIC CONTENT; Airbnb **will** merchandise these. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- **Vrbo:** with LOS, Vrbo calculates **and merchandises** the discount. With Per Day, set in CHANNEL MANAGER > VRBO > SPECIFIC ROOM CONTENT; Vrbo will merchandise. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- **Early Bird / Last Minute** at Airbnb: set in CHANNEL MANAGER > Airbnb > SPECIFIC CONTENT; Airbnb will merchandise these. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)

---

## 9. Booking page vs channels: separate prices

- Create separate prices for the booking page by selecting **www.beds24.com** as the channel. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- Adjust booking-page prices via the **Booking Page Price Multiplier** in (SETTINGS) BOOKING ENGINE > BOOKING PAGE. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- The channel manager **pushes updates across all sales channels whenever a new booking arrives** (price + availability distribution among the automation tools). [extracted 2026-07-28]
  - Source: [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)

---

## 10. Upsell Items and channels

- **Upsell Items cannot be exported to OTAs**; if needed they must be set up directly in the channel. [extracted 2026-07-28]
  - Source: [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)
- Up to **20 upsell items** per property; prices required per room (price linking across rooms/properties will not work). [extracted 2026-07-28]
  - Source: [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)
- Optional/obligatory/percentage and per-room vs per-booking calculation rules apply for the booking page only. [extracted 2026-07-28]
  - Source: [wiki → Upsell Items](https://wiki.beds24.com/index.php/Upsell_Items)

---

## 11. Notes on source coverage

- The main reference for this file is the wiki page **Setting Prices for Booking Channels**, supplemented by the per-channel pages (Agoda, Airbnb Mapping, Booking.com sync + rate plans + promotions, Expedia, Homeaway/Vrbo, Hostelworld, Hrs, Ctrip/Trip, Tripadvisor Rentals), the **Channel Manager Capabilities** matrix, and the **Discounts** and **Upsell Items** pages. [extracted 2026-07-28]
- The wiki pages `Rack_Rate`, `Long_Term_Prices`, `Rates`, `Rate_Plans`, `Master_Rate`, `Daily_Price_Rules`, and `Daily_Pricing_Strategy` are **stubs with no content** via Jina; no pricing system logic could be extracted from them. [extracted 2026-07-28]
  - Sources: [wiki → Rack Rate](https://wiki.beds24.com/index.php/Rack_Rate) , [wiki → Long Term Prices](https://wiki.beds24.com/index.php/Long_Term_Prices) , [wiki → Rates](https://wiki.beds24.com/index.php/Rates) , [wiki → Rate Plans](https://wiki.beds24.com/index.php/Rate_Plans) , [wiki → Master Rate](https://wiki.beds24.com/index.php/Master_Rate) , [wiki → Daily Price Rules](https://wiki.beds24.com/index.php/Daily_Price_Rules) , [wiki → Daily Pricing Strategy](https://wiki.beds24.com/index.php/Daily_Pricing_Strategy)
