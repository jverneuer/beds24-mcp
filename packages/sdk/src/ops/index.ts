/** Domain workflows: each composes the client and encodes system-logic rules. */

export { BookingOps, BookingStatus, type BookingWriteRequest, type BookingQuery, type BookingCreate, type BookingUpdate } from "./booking.js";
export { PricingOps, type CalendarWrite, type CalendarQuery, type FixedPriceWrite, type FixedPriceQuery, type PriceTransmissionModel, CHANNEL_PRICE_MODEL } from "./pricing.js";
export { AvailabilityOps, OverrideCode, type AvailabilityQuery, type AvailabilityData } from "./availability.js";
export { ChannelsOps, type ConnectionType, type ChannelSettings, type ChannelQuery, type AirbnbListingsQuery } from "./channels.js";
export { WebhooksOps, type WebhookType, type WebhookPayload } from "./webhooks.js";

// Booking sub-resources (messages + invoicing)
export {
	MessageOps,
	InvoicingOps,
	MessageSource,
	MessageAttachmentMime,
	type MessageQuery,
	type MessageListResponse,
	type MessageWriteRequest,
	type MessageWrite,
	type MessageWriteResponse,
	type MessagePatchBody,
	type MessagePatchResponse,
	type InvoiceQuery,
	type InvoiceListResponse,
} from "./message-ops.js";

// Inventory reads (offers + unit bookings)
export {
	InventoryOps,
	type OffersQuery,
	type OffersResponse,
	type UnitBookingsQuery,
	type UnitBookingsResponse,
} from "./inventory-ops.js";

// Accounts, properties, rooms, organizations
export {
	AccountOps,
	PropertyOps,
	OrganizationOps,
	type AccountQuery,
	type AccountWriteRequest,
	type AccountDraft,
	type AccountListResponse,
	type AccountWriteResponse,
	type PropertyQuery,
	type PropertyWriteRequest,
	type PropertyDraft,
	type PropertyDeleteQuery,
	type PropertyListResponse,
	type PropertyWriteResponse,
	type PropertyDeleteResponse,
	type RoomQuery,
	type RoomDeleteQuery,
	type RoomListResponse,
	type RoomDeleteResponse,
	type OrganizationUserQuery,
	type OrganizationUserListResponse,
} from "./accounts-ops.js";

// Channel actions, reviews, Stripe
export {
	ChannelActionsOps,
	ReviewsOps,
	StripeOps,
	AirbnbActionType,
	AirbnbConnect,
	BookingActionType,
	type AirbnbActionRequest,
	type AirbnbAction,
	type AirbnbActionResponse,
	type BookingActionRequest,
	type BookingAction,
	type BookingActionResponse,
	type AirbnbUsersQuery,
	type AirbnbUsersResponse,
	type AirbnbReviewsQuery,
	type AirbnbReviewsResponse,
	type BookingReviewsQuery,
	type BookingReviewsResponse,
	type StripeActionRequest,
	type StripeAction,
	type StripeActionResponse,
	type StripePaymentMethodsQuery,
	type StripePaymentMethodsResponse,
	type StripeChargesQuery,
	type StripeChargesResponse,
} from "./channel-actions-ops.js";
