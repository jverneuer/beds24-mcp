# Beds24 API V2.0 — apisourceids (Channel / OTA Source IDs)

> Source: Beds24 Wiki, extracted 2026-07-28 via Jina Reader.
> `apiSourceId` is the numeric source identifier attached to every booking; `apiSource` is its string/URL-friendly alias.

## 1. What apisourceid means

- This page "lists the possible values an API V2 booking apiSourceId can have." Each booking in the system is tagged with a **numeric source ID** and a corresponding **string name** identifying the channel or OTA it originated from. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- The numeric **apiSourceId** is the primary identifier used in API V2 calls and booking records. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- The **apiSource** string is a human-readable / URL-friendly alias for the channel. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- Gaps exist in the numeric sequence (not every integer is assigned). Some channels have **no apiSource string** assigned in this reference. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- The highest standard ID listed is **999** for "Agent". [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- iCal-based channels are split into **distinct IDs**: "Airbnb Ical" (10), "iCal Export" (16), "iCal import 1/2/3" (21/28/29), "Homeaway iCal" (40), and "Google Calendar" (80). [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)

## 2. Complete Channel / OTA Source ID List

| Channel | apiSourceId | apiSource |
| --- | --- | --- |
| Direct | 0 | direct |
| Booking Page | 1 | bookingpage |
| Bookit | 2 | bookitconz |
| NZAA | 3 | *(none listed)* |
| Laterooms | 8 | *(none listed)* |
| Airbnb Ical | 10 | *(none listed)* |
| Flipkey | 12 | flipkey |
| Guestlink | 13 | guestlinkcouk |
| Expedia | 14 | expedia |
| Wimdu | 15 | *(none listed)* |
| iCal Export | 16 | *(none listed)* |
| Agoda | 17 | agoda |
| Travelocity | 18 | *(none listed)* |
| Booking.com | 19 | booking |
| Tripadvisor | 20 | *(none listed)* |
| iCal import 1 | 21 | *(none listed)* |
| Budgetplaces | 22 | *(none listed)* |
| Tablethotels | 23 | tablethotels |
| Hostelworld | 24 | hostelworld |
| Visitscotland | 25 | *(none listed)* |
| Holidaylettings | 26 | *(none listed)* |
| Bedandbreakfast EU | 27 | bedandbreakfasteu |
| iCal import 2 | 28 | *(none listed)* |
| iCal import 3 | 29 | *(none listed)* |
| Homeaway XML | 30 | vrbo |
| Bedandbreakfast NL | 31 | bedandbreakfastnl |
| Atraveo | 32 | atraveo |
| Feratel | 33 | feratel |
| Webrooms NZ | 34 | webroomsconz |
| Lastminute | 35 | lastminute |
| Hotelbeds | 36 | hotelbeds |
| Housetrip | 37 | *(none listed)* |
| Nineflats | 38 | *(none listed)* |
| Homeaway iCal | 40 | *(none listed)* |
| OTA | 42 | ota |
| Trivago | 43 | *(none listed)* |
| Hostellinginternational | 44 | hostelinternational |
| Airbnb XML | 46 | airbnb |
| Tomas | 50 | tomastravel |
| Ostrovok | 51 | ostrovokru |
| Bookeasy AU | 52 | bookeasycomau |
| Ctrip | 53 | trip |
| Asiatravel | 54 | *(none listed)* |
| Tripadvisor Rentals | 55 | tripadvisorrentals |
| Traveloka | 56 | traveloka |
| HRS | 57 | hrs |
| Google | 58 | googleads |
| Despegar | 59 | despegar |
| Vacationstay | 63 | vacationstay |
| Hostelsclub | 64 | hostelsclub |
| eDreams Odigeo | 66 | edreamsodigeo |
| Rezintel | 70 | *(none listed)* |
| Jomres | 72 | jomres |
| Goibibo | 73 | goibibo |
| Travia | 76 | travia |
| Hometogo | 78 | hometogo |
| Google Calendar | 80 | googlecal |
| Traum | 83 | traumferienwohnungen |
| Tiket | 86 | tiket |
| Mariott | 87 | marriott |
| BookVisit | 92 | bookvisit |
| Agent | 999 | agent |

[extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)

## 3. Usage notes

- **Direct = 0** and **Booking Page = 1** are the own-website / manual sources. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- **Booking.com = 19** maps to apiSource `booking`; **Airbnb XML = 46** maps to apiSource `airbnb` (distinct from "Airbnb Ical" = 10). [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- **Google = 58** maps to `googleads`, not a generic Google label. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- **OTA = 42** is the generic `ota` source. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
- **Homeaway XML = 30** maps to apiSource `vrbo`. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)

### Caveat on completeness
- The source table is the canonical reference fetched here. Unlisted integers (e.g. 4–7, 9, 11, 39, 41, 45, 47–49, 60–62, 65, 67–69, 71, 74–75, 77, 79, 81–82, 84–85, 88–91, 93–998) were **not listed** in the fetched reference and may or may not be assigned. [extracted 2026-07-28] [wiki → API V2.0 apisourceids](https://wiki.beds24.com/index.php/API_V2.0_apisourceids)
