import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const ADMIN_PASSWORD = 'Zawe1234!';

export default function AdminDashboard({ onClose }) {
    const { user, resetIcons, addIcons, saveInventory } = useAuth();
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [metrics, setMetrics] = useState({ playersOnline: 0 });
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setAuthenticated(true);
            setError('');
            loadData();
        } else {
            setError('Incorrect password');
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Load users from Firestore
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);

            // Try to get rooms from server
            try {
                const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3002';
                const roomsRes = await fetch(`${serverUrl}/api/admin/rooms`);
                if (roomsRes.ok) {
                    const roomsData = await roomsRes.json();
                    setRooms(roomsData.rooms || []);
                    setMetrics({ playersOnline: roomsData.playersOnline || 0 });
                }
            } catch (e) {
                console.log('Could not fetch server data');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
        setLoading(false);
    };

    const handleGrantPack = async (userId) => {
        // For the current user, open a pack
        if (userId === user?.uid) {
            // Grant 10 random icons
            const randomIcons = [];
            for (let i = 0; i < 3; i++) {
                randomIcons.push(Math.floor(Math.random() * 150) + 1);
            }
            await addIcons(randomIcons);
            alert(`Granted 3 random icons: ${randomIcons.join(', ')}`);
            loadData();
        } else {
            alert('Can only grant packs to yourself in admin mode');
        }
    };

    const handleResetIcons = async () => {
        if (window.confirm('Reset all your icons? This cannot be undone.')) {
            await resetIcons();
            alert('Icons reset successfully');
            loadData();
        }
    };

    if (!authenticated) {
        return (
            <div className="admin-overlay" onClick={onClose}>
                <div className="admin-login" onClick={e => e.stopPropagation()}>
                    <h2>🔐 ADMIN LOGIN</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Enter admin password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
                        />
                        {error && <div className="error">{error}</div>}
                        <button type="submit">LOGIN</button>
                    </form>
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
                <style jsx>{`
                    .admin-overlay {
                        position: fixed; inset: 0; background: rgba(0,0,0,0.9);
                        display: flex; align-items: center; justify-content: center;
                        z-index: 3000; font-family: 'Orbitron', sans-serif;
                    }
                    .admin-login {
                        background: #1a1a2e; padding: 2rem; border-radius: 20px;
                        text-align: center; border: 1px solid #333;
                    }
                    .admin-login h2 { color: #ff006e; margin-bottom: 1.5rem; }
                    .admin-login input {
                        padding: 12px; width: 100%; background: #0a0a1a;
                        border: 1px solid #333; color: white; border-radius: 8px;
                        margin-bottom: 1rem;
                    }
                    .admin-login button {
                        width: 100%; padding: 12px; background: #ff006e;
                        border: none; color: white; border-radius: 8px;
                        cursor: pointer; font-weight: bold;
                    }
                    .error { color: #ff006e; margin-bottom: 1rem; font-size: 0.85rem; }
                    .cancel-btn {
                        margin-top: 1rem; background: transparent !important;
                        border: 1px solid #333 !important; color: #888 !important;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-overlay" onClick={onClose}>
            <div className="admin-dashboard" onClick={e => e.stopPropagation()}>
                <div className="admin-header">
                    <h2>⚙️ ADMIN DASHBOARD</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="admin-tabs">
                    <button
                        className={activeTab === 'users' ? 'active' : ''}
                        onClick={() => setActiveTab('users')}
                    >👥 Users</button>
                    <button
                        className={activeTab === 'rooms' ? 'active' : ''}
                        onClick={() => setActiveTab('rooms')}
                    >🏠 Rooms</button>
                    <button
                        className={activeTab === 'metrics' ? 'active' : ''}
                        onClick={() => setActiveTab('metrics')}
                    >📊 Metrics</button>
                    <button
                        className={activeTab === 'tools' ? 'active' : ''}
                        onClick={() => setActiveTab('tools')}
                    >🛠️ Tools</button>
                </div>

                <div className="admin-content">
                    {loading && <div className="loading">Loading...</div>}

                    {activeTab === 'users' && (
                        <div className="users-tab">
                            <div className="section-header">
                                <span>Registered Users ({users.length})</span>
                                <button onClick={loadData}>🔄 Refresh</button>
                            </div>
                            <div className="users-list">
                                {users.map(u => (
                                    <div key={u.id} className="user-row">
                                        <div className="user-info">
                                            <div className="user-email">{u.email || 'No email'}</div>
                                            <div className="user-stats">
                                                Icons: {u.icons?.length || 0} |
                                                Packs: {u.freePacks || 0}
                                            </div>
                                        </div>
                                        <div className="user-actions">
                                            {u.id === user?.uid && (
                                                <button onClick={() => handleGrantPack(u.id)}>
                                                    🎁 Grant Pack
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && <div className="empty">No users found</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rooms' && (
                        <div className="rooms-tab">
                            <div className="section-header">
                                <span>Active Rooms ({rooms.length})</span>
                                <button onClick={loadData}>🔄 Refresh</button>
                            </div>
                            <div className="rooms-list">
                                {rooms.map(room => (
                                    <div key={room.code} className="room-row">
                                        <div className="room-code">{room.code}</div>
                                        <div className="room-players">{room.playerCount} players</div>
                                        <div className="room-status">{room.status}</div>
                                    </div>
                                ))}
                                {rooms.length === 0 && <div className="empty">No active rooms</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'metrics' && (
                        <div className="metrics-tab">
                            <div className="metric-card">
                                <div className="metric-value">{metrics.playersOnline}</div>
                                <div className="metric-label">Players Online</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{rooms.length}</div>
                                <div className="metric-label">Active Rooms</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{users.length}</div>
                                <div className="metric-label">Total Users</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="tools-tab">
                            <h3>Admin Tools</h3>
                            <p>Logged in as: {user?.email || 'Not logged in'}</p>

                            <div className="tool-buttons">
                                <button className="tool-btn grant" onClick={() => handleGrantPack(user?.uid)}>
                                    🎁 Grant Yourself 3 Icons
                                </button>
                                <button className="tool-btn reset" onClick={handleResetIcons}>
                                    🗑️ Reset Your Icons
                                </button>
                            </div>

                            <div className="tool-info">
                                <p>• Grant Pack: Adds 3 random icons to your account</p>
                                <p>• Reset Icons: Clears all your icons for testing</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .admin-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.95);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 3000; font-family: 'Orbitron', sans-serif;
                }
                .admin-dashboard {
                    background: linear-gradient(135deg, #1a0a2e, #0a1a2e);
                    border: 1px solid #ff006e; border-radius: 20px;
                    width: 95%; max-width: 800px; max-height: 85vh;
                    overflow: hidden; display: flex; flex-direction: column;
                }
                .admin-header {
                    padding: 1.5rem; display: flex; justify-content: space-between;
                    align-items: center; border-bottom: 1px solid #333;
                }
                .admin-header h2 { color: #ff006e; margin: 0; }
                .close-btn {
                    background: none; border: none; color: #888;
                    font-size: 1.5rem; cursor: pointer;
                }

                .admin-tabs {
                    display: flex; border-bottom: 1px solid #333;
                }
                .admin-tabs button {
                    flex: 1; padding: 1rem; background: transparent;
                    border: none; color: #888; cursor: pointer;
                    transition: 0.3s;
                }
                .admin-tabs button:hover { background: rgba(255,0,110,0.1); }
                .admin-tabs button.active { 
                    color: #ff006e; background: rgba(255,0,110,0.1);
                    border-bottom: 2px solid #ff006e;
                }

                .admin-content {
                    flex: 1; overflow-y: auto; padding: 1.5rem;
                }

                .section-header {
                    display: flex; justify-content: space-between;
                    align-items: center; margin-bottom: 1rem;
                }
                .section-header button {
                    padding: 0.5rem 1rem; background: rgba(255,255,255,0.1);
                    border: 1px solid #333; border-radius: 8px;
                    color: white; cursor: pointer;
                }

                .users-list, .rooms-list {
                    display: flex; flex-direction: column; gap: 0.5rem;
                }
                .user-row, .room-row {
                    display: flex; justify-content: space-between;
                    align-items: center; padding: 1rem;
                    background: rgba(0,0,0,0.3); border-radius: 10px;
                }
                .user-email { font-weight: bold; }
                .user-stats { font-size: 0.8rem; color: #888; margin-top: 0.3rem; }
                .user-actions button {
                    padding: 0.4rem 0.8rem; background: #00d4ff;
                    border: none; border-radius: 5px; cursor: pointer;
                    font-size: 0.8rem;
                }

                .room-code { font-weight: bold; color: #00d4ff; }
                .room-players { color: #888; }
                .room-status { 
                    padding: 0.3rem 0.8rem; background: #00ff87;
                    color: #000; border-radius: 10px; font-size: 0.8rem;
                }

                .metrics-tab {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }
                .metric-card {
                    background: rgba(0,0,0,0.3); padding: 2rem;
                    border-radius: 15px; text-align: center;
                }
                .metric-value { font-size: 3rem; font-weight: bold; color: #00d4ff; }
                .metric-label { color: #888; margin-top: 0.5rem; }

                .tools-tab { text-align: center; }
                .tools-tab h3 { color: #ff006e; }
                .tools-tab p { color: #888; margin-bottom: 1rem; }
                .tool-buttons {
                    display: flex; gap: 1rem; justify-content: center;
                    margin: 2rem 0;
                }
                .tool-btn {
                    padding: 1rem 2rem; border: none; border-radius: 10px;
                    cursor: pointer; font-weight: bold; font-size: 1rem;
                }
                .tool-btn.grant { background: #00ff87; color: #000; }
                .tool-btn.reset { background: #ff006e; color: #fff; }
                .tool-info {
                    background: rgba(0,0,0,0.3); padding: 1rem;
                    border-radius: 10px; text-align: left;
                }
                .tool-info p { color: #666; font-size: 0.85rem; margin: 0.3rem 0; }

                .empty { color: #555; text-align: center; padding: 2rem; }
                .loading { text-align: center; color: #888; padding: 2rem; }
            `}</style>
        </div>
    );
}
