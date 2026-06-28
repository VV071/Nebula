export type InsightType = 'warning' | 'info' | 'success' | 'reminder';

export interface Insight {
    id: number;
    user_id: number;
    type: InsightType;
    title: string;
    message: string;
    suggestion: string | null;
    metadata: any | null; // JSONB
    is_dismissed: boolean;
    created_at: Date;
    expires_at: Date | null;
}

export interface CreateInsightDTO {
    user_id: number;
    type: InsightType;
    title: string;
    message: string;
    suggestion?: string;
    metadata?: any;
    expires_at?: Date;
}
