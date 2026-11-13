---
"@jverneuer/beds24-sdk-client": minor
---

Add `client.accessToken` getter — exposes the cached access token so fleet consumers (gateways, multi-container runtimes) can persist a minted token and share it instead of each container minting its own (every mint costs credits).
