// Nebula Finance API Service
// Handles all backend communication

import { ENV } from '../config/env';

const API_BASE_URL = ENV.API_BASE_URL;

// Log configuration on load
console.log('[API Service] Initialized with base URL:', API_BASE_URL);

class ApiService {
    /**
     * Core request method
     * @param {string} endpoint - API endpoint path (e.g., '/api/health')
     * @param {object} options - Fetch options
     * @returns {Promise<any>} Response data
     */
    async request(endpoint: string, options: any = {}) {
        // Build full URL
        const url = `${API_BASE_URL}${endpoint}`;

        // Default headers
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            console.log(`[API] ${options.method || 'GET'} ${url}`);

            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('[API] Success:', data);

            return data;

        } catch (error: any) {
            console.error('[API] Request failed:', error.message);
            console.error('[API] URL:', url);
            throw error;
        }
    }

    // ============================================
    // TEST ENDPOINTS
    // ============================================

    async healthCheck() {
        return this.request('/api/health');
    }

    async testDatabase() {
        return this.request('/api/test/db');
    }

    async getTestTransactions() {
        return this.request('/api/test/transactions');
    }

    async createTestTransaction(data: any) {
        return this.request('/api/test/transaction', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============================================
    // PRODUCTION ENDPOINTS
    // ============================================

    async getAccounts() {
        try {
            const response = await this.request('/api/accounts');
            if (response && response.success && Array.isArray(response.data)) {
                return response.data;
            }
            if (Array.isArray(response)) {
                return response;
            }
            return [];
        } catch (error) {
            console.error('[API] getAccounts failed:', error);
            return [];
        }
    }

    async createAccount(accountData: any) {
        console.log('\n\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[FRONTEND API] CREATE ACCOUNT - DIAGNOSTIC MODE');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[STEP 1] Method called at:', new Date().toISOString());
        console.log('[STEP 1] Input data:', JSON.stringify(accountData, null, 2));

        try {
            console.log('\n[STEP 2] Preparing fetch request...');
            const url = `${API_BASE_URL}/api/accounts`;
            console.log('[STEP 2] URL:', url);

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accountData)
            };
            console.log('[STEP 2] Fetch options:', JSON.stringify(options, null, 2));

            console.log('\n[STEP 3] Sending fetch request...');
            const response = await fetch(url, options);

            console.log('[STEP 3] ✅ Response received');
            console.log('[STEP 3] Status:', response.status);
            console.log('[STEP 3] Status text:', response.statusText);
            console.log('[STEP 3] OK:', response.ok);
            console.log('[STEP 3] Headers:', Object.fromEntries(response.headers.entries()));

            console.log('\n[STEP 4] Checking response status...');
            if (!response.ok) {
                console.log('[STEP 4] ❌ Response NOT OK');
                console.log('[STEP 4] Attempting to parse error...');

                let errorMessage = `Failed to create account (HTTP ${response.status})`;

                try {
                    const errorData = await response.json();
                    console.log('[STEP 4] Error data:', errorData);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    console.log('[STEP 4] Could not parse error response as JSON');
                    console.log('[STEP 4] Parse error:', e);

                    try {
                        const errorText = await response.text();
                        console.log('[STEP 4] Error as text:', errorText);
                    } catch (textError) {
                        console.log('[STEP 4] Could not read response as text either');
                    }
                }

                console.log('[STEP 4] Throwing error:', errorMessage);
                throw new Error(errorMessage);
            }

            console.log('[STEP 4] ✅ Response OK, status is 2xx');

            console.log('\n[STEP 5] Parsing response JSON...');
            const data = await response.json();
            console.log('[STEP 5] ✅ Response parsed');
            console.log('[STEP 5] Response data:', JSON.stringify(data, null, 2));

            console.log('\n[STEP 6] Extracting account from response...');
            const createdAccount = data.account || data;
            console.log('[STEP 6] Created account:', JSON.stringify(createdAccount, null, 2));

            console.log('═══════════════════════════════════════════════════════════');
            console.log('[SUCCESS] API call completed successfully');
            console.log('═══════════════════════════════════════════════════════════\n\n');

            return createdAccount;

        } catch (error: any) {
            console.log('\n');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('[FRONTEND API ERROR] EXCEPTION CAUGHT');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('[ERROR] Type:', error.constructor?.name);
            console.log('[ERROR] Message:', error.message);
            console.log('[ERROR] Stack:', error.stack);
            console.log('═══════════════════════════════════════════════════════════\n\n');

            throw error;
        }
    }

    async updateAccount(id: string | number, account: any) {
        return this.request(`/api/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(account),
        });
    }

    async deleteAccount(id: string | number) {
        return this.request(`/api/accounts/${id}`, {
            method: 'DELETE',
        });
    }

    // Transaction endpoints
    async getTransactions() {
        try {
            const response = await this.request('/api/transactions');
            if (response && response.success && Array.isArray(response.data.transactions)) {
                return response.data.transactions;
            }
            if (response && Array.isArray(response.data)) {
                return response.data;
            }
            if (Array.isArray(response)) {
                return response;
            }
            return [];
        } catch (error) {
            console.error('[API] getTransactions failed:', error);
            return [];
        }
    }

    async createTransaction(transaction: any) {
        return this.request('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
    }

    async updateTransaction(id: string | number, transaction: any) {
        return this.request(`/api/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction),
        });
    }

    async deleteTransaction(id: string | number) {
        return this.request(`/api/transactions/${id}`, {
            method: 'DELETE',
        });
    }

    // Budget Endpoints
    async getBudgets() {
        try {
            const response = await this.request('/api/budgets');
            if (response && response.success && Array.isArray(response.data)) {
                return response.data;
            }
            if (Array.isArray(response)) {
                return response;
            }
            return [];
        } catch (error) {
            console.warn('[API] getBudgets failed or endpoint not ready:', error);
            return [];
        }
    }

    async createBudget(data: { category_id: string; limit_amount: number; period?: 'monthly' | 'weekly' }) {
        return this.request('/api/budgets', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteBudget(categoryId: string) {
        return this.request(`/api/budgets/${categoryId}`, {
            method: 'DELETE',
        });
    }

    async getBudgetAlerts() {
        return this.request('/api/budgets/alerts');
    }

    // Summary Endpoints
    async getMonthlySummary(year: number, month: number) {
        return this.request(`/api/summary/${year}/${month}`);
    }

    async getCurrentMonthlySummary() {
        return this.request('/api/summary/current');
    }

    async exportData(range: string) {
        // Note: We use fetch directly here because we need to handle the blob response
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/export?range=${range}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export data');
        }

        return await response.blob();
    }
}

// Export singleton instance
export const api = new ApiService();

// Also export class for advanced usage
export default ApiService;
