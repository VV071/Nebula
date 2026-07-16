// SME Growth & Advisory Agent — frontend service.
// Talks to the backend /api/sme endpoints (Gemma-powered, seed demo data).

import { ENV } from '../config/env';

const API_BASE_URL = ENV.API_BASE_URL;

export interface SmeAgentResult {
    analyst: string;
    analysis: string;
    keyPoints: string[];
    confidence: 'High' | 'Medium' | 'Low' | string;
    metrics: Record<string, number | string>;
    error?: boolean;
}

export interface SmeChairman {
    summary: string;
    consensus: string;
    riskFactors: string[];
    opportunities: string[];
    error?: boolean;
}

export interface SmeGemmaStatus {
    configured: boolean;
    models: { small: string; large: string };
    provider: string;
}

export interface SmeAdvisorResponse {
    question: string;
    business: { name: string; type: string; city: string; currency: string };
    agents: SmeAgentResult[];
    chairman: SmeChairman;
    toolTrace: Array<{ tool: string; calledBy: string; reason: string }>;
    gemma: SmeGemmaStatus;
    dataSource: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`SME API ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<T>;
}

export const smeService = {
    getStatus(): Promise<{ gemma: SmeGemmaStatus; business: SmeAdvisorResponse['business']; tools: any[] }> {
        return request('/api/sme/status');
    },

    advise(question: string, productId?: string): Promise<SmeAdvisorResponse> {
        return request('/api/sme/advise', {
            method: 'POST',
            body: JSON.stringify({ question, productId }),
        });
    },
};
