import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearCacheAndReload = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <h1 style={styles.header}>⚠️ Game Crashed</h1>
                        <p style={styles.text}>
                            Something went wrong in the area logic.
                            <br />
                            Don't worry, your stats are safe.
                        </p>

                        <div style={styles.errorBox}>
                            {this.state.error && this.state.error.toString()}
                        </div>

                        <div style={styles.buttonGroup}>
                            <button style={styles.button} onClick={this.handleReload}>
                                🔄 Reload Game
                            </button>
                            <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={this.handleClearCacheAndReload}>
                                🧹 Clear Data & Reload
                            </button>
                        </div>

                        <div style={styles.footer}>
                            Error Location: {this.state.errorInfo?.componentStack?.slice(0, 100)}...
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a1a',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 9999
    },
    card: {
        backgroundColor: '#1a1a2e',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid #333'
    },
    header: {
        margin: '0 0 1rem 0',
        color: '#ff4444'
    },
    text: {
        color: '#ccc',
        lineHeight: '1.5',
        marginBottom: '1.5rem'
    },
    errorBox: {
        backgroundColor: '#000',
        padding: '1rem',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: '#ff8888',
        marginBottom: '1.5rem',
        overflowX: 'auto'
    },
    buttonGroup: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
    },
    button: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#00d4ff',
        color: '#000',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'opacity 0.2s',
        flex: 1
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        border: '1px solid #555',
        color: '#aaa'
    },
    footer: {
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        color: '#555',
        borderTop: '1px solid #333',
        paddingTop: '1rem'
    }
};

export default ErrorBoundary;
