# Cross-package interface contract (read-only — both engineers honor this)

The `beds24-sdk-client` and `beds24-knowledge` packages are built by two engineers in
parallel. They MUST expose exactly these shapes so the server package composes
them without adaptation. Do not change signatures without updating this file and
telling the integration engineer.

## Bucket type (owned by `beds24-knowledge`, re-exported)

```ts
export type Bucket = "deprecated" | "apiv1" | "apiv2" | "general";
export const KNOWN_BUCKETS: readonly Bucket[] = ["deprecated","apiv1","apiv2","general"] as const;
export const SAFE_BUCKETS:  readonly Bucket[] = ["apiv2","general"] as const;
```

## `beds24-knowledge` public surface (`packages/knowledge/src/index.ts`)

### Chunk (extended)
```ts
export interface Chunk {
  sourceFile: string;
  headingPath: string[];
  lineStart: number;
  lineEnd: number;
  text: string;
  bucket: Bucket;        // from frontmatter (authoritative) / path fallback
  docUrl: string | null; // from frontmatter
}
```

### SearchHit (CHANGED — score is now RRF)
```ts
export interface SearchHit {
  id: number;
  text: string;
  sourceFile: string;
  headingPath: string[];
  lines: [number, number];
  bucket: Bucket;
  docUrl: string | null;
  /** RRF fusion score — higher is better, unbounded. BREAKING: was cosine similarity in [0,1]. */
  score: number;
}
```

### Search entry points
```ts
export function searchAll(query: string, topK?: number): Promise<SearchHit[]>;
export function search(query: string, topK?: number): Promise<SearchHit[]>;          // SAFE_BUCKETS only
export function searchInBucket(bucket: Bucket, query: string, topK?: number): Promise<SearchHit[]>;
export function hybridSearch(opts: {
  query: string;
  buckets?: Bucket[];   // []/undefined = all buckets
  topK?: number;        // default 8
  candidateK?: number;  // default max(topK*5, 50)
}): Promise<SearchHit[]>;
export class Beds24Search {
  searchAll(query, topK?): Promise<SearchHit[]>;
  search(query, topK?): Promise<SearchHit[]>;
  searchInBucket(bucket, query, topK?): Promise<SearchHit[]>;
}
```

### Indexer / db / embed / frontmatter
```ts
export function buildIndex(opts: { knowledgeDir: string; force?: boolean }): Promise<BuildResult>;
export interface BuildResult { files: number; chunks: number; }

export function getDb(): Database;          // libsql Database, loads sqlite-vec, runs migrations
export function dbExists(): boolean;
export function clearChunks(): void;
export function resetDatabase(): void;      // drop + recreate chunks + FTS5 (used on user_version bump / force)
export function countChunks(): number;
export function bucketCounts(): Record<Bucket, number>;
export function insertChunk(sourceFile: string, headingPath: string[], lineStart: number,
                             lineEnd: number, text: string, embedding: number[],
                             bucket: Bucket, docUrl: string | null): number;
export const DB_PATH: string;

export async function embed(texts: string[]): Promise<number[][]>;
export const EMBED_DIM: 384;

export interface Frontmatter { bucket?: Bucket; docUrl?: string; [key: string]: unknown; }
export function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string; };
```

## `beds24-sdk-client` public surface (`packages/sdk/src/index.ts`)

The SDK resolves its OWN spec (`apiV2.yaml` in the sdk package root). It must NOT
import or reference any knowledge/facts dir.

```ts
// client.ts
export class Beds24Client {
  readonly endpoints: string[];
  constructor(config: Beds24ClientConfig);
  request<T = unknown>(endpoint: string, body?: unknown,
    opts?: { idempotencyKey?: string; signal?: AbortSignal }): Promise<Beds24Response<T>>;
}
// spec resolved internally from the sdk package root (no factsDir param).

// schema.ts — specDir defaults to the sdk package's apiV2.yaml
export function getSchema(endpoint: string, direction: "request"|"response", specDir?: string): JsonNode | undefined;
export function listEndpoints(specDir?: string): string[];
export function resolveSchema(name: string, specDir?: string): Field[];
export function flattenObject(node: JsonNode | undefined): Field[];
export function __resetSchemaIndex(): void;

// validate.ts — specDir defaults to the sdk package's apiV2.yaml
export class Beds24Validator {
  static create(opts?: { specDir?: string }): Beds24Validator;
  validate(endpoint: string, direction: "request"|"response", payload: unknown): ValidationResult;
}
export function validateRequest(endpoint: string, direction: "request", payload: unknown, specDir?: string): ValidationResult;

// ops/*.ts — each takes Beds24Client, NOT the Beds24 facade
export class BookingOps { constructor(client: Beds24Client); ... }
export class PricingOps { constructor(client: Beds24Client); ... }
export class AvailabilityOps { constructor(client: Beds24Client); ... }
export class ChannelsOps { constructor(client: Beds24Client); ... }
export class WebhooksOps { constructor(client: Beds24Client); ... }
```

## Boundary rules (enforced by QA)

- `beds24-sdk-client` MUST NOT import libsql, sqlite-vec, @huggingface/transformers, or the MCP SDK.
- `beds24-knowledge` MUST NOT import openapi-fetch, ajv, js-yaml, or the MCP SDK.
