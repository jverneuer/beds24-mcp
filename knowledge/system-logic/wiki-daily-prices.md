# Daily Prices — Beds24 Pricing System Logic

> Source: Beds24 Wiki (wiki.beds24.com), fetched via Jina Reader.
> Focus: system behavior and logic, not parameter lists.
> Every factual statement ends with the exact Jina URL it was extracted from and `[extracted 2026-07-28]`.

---

## 1. What a Daily Price is

- A **Daily Price covers a single date** (unlike a Fixed Price, which spans a start–end range). [extracted 2026-07-28]
  - Source: [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- Daily Prices are the **recommended** price type in Beds24. [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)
- Absent a Daily Price **or** a Fixed Price for a date, the system shows **zero availability** for that date (no price = no availability). [extracted 2026-07-28]
  - Source: [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- Each Daily Price can serve **any combination of channels and the booking page** — channel targeting is controlled via tick boxes at PRICES > DAILY PRICE RULES. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- By default, **daily prices are disabled for all channels**; you must enable them per channel. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 2. How Daily Prices calculate per night / per occupancy

- Daily Prices support **prices for different occupancies** (1-person, 2-person, room price for max occupancy, etc.). [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Extra Person pricing with Daily Prices:** to send a full-occupancy price to a per-day channel, the daily price must be set for **max occupancy** and the extra person price added as a **negative value** so the full-occupancy price can send. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- For channels using **Occupancy-and-Length-of-Stay** models (Airbnb, VRBO): the daily price sends **including occupancy**, and the **extra person price sends**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- The **price multiplier** (Dynamic Multi Calendar) modifies Daily Prices (and Fixed Prices) on a **percentage basis**: >100 raises, <100 reduces, 100 = unchanged. [extracted 2026-07-28]
  - Source: [wiki → Dynamic Multi Calendar](https://wiki.beds24.com/index.php/Dynamic_Multi_Calendar)
- Multiplier range is **50 to 250** (i.e., 50%–250% of normal price). [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- The multiplier applies to **both booking page and channel-management prices**. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)

---

## 3. Daily Prices workflow / setup

- Navigate to **PRICES > DAILY PRICES RULES**, select the room, and set e.g. "Daily Price 2" Offer = 2 to create additional daily-price rows. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- Additional Daily Price rows then appear on the **CALENDAR** for entering prices. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- Daily Prices allow setting a **minimum stay per price** via DAILY PRICE RULES, then entering the price in the CALENDAR. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- Multiple rate codes at a channel can be mapped by **entering the rate code in each Daily Price's settings**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 4. Long-stay discounts via Daily Prices

- Long-stay discounts are defined using the **"Min Nights"** setting in prices; this requires a **separate price for each rule/price set**. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- Example structure: first price Room Price = 120, Min Stay = 1, Max Stay = 2; second price Room Price = 100, Min Stay = 3, Max Stay = 999. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- When defining multiple prices, **min/max stay ranges should not overlap**, otherwise results are unexpected. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)

---

## 5. Last-Minute and Early-Bird prices via Daily Prices (recommended method)

- **Last-Minute price** is created using **"Max days until check-in"** in a daily price. The setting controls how far ahead a price can be booked (0 = tonight only; 3 = bookable only ≥ 3 days before first night). [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)
- Implementation requires **two prices**: a normal always-available price (Max days in advance = 999, the default) plus a separate last-minute price with the desired threshold (e.g. 7). [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)
- **Early-Bird price** is created using **"Min days until Check-in"** — the minimum lead time for the price to apply (e.g. 30 = bookable only ≥ 30 days ahead). [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)
- Early-Bird also needs two prices: normal price with Max days = 0 (or 1 if same-day disallowed) plus the early-bird price at the threshold (e.g. 30). [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)
- After setup via daily prices, additional Daily Price rows appear in the CALENDAR for entering prices. [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)

---

## 6. Seasonal prices via Daily Prices

- Daily Prices (recommended): enter a price **per season** directly in the CALENDAR. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)
- Default system behavior: **the system always uses the lowest price it can find.** [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)
- Recommendation: keep the **highest price always available** and create lower prices for specific date ranges as needed. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)

---

## 7. Offers and Daily Prices

- An **offer = a price + a set of conditions**. Offer 1 is the default always-visible standard offer; additional offers show alternative prices. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- Offer type can be **per property** (available across all properties) or **per room** (separate offers per room). [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- A **maximum of 16 offers** can be activated. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- Additional offers can be set to **always display** or to show **only when a price is available**. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- **"Only If Available"** on all offers hides the offer (plus its warning) when unavailable; if all offers are hidden, only a generic warning shows for the room. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- To link a Daily Price to an offer: in PRICES > DAILY PRICES RULES set the Daily Price's "Offer" to the desired offer row number. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)

---

## 8. Discounts available for direct bookings via Daily/Fixed Prices

- Discounts entered in prices **do not send to OTAs**; they apply only to direct bookings from the booking page. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- **Percentage** discount applies to the entire stay price; if multiple percentage discounts are valid, only the **single highest percentage** is applied. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- **Per Night** discount applies only to nights starting from the specified night count (e.g. €10 off at night 4 = nights 1–3 normal, night 4+ reduced by €10). [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- Multiple per-night discounts **add together** (e.g. €10 at night 4 + €5 at night 7 = €15 off from night 7 onward). [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- **Once Off** discount is subtracted once from the total if the night threshold is met; multiple Once Off discounts are all subtracted if their thresholds are met. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)
- Percentage and per-night discounts are calculated based on booking length **regardless of whether it spans multiple prices**. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)

---

## 9. Channel behavior of Daily Prices (summary)

- **Per-Day channels** (Airbnb, Booking.com, Ctrip, Vrbo, Hostelworld, HRS, TripadvisorRentals): only **ONE price can be sent per date**. If multiple prices are activated with different minimum stays, the system sends the **lowest minimum stay**; of those tied, the **highest occupancy**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Occupancy channels** (Agoda, Expedia): daily price sends including occupancy; extra person price sends; multiple occupancy prices can send per rate plan. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Occupancy + LOS channels** (Airbnb, VRBO): daily price sends including occupancy; extra person sends. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 10. Notes on source coverage

- The wiki pages `Daily_Prices` and `Category:Daily_Prices` are **stubs with no content** (the category does not enumerate member pages via Jina). The facts above are drawn from the content pages that actually describe Daily Price behavior: Setting Prices for Booking Channels, Discounts, Offers, Seasonal Prices, Last-Minute/Early-Booker, Minimum Stay, Dynamic Multi Calendar, and Introduction. [extracted 2026-07-28]
  - Sources: [wiki → Daily Prices](https://wiki.beds24.com/index.php/Daily_Prices) , [wiki → Category:Daily Prices](https://wiki.beds24.com/index.php/Category:Daily_Prices)
- The Daily Price multiplier interaction with Fixed Prices: when Fixed Prices are in use the multiplier can be **disabled** per fixed price (Allow Multiplier = No), but by default the multiplier applies to daily prices. [extracted 2026-07-28]
  - Source: [wiki → Dynamic Multi Calendar](https://wiki.beds24.com/index.php/Dynamic_Multi_Calendar)
