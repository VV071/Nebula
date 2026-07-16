/**
 * Gemma provider — Google AI Studio (Generative Language API).
 *
 * This is ADDITIVE. It powers only the new SME Advisory Agent. The existing
 * Claude-based AI Council (frontend) is left untouched.
 *
 * Model sizing is deliberate (configurable via env):
 *   - GEMMA_MODEL_SMALL  (default gemma-3-4b-it)  — lightweight classification /
 *                         intent-routing / risk-flagging. Cheap + fast.
 *   - GEMMA_MODEL_LARGE  (default gemma-3-27b-it) — final synthesised Chairman
 *                         recommendation that needs stronger reasoning.
 *
 * Auth: GEMMA_API_KEY (Google AI Studio) from env, never hardcoded.
 * If the key is absent the client reports `configured: false` and callers fall
 * back to deterministic behaviour so the app still runs end-to-end.
 */

import axios from 'axios';

const API_BASE =
    process.env.GEMMA_API_BASE ||
    'https://generativelanguage.googleapis.com/v1beta';

export const GEMMA_MODELS = {
    small: process.env.GEMMA_MODEL_SMALL || 'gemma-3-4b-it',
    large: process.env.GEMMA_MODEL_LARGE || 'gemma-3-27b-it',
};

export type GemmaSize = keyof typeof GEMMA_MODELS;

export function isGemmaConfigured(): boolean {
    return !!process.env.GEMMA_API_KEY && process.env.GEMMA_API_KEY.trim().length > 0;
}

export function gemmaStatus() {
    return {
        configured: isGemmaConfigured(),
        models: GEMMA_MODELS,
        provider: 'Google AI Studio (Gemma)',
    };
}

interface GemmaCallOptions {
    size: GemmaSize;
    prompt: string;
    /** Gemma has no separate system role; we prepend instructions to the prompt. */
    system?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
}

/**
 * Low-level call to a Gemma model. Returns the text, or null on any failure /
 * when the key is not configured (callers treat null as "use fallback").
 */
export async function callGemma(opts: GemmaCallOptions): Promise<string | null> {
    if (!isGemmaConfigured()) return null;

    const model = GEMMA_MODELS[opts.size];
    const url = `${API_BASE}/models/${model}:generateContent`;
    const promptText = opts.system ? `${opts.system}\n\n${opts.prompt}` : opts.prompt;

    try {
        const res = await axios.post(
            url,
            {
                contents: [{ role: 'user', parts: [{ text: promptText }] }],
                generationConfig: {
                    temperature: opts.temperature ?? 0.3,
                    maxOutputTokens: opts.maxTokens ?? 1024,
                },
            },
            {
                params: { key: process.env.GEMMA_API_KEY },
                timeout: opts.timeoutMs ?? 30000,
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const text: string | undefined =
            res.data?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text)
                .join('') ?? undefined;

        return text?.trim() || null;
    } catch (error: any) {
        console.error(
            `[Gemma:${model}] call failed:`,
            error?.response?.data?.error?.message || error.message
        );
        return null;
    }
}

/**
 * Call Gemma and parse a JSON object from the reply (models sometimes wrap JSON
 * in ```json fences or prose). Returns null if nothing parseable comes back.
 */
export async function callGemmaJson<T = any>(opts: GemmaCallOptions): Promise<T | null> {
    const raw = await callGemma(opts);
    if (!raw) return null;

    // Strip code fences if present, then grab the first {...} block.
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]) as T;
    } catch {
        return null;
    }
}
