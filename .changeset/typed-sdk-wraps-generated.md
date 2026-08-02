---
"beds24-sdk-client": minor
---

Make SDK strictly typed against generated OpenAPI types. Every SDK type now wraps a generated `openapi-typescript` type instead of redefining wire fields: `BookingCreate`/`BookingUpdate` wrap `newBooking`+`bookingActions`, `CalendarWrite`/`FixedPriceWrite` are generated-element aliases, `ChannelSettings` is the union of the four generated post shapes, `WebhookPayload` wraps the inline generated body, and enum constants (`BookingStatus`, `OverrideCode`) are locked to the spec with `satisfies`.
