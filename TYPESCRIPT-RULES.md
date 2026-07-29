# TypeScript Development Rules

These rules are the standard for this codebase. Every PR, every AI-generated
snippet, and every hand-written file follows them. They exist so the intended
behavior lives in the types — never in tribal knowledge.

## 1. Always enable strict TypeScript

Never write TypeScript with relaxed compiler settings.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Ambiguity creates bugs and forces LLMs to guess.

## 2. Every important data structure must have a type

```ts
// Bad
const booking = { id: "123", nights: 5 };

// Good
interface Booking {
	id: string;
	nights: number;
}
const booking: Booking = { id: "123", nights: 5 };
```

If data crosses a module boundary, it must have an explicit type.

## 3. Never use `any`

```ts
// Forbidden
function process(data: any) {}

// Required
function process(data: Booking) {}

// If unknown data exists
function process(data: unknown) {}
// then validate.
```

## 4. Prefer interfaces for domain objects

Use interfaces for things that represent real entities.

```ts
interface Listing {
	id: string;
	title: string;
	price: number;
}
```

## 5. Use type aliases for states and constraints

```ts
// Good
type BookingStatus = "pending" | "confirmed" | "cancelled";

// Bad
status: string;
```

If values come from a known set, encode that set.

## 6. Model states explicitly

Never represent state with combinations of nullable fields.

```ts
// Bad — allows { success: true, error: "failed" }
interface Payment {
	success: boolean;
	transactionId?: string;
	error?: string;
}

// Good
type PaymentResult =
	| { success: true; transactionId: string }
	| { success: false; error: string };
```

## 7. Use discriminated unions for workflows

Every workflow should have explicit states.

```ts
type Job =
	| { type: "running"; startedAt: Date }
	| { type: "failed"; reason: string }
	| { type: "completed"; result: string };
```

The compiler and LLM can reason about every case.

## 8. Functions must declare input and output types

```ts
// Bad
function calculate(data) {}

// Good
function calculate(data: Booking): Price {}
```

Public functions always define both sides.

## 9. Keep functions small and single-purpose

One function = one decision. Avoid a `processBooking()` that does validation,
database access, pricing, notifications, and logging. Prefer `validateBooking()`,
`calculatePrice()`, `saveBooking()`, `sendConfirmation()`.

## 10. Avoid hidden behavior

An `updateBooking()` that silently changes price, sends email, and updates the
calendar is bad. Every action should be visible. Prefer `updateBooking()` +
`sendBookingConfirmation()`.

## 11. Name things explicitly

Use `booking`, `listingAvailability`, `paymentResult` — never `data`, `result`,
`item`, `obj`, `value`. The name is documentation.

## 12. Prefer immutable data

```ts
// Avoid
booking.price = 100;

// Prefer
const updatedBooking = { ...booking, price: 100 };
```

## 13. Use `readonly` where possible

```ts
interface Booking {
	readonly id: string;
}
```

## 14. Validate external data immediately

Everything from outside is unknown: APIs, databases, user input, files, queues.

```ts
// Never
const booking = await api.get();

// Prefer
const booking = BookingSchema.parse(await api.get());
```

Use schemas (Zod, Valibot, TypeBox).

## 15. Types are contracts, not documentation

```ts
// Not this
// user id
id: string;

// This
type UserId = string;
interface User {
	id: UserId;
}
```

Make invalid code impossible.

## 16. Avoid excessive abstraction

Prefer `createBooking()` over `AbstractBookingFactoryProvider` for simple logic.

## 17. Prefer composition over inheritance

Avoid deep class hierarchies. Prefer composing `Permissions`, `Authentication`,
`User`.

## 18. Document decisions, not syntax

```ts
// Bad:  // loop through bookings
// Good: // We process newest bookings first because cancellations are more
//       // likely within the first 48 hours.
```

## 19. Keep API contracts in one place

Never duplicate shapes. Domain types in `domain/`, API contracts in `api/contracts.ts`.

## 20. Use exhaustive checks

Every switch over states must be complete, with `assertNever(status)` in default.

## 21. Prefer explicit errors

```ts
// Bad
throw new Error("failed");

// Good
throw new BookingNotFoundError(id);
```

Errors are part of the API.

## 22. Avoid magic strings

Prefer `const ACTIVE_STATUS = "active"` or `type Status = "active" | "inactive"`.

## 23. Keep dependency boundaries clear

A domain module should not know about AWS, databases, HTTP, queues. Domain in
`domain/`, infrastructure in `infrastructure/`.

## 24. Write code that explains itself

Priority: Types > Names > Structure > Comments. Comments explain *why*, never *what*.

## 25. Design for AI modification

Before committing, ask: "Could another developer or an LLM understand the intended
behavior without asking me?" If no: add types, split functions, clarify states,
improve names.

---

## The Golden Rule

Every piece of important information should exist in one of these forms:

- Type
- Function signature
- Explicit state model
- Schema validation
- Clear naming

Never rely on tribal knowledge or hidden assumptions.
