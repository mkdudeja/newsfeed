import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        const { hasError, error } = this.state;
        const { fallback, children } = this.props;

        if (hasError) {
            return (
                fallback ?? (
                    <div className="p-4 text-red-700 bg-red-100 border border-red-300 rounded">
                        <h2 className="text-lg font-semibold">Something went wrong.</h2>
                        {error && <pre className="mt-2 text-sm">{error.message}</pre>}
                    </div>
                )
            );
        }

        return children;
    }
}

export default ErrorBoundary;
