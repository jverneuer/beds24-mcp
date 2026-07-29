# Pricing — Category Index

Facts about Beds24 pricing-related API methods: standard rates, rate links, and daily prices, plus how each connects to OTA/channel sync.

## Child files

- **[rates.md](rates.md)** — `getRates`, `setRate`, `setRates`: retrieve and create/modify/delete dated rate rules with per-occupancy prices, stay-length and advance-booking constraints, and per-channel OTA rate codes. `setRates` supports bulk mixed new/modify/delete in one call.
- **[rate-links.md](rate-links.md)** — `getRateLinks`, `setRateLinks`: the per-rate mechanism that links a base rate (`rateId`+`roomId`+`offerId`) to a channel/offer via an offset method (`linkType`: percentage, per-booking, per-day, per-person-per-day, none, per-period), with a Booking.com rate-code field.
- **[daily-prices.md](daily-prices.md)** — `getDailyPriceSetup`, `setDailyPriceSetup`: per-room daily-price configuration identified by `dailyPriceNumber`, including value-linking between daily prices; the channel-sync-rule detail itself was not available in the fetched sources.

## Overarching pricing topics

- **Rate types** — standard dated rates (`rates.md`) vs. daily prices (`daily-prices.md`); rate links as the offset-based bridge from a base rate to a channel price.
- **OTA price push / channel rate codes** — per-rate OTA codes (`bookingcomRateCode`, `expediacomRateCode`, `feratelRateCode`, `lastminutecomRateCode`, `tablethotelscomRateCode`, `travelocitycomRateCode`) and the `bookingcomRateCode` field on rate links.
- **Channel sync controls** — room-level enable/disable toggles per channel (inventory/price/booking), occupancy sync (`p1Sync`–`p4Sync`), property-level channel connection identifiers and per-channel price multipliers (`airbnbMultiplier`, `bookingComMultiplier`, `vrboMultiplier`, etc.).
- **Pricing granularity** — per-occupancy price fields (`roomPrice`, `1pPrice`, `2pPrice`, `extraPersonPrice`, `extraChildPrice`) each with an enable toggle; stay constraints (`minNights`/`maxNights`, `minAdvance`/`maxAdvance`); pricing `strategy`.
- **Constraints** — rateId auto-assigned on create and immutable afterward; a rate cannot move to a different roomId; partial updates preferred on modify; dailyPriceCount changed via `setProperty`, not `setDailyPriceSetup`; linked daily prices cannot be set directly.
- **API usage rules** — one call at a time, space calls seconds apart, send minimum data, excessive 5-minute usage blocks the account without warning; `apiKey`/`propKey` are 16–64 chars.
