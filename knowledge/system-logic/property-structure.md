# Property Structure

How Beds24 organizes properties, rooms, room types, and units — the hierarchy that everything else (pricing, availability, bookings) hangs off of.

## Hierarchy overview

Beds24 uses a three-level hierarchy: **property → room type → room unit**. A property contains one or more room types, and each room type contains one or more individual units.

- A **property** is identified by a unique numeric `propId`. It is the top-level container. [extracted 2026-07-28]
- A **propKey** is a key supplied alongside `apiKey` in the authentication JSON to scope a request to a specific property. It is "as set for the property" in account settings. [extracted 2026-07-28]
- **Rooms** (room types) and **room units** are subordinate data nested under a property — they are returned only when requested via `includeRooms` / `includeRoomUnits` flags on `getProperty`. [extracted 2026-07-28]
- Rooms can be limited by passing `roomIds`/`propIds` arrays; `propId` or `ownerId` must still be specified in that case. [extracted 2026-07-28]

## Room type vs. room unit

A single **room type** is a category of accommodation with a shared configuration; **room units** are the individual physical instances within that type.

- `qty` = "Quantity of this room type" — how many identical units exist. [extracted 2026-07-28]
- `unitNames` lists "each unit name after a new line `\n`". [extracted 2026-07-28]
- `unallocatedUnitName` is the name used when no specific unit is assigned. [extracted 2026-07-28]
- `unitAllocationPerGuest` governs assignment: **0 = one unit per booking, 1 = one unit per guest**. [extracted 2026-07-28]
- Individual units have their own fields: `unitId`, `unitName`, `unitStatusIndex`, `unitStatusText`, `note`. [extracted 2026-07-28]

## Unit assignment on booking

When a booking arrives without a specific unit, the system auto-assigns it.

- If `unitId` is not set for a new booking, "the booking will be auto assigned into an available unit of the specified roomId type." [extracted 2026-07-28]
- `assignBooking` — "Use room dependency settings to assign booking to a different room type or the first free unit within the room type." [extracted 2026-07-28]
- `checkAvailability` — "Do not save the booking if room has no availability." [extracted 2026-07-28]

## Room dependency logic

Rooms can have their availability constrained by other rooms, up to 12 linked rooms per type.

- `dependentRoomId1`–`dependentRoomId12` link a room to up to 12 other rooms, where **0 = none**. [extracted 2026-07-28]
- `dependentRoomLogic` defines how the dependency is evaluated: **0 = All rooms, 1 = Any room, 2 = Sum of all bookings**. This implements AND, OR, and cumulative-booking constraints respectively. [extracted 2026-07-28]
- `includeBookingsRoomId1`–`includeBookingsRoomId12` pull bookings counted into this room's availability ("Room Id, 0=none"). [extracted 2026-07-28]

## Booking assignment across rooms

Bookings can be routed to or mirrored on other room types.

- `assignBookingsRoomId1` — "Assign bookings to Room" with **0 = this room**. [extracted 2026-07-28]
- `assignBookingsRoomId2`–`assignBookingsRoomId4` — "Assign a copy booking to Room" with **0 = none**. This lets one physical booking be counted against multiple room types. [extracted 2026-07-28]

## Overbooking protection scope

Capacity enforcement can be applied at two granularities.

- `overbookingProtection` sets the boundary: **0 = room, 1 = property** — meaning protection applies either per individual room type or aggregated across the entire property. [extracted 2026-07-28]

## Modification rules

- A property request "must have an action element with a value of modify to allow any changes." [extracted 2026-07-28]
- Each room can have an action of **new, modify, or delete**; "If the action element is missing or not one of these values no change will be made to that room." [extracted 2026-07-28]
- When modifying, "It is not necessary to include all data fields. Only include the fields that are being changed." [extracted 2026-07-28]

## Sources

- https://www.beds24.com/api/json/getProperty — propId/propKey, includeRooms/includeRoomUnits, room dependency, overbooking protection, booking assignment fields
- https://www.beds24.com/api/json/setProperty — action rules for property and rooms
- https://www.beds24.com/api/json/setBooking — unit auto-assignment, assignBooking, checkAvailability
- https://www.beds24.com/api/json/getAvailabilities — roomIds/propIds filtering
