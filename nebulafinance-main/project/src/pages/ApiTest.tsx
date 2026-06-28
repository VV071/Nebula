import { useState } from 'react';
import { api } from '../services/api';

export default function ApiTest() {
    const [results, setResults] = useState<Record<string, { status: 'success' | 'error'; data?: any; error?: string }>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const runTest = async (testName: string, testFn: () => Promise<any>) => {
        setLoading(prev => ({ ...prev, [testName]: true }));

        try {
            const result = await testFn();
            setResults(prev => ({
                ...prev,
                [testName]: { status: 'success', data: result }
            }));
        } catch (error: any) {
            setResults(prev => ({
                ...prev,
                [testName]: { status: 'error', error: error.message }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [testName]: false }));
        }
    };

    const tests = [
        {
            name: 'Health Check',
            key: 'health',
            fn: () => api.healthCheck(),
            description: 'Check if backend server is running'
        },
        {
            name: 'Database Test',
            key: 'database',
            fn: () => api.testDatabase(),
            description: 'Verify database connection and tables'
        },
        {
            name: 'Get Transactions',
            key: 'getTransactions',
            fn: () => api.getTestTransactions(),
            description: 'Fetch sample transactions from DB'
        },
        {
            name: 'Create Transaction',
            key: 'createTransaction',
            fn: () => api.createTestTransaction({
                type: 'expense',
                amount: 100,
                category: 'test',
                description: 'API integration test'
            }),
            description: 'Create a test transaction in DB'
        }
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    API Integration Tests
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Verify frontend ↔ backend communication
                </p>
            </div>

            <div className="space-y-6">
                {tests.map(test => (
                    <div key={test.key} className="glass-card p-6 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{test.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{test.description}</p>
                            </div>
                            <button
                                onClick={() => runTest(test.key, test.fn)}
                                disabled={loading[test.key]}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
                            >
                                {loading[test.key] ? 'Running...' : 'Run Test'}
                            </button>
                        </div>

                        {results[test.key] && (
                            <div className={`mt-4 p-4 rounded-lg overflow-hidden ${results[test.key].status === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'
                                }`}>
                                <div className="flex items-center mb-2">
                                    <span className={`text-sm font-bold uppercase tracking-wider ${results[test.key].status === 'success'
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-red-700 dark:text-red-400'
                                        }`}>
                                        {results[test.key].status === 'success' ? '✓ Success' : '✗ Failed'}
                                    </span>
                                </div>
                                <pre className="text-xs font-mono overflow-x-auto text-gray-800 dark:text-gray-300 max-h-60">
                                    {JSON.stringify(
                                        results[test.key].data || results[test.key].error,
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
                <h4 className="text-blue-800 dark:text-blue-400 font-bold mb-2">Quick Verification:</h4>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>Run all tests using the buttons above</li>
                    <li>All tests should show green (✓ Success)</li>
                    <li>Check browser console for detailed logs</li>
                    <li>Check backend terminal for request logs</li>
                </ul>
            </div>
        </div>
    );
}
