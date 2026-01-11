
import React, { useState, useCallback } from 'react';
import { runAllTests, GAME_TESTS } from '../../utils/tests/gameTests';

export default function AutoTester({ onClose }) {
    const [results, setResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({});

    const handleRunTests = useCallback(async () => {
        setIsRunning(true);
        setResults([]);
        setProgress({});

        const finalResults = await runAllTests((testId, status) => {
            setProgress(prev => ({ ...prev, [testId]: status }));
        });

        setResults(finalResults);
        setIsRunning(false);
    }, []);

    const passedCount = results.filter(r => r.status === 'pass').length;
    const totalCount = GAME_TESTS.length;

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '350px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid #333',
            color: '#fff',
            fontFamily: 'monospace',
            zIndex: 9999,
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#00ff87' }}>🛠️ SYSTEM DIAGNOSTICS</h3>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}
                >
                    &times;
                </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={handleRunTests}
                    disabled={isRunning}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: isRunning ? '#333' : '#00ff87',
                        color: isRunning ? '#888' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: isRunning ? 'wait' : 'pointer'
                    }}
                >
                    {isRunning ? 'RUNNING TESTS...' : 'RUN AUTO-AUDIT'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {GAME_TESTS.map(test => {
                    const status = progress[test.id];
                    const result = results.find(r => r.id === test.id);

                    let icon = '⚪';
                    let color = '#888';

                    if (status === 'running') { icon = '⏳'; color = '#FFD700'; }
                    if (status === 'pass') { icon = '✅'; color = '#00ff87'; }
                    if (status === 'fail') { icon = '❌'; color = '#ff4500'; }

                    return (
                        <div key={test.id} style={{
                            padding: '10px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            borderLeft: `3px solid ${color}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold' }}>{test.name}</span>
                                <span>{icon}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                                {result?.error ? (
                                    <span style={{ color: '#ff4500' }}>{result.error}</span>
                                ) : (
                                    result?.message || 'Waiting...'
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {results.length > 0 && !isRunning && (
                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #333', textAlign: 'center' }}>
                    <span style={{
                        color: passedCount === totalCount ? '#00ff87' : '#ff4500',
                        fontWeight: 'bold'
                    }}>
                        RESULT: {passedCount}/{totalCount} PASSED
                    </span>
                </div>
            )}
        </div>
    );
}
