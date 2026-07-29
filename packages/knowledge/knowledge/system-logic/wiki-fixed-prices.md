# Fixed Prices — Beds24 Pricing System Logic

> Source: Beds24 Wiki (wiki.beds24.com), fetched via Jina Reader.
> Focus: system behavior and logic, not parameter lists.
> Every factual statement ends with the exact Jina URL it was extracted from and `[extracted 2026-07-28]`.

---

## 1. What a Fixed Price is

- A **Fixed Price spans a start and end date** (a date range), unlike a Daily Price which covers a single date. [extracted 2026-07-28]
  - Source: [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- Each Fixed Price has a **unique Fixed Price ID**. [extracted 2026-07-28]
  - Source: [wiki → Introduction](https://wiki.beds24.com/index.php/Introduction)
- Only **per-day prices** can be sent to channels from Fixed Prices; in the Summary tab **"Price per" must be set to "Night"**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- The **"Channels" tab** of a Fixed Price defines where that price is used. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 2. What Fixed Prices send to channels

- With Fixed Prices, **1-person, 2-person and room price** send; the **room price sends for the specified occupancy**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **Multiple Fixed Prices with different occupancies can send on the same rate plan.** [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Prices for **"Extra Person", "Extra child" and discounts set in the "Discounts" tab of Fixed Prices can NOT be sent** to channels. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 3. Fixed Prices routing: own website vs channels

- To use a Fixed Price **only on the own website**: tick "Beds24" but **untick all channels**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- To use a Fixed Price **only for channel management**: untick "Beds24" and "Beds24 Agents", and tick the desired channels. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 4. Strategy options when using multiple Fixed Prices

- **"Allow lower prices"** — default; applies the lowest price for the guest's selection. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **"Do not allow lower prices"** — blocks only this one fixed price when multiple exist. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- **"Do not allow any other prices"** — blocks **all other** fixed prices. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- The **Gap Filler** strategy does **not** work if you use "Do not allow lower prices or shorter stays". [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)

---

## 5. Export Price (send a different price to channels)

- The **Export Price** lets you send a different price to channels than is used on the booking page. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- Setup: Fixed Prices → "Channels" tab → enter value in the **"Export Price" field** and set **"Channel Management" = "Use Export Price"**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)

---

## 6. Combined Daily + Fixed price logic

- When **both Daily Prices and Fixed Prices** are in use: the system offers the **lowest available price that meets all your rules**. [extracted 2026-07-28]
  - Source: [wiki → Setting Prices for Booking Channels](https://wiki.beds24.com/index.php/Setting_Prices_for_Booking_Channels)
- General principle: the system **always uses the lowest price it can find**; keep the highest price always available and create lower prices for specific ranges. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)

---

## 7. Seasonal prices via Fixed Prices

- Method 1: use the **Price Multiplier** in the CALENDAR to raise/lower prices by season. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)
- Method 2: set up an **individual Fixed Price for each season**. For each season set the first/last night and the room in the "Rooms" tab. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)
- Fixed Prices default to the booking rule at **(SETTINGS) PROPERTIES -> BOOKING RULES**, overridable per Fixed Price. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)
- To create a new season from an existing one: open the prior Fixed Price, click **"Save Copy"**, then modify name and conditions (min/max stay). [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)
- The calendar view under **PRICES > FIXED PRICES** shows which Fixed Price applies at any time. [extracted 2026-07-28]
  - Source: [wiki → Seasonal Prices](https://wiki.beds24.com/index.php/Seasonal_Prices)

---

## 8. Last-Minute and Early-Bird via Fixed Prices

- **Last-Minute:** normal price with Max days in advance = 999, plus a separate last-minute price at the desired threshold. [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)
- **Early-Bird:** normal price with Max days = 0 (or 1), plus a separate early-bird price at the lead-time threshold. [extracted 2026-07-28]
  - Source: [wiki → Last Minute Prices and Early Booker prices](https://wiki.beds24.com/index.php/Last-Minute_Prices_and_Early_Booker_prices)

---

## 9. Gap Filler (Sell Remaining Single Nights) via Fixed Prices

- **Gap Filler** is an **additional Fixed Price** that closes gaps created by minimum-stay rules. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)
- A min stay + max stay together define the gap size; bookings allowed only for those days and only when a gap exists. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)
- For room types with several units, the gap filler applies only if **a single unit** has a gap while all others are occupied. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)
- Activation: set **"Restriction Strategy" = "Gap Fill"** in the Summary tab of the Fixed Prices. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)
- The Gap Fill Fixed Price applies to a date only when **the number of consecutive nights of availability ≤ the Fixed Price's maximum stay setting**. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)
- The min stay in SETTINGS PROPERTIES->ROOMS->SETUP must be the **same or lower** than in the gap filler; avoid manually entering higher min stays in the calendar. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)
- Gap fill Fixed Prices can be **higher, lower, or the same** as normal prices. [extracted 2026-07-28]
  - Source: [wiki → Sell Remaining Single Nights](https://wiki.beds24.com/index.php/Sell_Remaining_Single_Nights)

---

## 10. Offers and Fixed Prices

- Add the **offer number** in the "Rooms" tab of the Fixed Price. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- Existing Fixed Prices can be **linked to offers with a price offset** via the "Rooms" tab. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)
- Different booking conditions require creating a **new Fixed Price per offer**. [extracted 2026-07-28]
  - Source: [wiki → Offers](https://wiki.beds24.com/index.php/Offers)

---

## 11. Min/Max stay interaction with Fixed Prices

- Min/max stays can be set at **room, offer, and individual price** level. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- At the room level, the **lowest allowed value** for min stay cannot be overridden to an even lower value elsewhere; min stays can only be **increased** in the CALENDAR. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- At the room level, the **highest allowed value** for max stay; max stays can only be **reduced** in the CALENDAR. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- **Restriction strategy** (ROOMS > SETUP) governs how price-level min/max stays apply. **"Stay Through"** = min/max must be met for every night where the price is active. **"Arrival"** = only the check-in date's requirement is enforced. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- Check-in-day-specific rules use the **"Check-in Allowed" tick boxes** on Fixed Prices. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- Seasonal min stays can be handled by **splitting Fixed Prices across date ranges**. [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)
- Min stays can be **pushed to channels** that support them (see Channel Manager Capabilities). [extracted 2026-07-28]
  - Source: [wiki → Minimum Stay and Maximum Stay](https://wiki.beds24.com/index.php/Minimum_Stay_and_Maximum_Stay)

---

## 12. Price multiplier interaction with Fixed Prices

- The multiplier modifies Fixed Prices on a percentage basis, but can be **disabled** by setting **"Allow Multiplier" = No** in the Summary tab of the Fixed Prices. [extracted 2026-07-28]
  - Source: [wiki → Dynamic Multi Calendar](https://wiki.beds24.com/index.php/Dynamic_Multi_Calendar)
- The multiplier range is **50 to 250** and applies to both booking page and channel prices. [extracted 2026-07-28]
  - Source: [wiki → Discounts](https://wiki.beds24.com/index.php/Discounts)

---

## 13. Notes on source coverage

- The wiki pages `Fixed_Prices` and `Category:Fixed_Prices` are **stubs with no content** (the category does not enumerate member pages via Jina). Facts above are drawn from the content pages that describe Fixed Price behavior: Setting Prices for Booking Channels, Seasonal Prices, Discounts, Offers, Sell Remaining Single Nights, Last-Minute/Early-Booker, Minimum Stay, Dynamic Multi Calendar, and Introduction. [extracted 2026-07-28]
  - Sources: [wiki → Fixed Prices](https://wiki.beds24.com/index.php/Fixed_Prices) , [wiki → Category:Fixed Prices](https://wiki.beds24.com/index.php/Category:Fixed_Prices)
