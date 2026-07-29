/**
 * Local embedding via @huggingface/transformers.
 *
 * Model: Xenova/all-MiniLM-L6-v2 (384-dim). Runs fully offline — no API keys.
 * We mean-pool over tokens and normalize to unit length so that cosine distance
 * in the vector store is equivalent to cosine similarity.
 */

import { pipeline, type FeatureExtractionPipeline, type Tensor } from "@huggingface/transformers";

/** Embedding dimensionality of Xenova/all-MiniLM-L6-v2. */
export const EMBED_DIM = 384;

let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;
let readyLog = false;

/** Lazily create (once) the shared feature-extraction pipeline. */
export async function getEmbedder(): Promise<FeatureExtractionPipeline> {
	if (pipelinePromise === null) {
		if (!readyLog) {
			console.error("[beds24] loading embedding model (Xenova/all-MiniLM-L6-v2)...");
			readyLog = true;
		}
		const opts = { dtype: "fp32" as const };
		pipelinePromise = (
			pipeline as (
				task: "feature-extraction",
				model: string,
				options: { dtype: "fp32" },
			) => Promise<FeatureExtractionPipeline>
		)("feature-extraction", "Xenova/all-MiniLM-L6-v2", opts);
	}
	return pipelinePromise;
}

/**
 * Embed one or more texts. Returns one normalized 384-dim vector per input,
 * in the same order.
 */
export async function embed(texts: string[]): Promise<number[][]> {
	const embedder = await getEmbedder();
	const output: Tensor = await embedder(texts, {
		pooling: "mean",
		normalize: true,
	});
	const dims = output.dims; // [N, EMBED_DIM]
	const data = output.data as Float32Array;

	const rows = dims.length >= 2 ? (dims[0] ?? 1) : 1;
	const cols = dims[dims.length - 1] ?? EMBED_DIM;

	const vecs: number[][] = [];
	for (let i = 0; i < rows; i++) {
		const start = i * cols;
		const slice = data.slice(start, start + cols);
		vecs.push(Array.from(slice));
	}
	return vecs;
}
