import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '12px',
                    margin: '20px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h2 style={{ color: '#991b1b', marginBottom: '16px' }}>Application Error</h2>
                    <p style={{ color: '#7f1d1d', marginBottom: '24px' }}>Something went wrong in this part of the application.</p>

                    <div style={{
                        textAlign: 'left',
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        overflow: 'auto',
                        fontSize: '14px',
                        maxHeight: '300px'
                    }}>
                        <details open>
                            <summary style={{ fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {this.state.error?.toString()}
                                {'\n\n'}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '24px',
                            padding: '12px 24px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
