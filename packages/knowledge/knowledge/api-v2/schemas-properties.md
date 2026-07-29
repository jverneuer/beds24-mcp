# Beds24 API V2 — Property, Room, PriceRules, Offer Schemas

> Extracted from `docs/beds-facts/apiV2.yaml` (components/schemas block).
> Source lines: `property` @ 3887, `room` @ 5016, `priceRules` @ 5351, `offer` @ 5749.

---

## `property`

- **Base type:** `object`
- **Used in:** Responses **and** Requests
  - Response: `GET /properties` (200, `data[]` items) — line 1745
  - Request: `POST /properties` (request body array items, "Beta - Create or modify properties") — line 1765
- **Notes:** This is the largest schema (~1130 lines). It includes the property's own fields plus nested `roomTypes[]` (references `room`), `offers[]` (references `offer`), and many configuration objects. Multi-language `text` blocks use `allOf` with the `textLanguages` schema (adds a `language` enum field).

### Top-level fields

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `account` | object | No | Read-only info about the account. |
| `account.ownerId` | integer | No | Account owner ID. |
| `account.unitStatuses` | array | No | Possible statusText values for units. |
| `account.unitStatuses[].text` | string | No | Status text value. |
| `account.unitStatuses[].color` | string | No | Status color. |
| `id` | integer | No | Property ID. |
| `name` | string | No | Property name. |
| `propertyType` | string | No | Enum: `apartment`, `bedAndBreakfast`, `cabin`, `guesthouse`, `hostel`, `hotel`, `house`, `villa`, `aparthotel`, `barn`, `boat`, `boutiqueHotel`, `building`, `bungalow`, `camping`, `caravan`, `casaParticular`, `castle`, `chacara`, `chalet`, `chateau`, `condo`, `cottage`, `House`, `estate`, `farmhouse`, `heritageHotel`, `houseBoat`, `lodge`, `loft`, `mas`, `mill`, `mobileHome`, `recreationalVehicle`, `resort`, `riad`, `servicedApartment`, `studio`, `tent`, `tour`, `tower`, `townhome`, `treeHouse`, `yacht`. |
| `currency` | string | No | Property currency. |
| `address` | string | No | Street address. |
| `city` | string | No | City. |
| `state` | string | No | State / region. |
| `country` | string | No | Country code. maxLength: 2, example: `"DE"`. |
| `postcode` | string | No | Postal / ZIP code. |
| `latitude` | number | No | Latitude. |
| `longitude` | number | No | Longitude. |
| `phone` | string | No | Phone number. |
| `mobile` | string | No | Mobile number. |
| `fax` | string | No | Fax number. |
| `email` | string | No | Email address. |
| `web` | string | No | Website URL. |
| `contactFirstName` | string | No | Contact first name. |
| `contactLastName` | string | No | Contact last name. |
| `checkInStart` | string | No | Earliest check-in time (15-min granularity). Enum `"00:00"` .. `"24:00"`. |
| `checkInEnd` | string | No | Latest check-in time. Enum `"00:00"` .. `"24:00"`. |
| `checkOutEnd` | string | No | Latest check-out time. Enum `"00:00"` .. `"24:00"`. |
| `offerType` | string | No | Enum: `perRoom`, `perProperty`. |
| `sellPriority` | integer | No | min 1, max 100, nullable. Set to null to hide. |
| `controlPriority` | integer | No | min 1, max 100, nullable. Set to null to hide. |
| `bookingPageMultiplier` | string | No | Booking page multiplier. |
| `permit` | string | No | Permit number. |
| `roomChargeDisplay` | string | No | Enum: `onePerBooking`, `onePerDate`. |
| `templates` | object | No | Up to 8 template strings. |
| `templates.template1` .. `templates.template8` | string | No | Template content strings. |
| `bookingRules` | object | No | Booking / pricing rules. |
| `bookingRules.bookingType` | string | No | Enum: `blackoutPeriod`, `autoConfirmed`, `requestWithManualConfirmation`, `requestWithCreditCard`, `confirmedWithCreditCard`, `confirmedWithDepositCollection1`, `confirmedWithDepositCollection2`. |
| `bookingRules.bookingNearTypeDays` | integer | No | min 0, max 60, nullable. 0 = same day arrival; null = disabled. |
| `bookingRules.bookingNearType` | string | No | Same enum as `bookingType`. |
| `bookingRules.bookingExceptionalType` | string | No | Same enum as `bookingType`. |
| `bookingRules.bookingExceptionalTypeStart` | string (date) | No | Exception period start. |
| `bookingRules.bookingExceptionalTypeEnd` | string (date) | No | Exception period end. |
| `bookingRules.bookingCutOffHour` | integer | No | min 0, max 24. |
| `bookingRules.dailyPriceStrategy` | string | No | Enum: `allowLower`, `doNotAllowLower`, `doNotAllowOtherRates`. |
| `bookingRules.dailyPriceType` | string | No | Enum: `default`, `requestWithManualConfirmation`, `requestWithCreditCard`, `confirmedWithCreditCard`, `confirmedWithDepositCollection1`, `confirmedWithDepositCollection2`. |
| `bookingRules.vatRatePercentage` | number | No | VAT rate percentage. |
| `bookingRules.priceRounding` | string | No | Enum: `+1000.00`, `+500.00`, `+200.00`, `+100.00`, `+50.00`, `+20.00`, `+10.00`, `+5.00`, `+2.00`, `+1.00`, `+0.50`, `+0.20`, `+0.10`, `none`, `nearestOne`, `nearestTen`, `nearestHundred`, `nearestThousand`, `-0.10`, `-0.20`, `-0.50`, `-1.00`, `-2.00`, `-5.00`, `-10.00`, `-20.00`, `-50.00`, `-100.00`, `-200.00`, `-500.00`, `-1000.00`. |
| `bookingRules.allowGuestCancellation` | object | No | Guest cancellation rule. |
| `bookingRules.allowGuestCancellation.type` | string | No | Enum: `always`, `never`, `daysBeforeArrival`. |
| `bookingRules.allowGuestCancellation.daysBeforeArrivalValue` | integer | No | min 1, max 360, nullable. Used when type = `daysBeforeArrival`. |
| `paymentCollection` | object | No | Deposit / payment collection config. |
| `paymentCollection.depositNonPayment` | string | No | Enum: `request`, `cancel`. |
| `paymentCollection.depositPayment1` | object | No | First deposit payment. |
| `paymentCollection.depositPayment1.fixedAmount` | number | No | Fixed deposit amount. |
| `paymentCollection.depositPayment1.variableAmount` | object | No | Variable deposit. |
| `paymentCollection.depositPayment1.variableAmount.type` | string | No | Enum: `percentage`, `firstNight`. |
| `paymentCollection.depositPayment1.variableAmount.percentageValue` | integer | No | min 0, max 100, nullable. Used when type = `percentage`. |
| `paymentCollection.depositPayment2` | object | No | Second deposit payment (same shape as depositPayment1). |
| `paymentCollection.depositPayment2.fixedAmount` | number | No | Fixed deposit amount. |
| `paymentCollection.depositPayment2.variableAmount.type` | string | No | Enum: `percentage`, `firstNight`. |
| `paymentCollection.depositPayment2.variableAmount.percentageValue` | integer | No | min 0, max 100, nullable. |
| `paymentGateways` | object | No | Per-gateway config (each has `type` + `priority`). |
| `paymentGateways.stripe` | object | No | Stripe gateway. |
| `paymentGateways.stripe.type` | string | No | Enum: `enable`, `disable`, `internal`. |
| `paymentGateways.stripe.priority` | integer | No | min 1, max 10. |
| `paymentGateways.stripe.saveAllCards` | boolean | No | Save all cards. |
| `paymentGateways.stripe.capture` | boolean | No | Capture payments. |
| `paymentGateways.stripe.checkoutVersion` | string | No | Enum: `embedded`, `hosted`. |
| `paymentGateways.stripe.paymentDescription` | string | No | Payment description. |
| `paymentGateways.asiapay` | object | No | Asiapay gateway. |
| `paymentGateways.asiapay.type` | string | No | Enum: `enable`, `disable`. |
| `paymentGateways.asiapay.priority` | integer | No | min 1, max 10. |
| `paymentGateways.authorizenet` | object | No | Authorize.net gateway (`type`, `priority`). |
| `paymentGateways.bitpay` | object | No | BitPay gateway (`type`, `priority`). |
| `paymentGateways.borgun` | object | No | Borgun gateway (`type`, `priority`). |
| `paymentGateways.creditCard` | object | No | Credit card gateway (`type`, `priority`). |
| `paymentGateways.customGateway` | object | No | Custom gateway (`type`, `priority`). |
| `paymentGateways.globalPayments1` | object | No | Global Payments 1 gateway (`type`, `priority`). |
| `paymentGateways.globalPayments2` | object | No | Global Payments 2 gateway (`type`, `priority`). |
| `paymentGateways.offlinePayment` | object | No | Offline payment gateway (`type`, `priority`). |
| `paymentGateways.paymill` | object | No | Paymill gateway (`type`, `priority`). |
| `paymentGateways.paypal` | object | No | PayPal gateway (`type`, `priority`). |
| `cardSettings` | object | No | Accepted card brands / CVV requirement. |
| `cardSettings.cardRequireCVV` | boolean | No | Require CVV. |
| `cardSettings.cardAcceptAmex` | boolean | No | Accept Amex. |
| `cardSettings.cardAcceptDiners` | boolean | No | Accept Diners. |
| `cardSettings.cardAcceptDiscover` | boolean | No | Accept Discover. |
| `cardSettings.cardAcceptEnroute` | boolean | No | Accept EnRoute. |
| `cardSettings.cardAcceptJcb` | boolean | No | Accept JCB. |
| `cardSettings.cardAcceptMaestro` | boolean | No | Accept Maestro. |
| `cardSettings.cardAcceptMaster` | boolean | No | Accept Mastercard. |
| `cardSettings.cardAcceptUnionpay` | boolean | No | Accept UnionPay. |
| `cardSettings.cardAcceptVisa` | boolean | No | Accept Visa. |
| `cardSettings.cardAcceptVoyager` | boolean | No | Accept Voyager. |
| `groupKeywords` | array of string | No | Group keywords. |
| `oneTimeVouchers` | array | No | One-time vouchers. |
| `oneTimeVouchers[].phrase` | string | No | Voucher phrase. |
| `oneTimeVouchers[].discount` | number | No | Discount amount. |
| `discountVouchers` | array | No | Discount vouchers. |
| `discountVouchers[].number` | integer | No | min 1, max 8. |
| `discountVouchers[].phrase` | string | No | Voucher phrase. |
| `discountVouchers[].discount` | number | No | Discount amount. |
| `discountVouchers[].type` | string | No | Enum: `notUsed`, `percentage`, `roomOnlyPercentage`, `extrasOnlyPercentage`, `fixedAmount`, `fixedAmountPerNight`, `compulsory`. |
| `featureCodes` | array | No | Feature codes (array of array of string). |
| `texts` | array | No | Multi-language text blocks. Each item = `allOf(textLanguages)` + the language-specific fields below. |
| `texts[].language` | string | No | (from textLanguages) Enum: `en`, `ar`, `bg`, `ca`, `cs`, `da`, `de`, `el`, `es`, `et`, `fi`, `fr`, `hr`, `he`, `hu`, `id`, `is`, `it`, `ja`, `ko`, `lt`, `mn`, `my`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `th`, `tr`, `vi`, `zh`, `zt`. |
| `texts[].houseRules` | string | No | House rules text. |
| `texts[].directions` | string | No | Directions text. |
| `texts[].headline` | string | No | Headline. |
| `texts[].propertyDescription` | string | No | Property description. |
| `texts[].propertyDescription1` | string | No | Property description 1. |
| `texts[].propertyDescription2` | string | No | Property description 2. |
| `texts[].propertyDescriptionBookingPage1` | string | No | Booking page description 1. |
| `texts[].propertyDescriptionBookingPage2` | string | No | Booking page description 2. |
| `texts[].guestDetailsHeader` | string | No | Guest details header. |
| `texts[].guestEnquiryHeader` | string | No | Guest enquiry header. |
| `texts[].confirmBookingButtonMessage` | string | No | Confirm booking button message. |
| `texts[].roomNotAvailableMessage` | string | No | Room not available message. |
| `texts[].roomNoPriceMessage` | string | No | Room no price message. |
| `texts[].noRoomsAvailableMessage` | string | No | No rooms available message. |
| `texts[].generalPolicy` | string | No | General policy. |
| `texts[].cancellationPolicy` | string | No | Cancellation policy. |
| `texts[].locationDescription` | string | No | Location description. |
| `texts[].customQuestion1` .. `customQuestion10` | string | No | Custom booking questions 1-10. |
| `texts[].upsellItemName1` .. `upsellItemName20` | string | No | Upsell item names 1-20. |
| `texts[].upsellItemDescription1` .. `upsellItemDescription20` | string | No | Upsell item descriptions 1-20. |
| `texts[].offerName1` .. `offerName16` | string | No | Offer names 1-16. |
| `texts[].offerDescription1` .. `offerDescription16` | string | No | Offer descriptions 1-16. |
| `texts[].offerMoreDetail1` .. `offerMoreDetail16` | string | No | Offer more detail 1-16. |
| `texts[].offerMarketing1` .. `offerMarketing16` | string | No | Offer marketing 1-16. |
| `offers` | array | No | Property-level offers. Items `$ref: offer`. |
| `roomTypes` | array | No | Room types. Items `$ref: room`. |
| `upsellItems` | array | No | Upsell items (max index 7). |
| `upsellItems[].index` | integer | No | min 1, max 7. |
| `upsellItems[].enable` | boolean | No | Whether enabled. |
| `upsellItems[].type` | string | No | Enum: `notUsed`, `optional`, `optionalQty`, `optionalPercentage`, `obligatory`, `obligatoryCleaning`, `obligatoryTax`, `obligatoryPercentTax`, `obligatoryPercent`. |
| `upsellItems[].amount` | number | No | Upsell amount. |
| `upsellItems[].per` | string | No | Enum: `booking`, `room`, `person`, `adult`, `child`. |
| `upsellItems[].period` | string | No | Enum: `oneTime`, `daily`, `dailyPlusOne`, `weekly`, `refundable`. |
| `upsellItems[].vat` | number | No | VAT amount. |
| `bookingQuestions` | object | No | Booking page question config. Each sub-key has `order` (integer) + `usage` (enum), custom questions also have `type`. |
| `bookingQuestions.guestTitle` | object | No | Guest title field. |
| `bookingQuestions.guestFirstName` | object | No | Guest first name field. |
| `bookingQuestions.guestLastName` | object | No | Guest last name field. |
| `bookingQuestions.guestEmail` | object | No | Guest email field. |
| `bookingQuestions.guestPhone` | object | No | Guest phone field. |
| `bookingQuestions.guestMobile` | object | No | Guest mobile field. |
| `bookingQuestions.guestFax` | object | No | Guest fax field. |
| `bookingQuestions.guestCompany` | object | No | Guest company field. |
| `bookingQuestions.guestAddress` | object | No | Guest address field. |
| `bookingQuestions.guestCity` | object | No | Guest city field. |
| `bookingQuestions.guestState` | object | No | Guest state field. |
| `bookingQuestions.guestPostcode` | object | No | Guest postcode field. |
| `bookingQuestions.guestCountryText` | object | No | Guest country (text) field. |
| `bookingQuestions.guestCountrySelect` | object | No | Guest country (selector) field. |
| `bookingQuestions.guestArrivalTime` | object | No | Guest arrival time field. |
| `bookingQuestions.guestComments` | object | No | Guest comments field. |
| `bookingQuestions.customQuestion1` .. `customQuestion10` | object | No | Custom questions; each adds `type` enum: `singleLineField`, `multiLineField`, `multipleList`, `multipleSelect`, `tickBox`, `dateSelector`. |
| `*.order` | integer | No | (all bookingQuestions sub-keys) Display/order index. |
| `*.usage` | string | No | (all bookingQuestions sub-keys) Enum: `notUsed`, `optional`, `compulsory`, `compulsoryBookingPage`, `internal`. |
| `webhooks` | object | No | Webhook configuration. |
| `webhooks.version` | string | No | Enum: `one`, `twoNoPersonalData`, `twoWithPersonalData`. |
| `webhooks.url` | string | No | Webhook URL. |
| `webhooks.additionalData` | string | No | Enum: `none`, `CVC`, `token`, `CVCAndToken`. |
| `webhooks.customHeader` | string | No | Custom header(s). example: `"header-name: header-value"`. Multiple headers on separate lines. |

> The `searchCriteria` block (searchCategory1-4 booleans) is commented out in the source.

**Used by:** `GET /properties`, `POST /properties` (and referenced by `roomTypes[]`→`room`, `offers[]`→`offer`).

---

## `room`

- **Base type:** `object`
- **Used in:** Responses **and** Requests
  - Response: `GET /properties/rooms` (200, `data[]` items) — line 2013
  - Request: nested inside `POST /properties` as `roomTypes[]` items — line 4707
- **Notes:** Room type / unit definition. `texts[]` uses `allOf(textLanguages)`. `units[]` holds the physical units. `priceRules[]` references `priceRules`, `offers[]` references `offer`.

### Fields

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `id` | integer | No | Room ID. |
| `propertyId` | integer | No | Parent property ID. |
| `name` | string | No | Room name. |
| `roomType` | string | No | Enum: `single`, `double`, `twin`, `twinDouble`, `triple`, `quadruple`, `apartment`, `family`, `suite`, `studio`, `dormitoryRoom`, `bedInDormitory`, `bungalow`, `chalet`, `holidayHome`, `villa`, `mobileHome`, `tent`, `campSite`, `activity`, `tour`, `carRental`. |
| `qty` | integer | No | Quantity. min 1, max 99. |
| `minPrice` | number | No | Minimum price. |
| `maxPeople` | integer | No | Maximum total people. |
| `maxAdult` | integer | No | nullable, min 1, max 99. Cannot exceed `maxPeople`. null = defaults to maxPeople. |
| `maxChildren` | integer | No | nullable, min 0, max 99. Cannot exceed `maxPeople`. 0 = no children; null = no distinction. |
| `minStay` | integer | No | nullable, min 1, max 365. Minimum nights. |
| `maxStay` | integer | No | nullable, min 1, max 365. Maximum nights. |
| `restrictionStrategy` | string | No | Enum: `firstNight`, `stayThrough`. |
| `taxPercentage` | number | No | Tax percentage. |
| `taxPerson` | number | No | Tax per person. |
| `rackRate` | number | No | Rack rate. |
| `cleaningFee` | number | No | Cleaning fee. |
| `securityDeposit` | number | No | Security deposit. |
| `sellPriority` | integer | No | min 1, max 100, nullable. Set to null to hide. |
| `roomSize` | integer | No | nullable, min 1, max 2000. Room size in square meters. |
| `highlightColor` | string | No | Highlight color. |
| `includeReports` | boolean | No | Include in reports. |
| `overbookingProtection` | string | No | Enum: `room`, `property`. |
| `blockAfterCheckOutDays` | integer | No | min 0, max 7. Block days after checkout. |
| `controlPriority` | integer | No | min 1, max 100, nullable. Set to null to hide. |
| `dependencies` | object | No | Room dependency / combination logic. |
| `dependencies.includeSubDependencies` | boolean | No | Include sub-dependencies. |
| `dependencies.combinationLogic` | object | No | Combination logic. |
| `dependencies.combinationLogic.type` | string | No | Enum: `sumAllBookings`, `allRoomsAvailable`, `anyRoomAvailable`, `noUnitsAvailable`, `numberOfUnitsAvailable`, `numberOfUnitsAvailableOrLess`. |
| `dependencies.combinationLogic.numberOfUnitsValue` | integer | No | min 1, max 99, nullable. Used for `numberOfUnitsAvailable` / `numberOfUnitsAvailableOrLess`. |
| `dependencies.includeBookingsRoomId1` .. `includeBookingsRoomId12` | integer | No | nullable. Rooms whose bookings are included. |
| `dependencies.dependentRoomId1` .. `dependentRoomId12` | integer | No | nullable. Dependent room IDs. |
| `dependencies.assignBookingsTo` | object | No | Assign bookings target. |
| `dependencies.assignBookingsTo.type` | string | No | Enum: `thisRoom`, `firstAvailableDependencyRoom`, `firstAvailableSubDependencyRoom`, `allDependencyRooms`, `roomId`. |
| `dependencies.assignBookingsTo.roomIdValue` | integer | No | Room ID when type = `roomId`. |
| `templates` | object | No | Up to 8 template strings. |
| `templates.template1` .. `templates.template8` | string | No | Template content strings. |
| `texts` | array | No | Multi-language text blocks (`allOf(textLanguages)` + room fields). |
| `texts[].language` | string | No | (from textLanguages) Language enum (see property). |
| `texts[].displayName` | string | No | Display name. |
| `texts[].accommodationType` | string | No | Accommodation type. |
| `texts[].roomDescription` | string | No | Room description. |
| `texts[].auxiliary` | string | No | Auxiliary text. |
| `texts[].marketing` | string | No | Marketing text. |
| `texts[].contentHeadline` | string | No | Content headline. |
| `texts[].contentDescription` | string | No | Content description. |
| `unitAllocation` | string | No | Enum: `perBooking`, `perGuest`. |
| `unallocatedUnit` | object | No | Unallocated unit name placeholders. |
| `unallocatedUnit.name` .. `name8` | string | No | Unallocated unit name variants. |
| `units` | array | No | Physical units. |
| `units[].id` | integer | No | min 1. Unit ID. |
| `units[].name` .. `name8` | string | No | Unit name variants. |
| `units[].statusColor` | string | No | Unit status color. |
| `units[].statusText` | string | No | Unit status text. |
| `units[].note` | string | No | Unit note. |
| `offers` | array | No | Room-level offers. Items `$ref: offer`. |
| `featureCodes` | array | No | Feature codes (array of array of string). |
| `priceRules` | array | No | Room-level price rules. Items `$ref: priceRules`. |

**Used by:** `GET /properties/rooms`, `POST /properties` (as `roomTypes[]`).

---

## `priceRules`

- **Base type:** `object`
- **Used in:** Responses **and** Requests
  - Nested inside `room.priceRules[]` — line 5350 (and `GET /properties` / `POST /properties` via roomTypes→room when `includePriceRules` is set)
- **Notes:** Defines a single price rule (max 16 per room, `id` 1-16). Has channel distribution flags, linking, stay/occupancy constraints, and per-channel rate codes.

### Fields

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `id` | integer | No | Price rule ID. min 1, max 16. |
| `name` | string | No | Price rule name. |
| `priceFor` | object | No | Pricing model. |
| `priceFor.type` | string | No | Enum: `perPerson`, `maxCapacity`, `upToPerson`. example: `"upToPerson"`. |
| `priceFor.upToPersonValue` | integer | No | min 1, max 99, nullable. Max occupancy when type = `upToPerson`. example: 5. |
| `extraPerson` | number (double) | No | min 0. Extra person charge. |
| `extraChild` | number (double) | No | min 0. Extra child charge. |
| `minimumStay` | integer | No | min 1, max 30. |
| `maximumStay` | integer | No | min 1, max 365. |
| `offer` | integer | No | min 1, max 16. Linked offer ID. |
| `minDaysUntilCheckin` | integer | No | min 0, max 999. Earliest days before check-in. |
| `maxDaysUntilCheckin` | integer | No | min 0, max 999. Latest days before check-in. |
| `color` | string | No | Price rule color. |
| `priceLinking` | object | No | Link this price to another price. |
| `priceLinking.roomId` | integer | No | nullable. Linked room ID. |
| `priceLinking.priceId` | integer | No | min 1, max 16, nullable. Linked price rule ID. null = disabled. |
| `priceLinking.offsetMultiplier` | number | No | default 1, nullable, min 0.1, max 9.99. |
| `priceLinking.offsetAmount` | number | No | nullable. Fixed offset amount. |
| `agentCodes` | array of string | No | Agent codes. |
| `bookingPage` | object | No | Booking page visibility. |
| `bookingPage.direct` | boolean | No | Show on direct booking page. |
| `bookingPage.agent` | boolean | No | Show on agent booking page. |
| `channels` | object | No | Per-channel distribution settings. Each channel has `enabled` (boolean); most also have `rateCode` (string). |
| `channels.agoda.enabled` | boolean | No | Enable on Agoda. |
| `channels.agoda.rateCode` | string | No | Agoda rate code. |
| `channels.airbnb.enabled` | boolean | No | Enable on Airbnb. |
| `channels.airbnb.rateCode` | string | No | Airbnb rate code. |
| `channels.atraveode.enabled` | boolean | No | Enable on AtráveoDE. |
| `channels.bedandbreakfasteu.enabled` | boolean | No | Enable on BedandBreakfast.eu. |
| `channels.bedandbreakfastnl.enabled` | boolean | No | Enable on BedandBreakfast.nl. |
| `channels.bookeasycomau.enabled` | boolean | No | Enable on BookEasy.com.au. |
| `channels.booking.enabled` | boolean | No | Enable on Booking.com. |
| `channels.booking.rateCode` | string | No | Booking.com rate code. |
| `channels.bookitconz.enabled` | boolean | No | Enable on Bookit.co.nz. |
| `channels.trip.enabled` | boolean | No | Enable on Trip.com. |
| `channels.trip.rateCode` | string | No | Trip.com rate code. |
| `channels.despegar.enabled` | boolean | No | Enable on Despegar. |
| `channels.despegar.rateCode` | string | No | Despegar rate code. |
| `channels.edreamsodigeo.enabled` | boolean | No | Enable on eDreams ODIGEO. |
| `channels.edreamsodigeo.rateCode` | string | No | eDreams ODIGEO rate code. |
| `channels.expedia.enabled` | boolean | No | Enable on Expedia. |
| `channels.expedia.rateCode` | string | No | Expedia rate code. |
| `channels.feratel.enabled` | boolean | No | Enable on Feratel. |
| `channels.feratel.rateCode` | string | No | Feratel rate code. |
| `channels.flipkey.enabled` | boolean | No | Enable on Flipkey. |
| `channels.goibibo.enabled` | boolean | No | Enable on Goibibo. |
| `channels.goibibo.rateCode` | string | No | Goibibo rate code. |
| `channels.guestlinkcouk.enabled` | boolean | No | Enable on GuestLink.co.uk. |
| `channels.hometogo.enabled` | boolean | No | Enable on HomeToGo. |
| `channels.hostelinternational.enabled` | boolean | No | Enable on Hostel International. |
| `channels.hostelsclub.enabled` | boolean | No | Enable on Hostels Club. |
| `channels.hostelworld.enabled` | boolean | No | Enable on Hostelworld. |
| `channels.hostelworld.rateCode` | string | No | Hostelworld rate code. |
| `channels.hotelbeds.enabled` | boolean | No | Enable on Hotelbeds. |
| `channels.hotelbeds.rateCode` | string | No | Hotelbeds rate code. |
| `channels.hrs.enabled` | boolean | No | Enable on HRS. |
| `channels.hrs.rateCode` | string | No | HRS rate code. enum: `standardDoubleHRS1`, `standardDoubleTrade1`, `standardDoubleSpecial1`, `standardDoubleWeekend1`, `standardDoubleHotdeal1`, `standardDoubleTrade2`, `standardDoubleSpecial2`, `standardDoubleHotdeal2`, `standardDoubleTrade3`, `standardDoubleSpecial3`, `standardDoubleHotdeal3`, `standardSingleHRS1`, `standardSingleTrade1`, `standardSingleSpecial1`, `standardSingleWeekend1`, `standardSingleHotdeal1`, `standardSingleTrade2`, `standardSingleSpecial2`, `standardSingleHotdeal2`, `standardSingleTrade3`, `standardSingleSpecial3`, `standardSingleHotdeal3`, `3BedRoom`, `4BedRoom`, `doubleApartment`, `doubleBalcony`, `doubleBudget`, `doubleBusiness`, `doubleComfort`, `doubleFamily`, `doubleJuniorSuite`, `doubleLakeView`, `doubleSeaView`, `doubleMountainView`, `doublePoolView`, `doubleRiverView`, `doubleSuite`, `doubleTerrace`, `singleApartment`, `singleBalcony`, `singleBudget`, `singleBusiness`, `singleComfort`, `singleFamily`, `singleJuniorSuite`, `singleLakeView`, `singleSeaView`, `singleMountainView`, `singlePoolView`, `singleRiverView`, `singleSuite`, `singleTerrace`. |
| `channels.jomres.enabled` | boolean | No | Enable on Jomres. |
| `channels.jomres.rateCode` | string | No | Jomres rate code. |
| `channels.lastminute.enabled` | boolean | No | Enable on Lastminute. |
| `channels.lastminute.rateCode` | string | No | Lastminute rate code. |
| `channels.marriott.enabled` | boolean | No | Enable on Marriott. |
| `channels.ostrovokru.enabled` | boolean | No | Enable on Ostrovok.ru. |
| `channels.ostrovokru.rateCode` | string | No | Ostrovok.ru rate code. |
| `channels.ota.enabled` | boolean | No | Enable on OTA. |
| `channels.ota.rateCode` | string | No | OTA rate code. |
| `channels.reserva.enabled` | boolean | No | Enable on Reserva. |
| `channels.reserva.rateCode` | string | No | Reserva rate code. |
| `channels.tablethotels.enabled` | boolean | No | Enable on Tablethotels. |
| `channels.tablethotels.rateCode` | string | No | Tablethotels rate code. |
| `channels.tiket.enabled` | boolean | No | Enable on Tiket. |
| `channels.tiket.rateCode` | string | No | Tiket rate code. |
| `channels.tomastravel.enabled` | boolean | No | Enable on TomasTravel. |
| `channels.tomastravel.rateCode` | string | No | TomasTravel rate code. |
| `channels.traumferienwohnungen.enabled` | boolean | No | Enable on Traum-Ferienwohnungen. |
| `channels.traveloka.enabled` | boolean | No | Enable on Traveloka. |
| `channels.traveloka.rateCode` | string | No | Traveloka rate code. |
| `channels.travia.enabled` | boolean | No | Enable on Travia. |
| `channels.travia.rateCode` | string | No | Travia rate code. |
| `channels.tripadvisorrentals.enabled` | boolean | No | Enable on TripAdvisor Rentals. |
| `channels.vacationstay.enabled` | boolean | No | Enable on VacationStay. |
| `channels.vrbo.enabled` | boolean | No | Enable on Vrbo. |
| `channels.webroomsconz.enabled` | boolean | No | Enable on Webrooms.co.nz. |
| `upsellItems` | array | No | Upsell items allowed for this price rule. |
| `upsellItems[].index` | integer | No | Upsell item index. |
| `upsellItems[].enable` | boolean | No | Whether the upsell item is allowed for this price rule. |
| `voucherCodes` | array | No | Voucher codes for this price rule. |
| `voucherCodes[].index` | integer | No | Voucher code index. |
| `voucherCodes[].enabled` | boolean | No | Whether enabled. |

**Used by:** `room.priceRules[]` (so flows through `GET /properties/rooms`, `POST /properties`, and `GET /properties?includePriceRules`).

---

## `offer`

- **Base type:** `object`
- **Used in:** Responses **and** Requests
  - Nested inside `property.offers[]` — line 4703
  - Nested inside `room.offers[]` — line 5340
  - Used by `GET /inventory/rooms/offers` (via `offerResponse`) — line 991
- **Notes:** Defines a sales offer with availability, booking type, stay length, and cancellation rule.

### Fields

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `offerId` | number | No | Offer ID. |
| `enable` | string | No | Enum: `onlyIfAvailable`, `no`, `always`, `internal`, `internalManual`. |
| `name` | string | No | Offer name. |
| `position` | integer | No | min 1, max 16. Display position. |
| `bookingType` | string | No | Enum: `default`, `requestWithManualConfirmation`, `requestWithCreditCard`, `confirmedWithCreditCard`, `confirmedWithDepositCollection1`, `confirmedWithDepositCollection2`. |
| `minimumStay` | object | No | Minimum stay rule. |
| `minimumStay.type` | string | No | Enum: `numberOfDays`, `default`. |
| `minimumStay.numberOfDaysValue` | integer | No | nullable, min 1, max 99. Used when type = `numberOfDays`. |
| `allowCancellation` | object | No | Cancellation rule. |
| `allowCancellation.type` | string | No | Enum: `daysBeforeArrival`, `propertyRule`, `always`, `never`. |
| `allowCancellation.daysBeforeArrivalValue` | integer | No | nullable, min 1, max 360. Used when type = `daysBeforeArrival`. |

**Used by:** `GET /inventory/rooms/offers` (as `offerResponse`), `property.offers[]`, `room.offers[]` (so also `GET /properties`, `GET /properties/rooms`, `POST /properties`).

---

## Supporting schema: `textLanguages`

- **Base type:** `object`
- **Used by:** `property.texts[]` and `room.texts[]` via `allOf` (so each text item carries a `language` plus the language-specific strings).

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `language` | string | No | Enum: `en`, `ar`, `bg`, `ca`, `cs`, `da`, `de`, `el`, `es`, `et`, `fi`, `fr`, `hr`, `he`, `hu`, `id`, `is`, `it`, `ja`, `ko`, `lt`, `mn`, `my`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `th`, `tr`, `vi`, `zh`, `zt`. |
