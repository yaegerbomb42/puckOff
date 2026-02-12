import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { XP_WIN_BONUS, XP_KNOCKOUT, XP_STOMP } from '../utils/leveling';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Default inventory structure
const DEFAULT_INVENTORY = {
    icons: [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010], // Users start with all standard colors
    username: null, // [NEW] Added username field
    equippedIcon: 1001, // Default to Red
    skins: [],
    equippedSkin: null,
    credits: 0, // Legacy
    zoins: 0, // [NEW] Premium Currency
    freePacks: 1,
    packCredits: 0, // Legacy
    banUntil: null,
    consecutiveQuits: 0,
    xp: 0, // [NEW] Experience Points
    timePlayed: 0, // [NEW] Total minutes played
    loadouts: [
        ['speed_boost', 'rocket', 'shield'],
        ['teleport', 'bomb_throw', 'ghost'],
        ['giant', 'freeze_ray', 'grapple']
    ],
    activeLoadout: 0,
    stats: {
        gamesPlayed: 0,
        wins: 0,
        knockouts: 0,
        damageDealt: 0,
        stomps: 0,
        highestCombo: 0
    },
    achievements: [],
    lastLogin: null,
    createdAt: null
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentWager, setCurrentWager] = useState(0); // [NEW] Wager State

    const clearError = useCallback(() => setError(null), []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    await loadUserData(firebaseUser.uid);
                } else {
                    setUser(null);
                    setInventory(DEFAULT_INVENTORY);
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error("Auth state change error:", err);
                setError("Failed to load user data. Please refresh.");
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Load user data from Firestore
    async function loadUserData(uid) {
        try {
            setError(null);
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setInventory({
                    ...DEFAULT_INVENTORY,
                    ...data,
                    stats: { ...DEFAULT_INVENTORY.stats, ...data.stats }
                });
                setIsAdmin(data.isAdmin || false);

                // Update last login
                await updateDoc(doc(db, 'users', uid), {
                    lastLogin: new Date().toISOString()
                });
            } else {
                // Create new user document
                const newUserData = {
                    ...DEFAULT_INVENTORY,
                    email: auth.currentUser?.email,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    isAdmin: false
                };
                await setDoc(doc(db, 'users', uid), newUserData);
                setInventory(newUserData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setError("Failed to load profile. Please check your connection.");
        }
    }

    // Save inventory to Firestore
    const saveInventory = useCallback(async (updates) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), updates);
            setInventory(prev => ({ ...prev, ...updates }));
        } catch (error) {
            console.error('Error saving inventory:', error);
            setError("Failed to save changes. Your data may be out of sync.");
        }
    }, [user]);

    // ========== AUTH METHODS ==========

    async function loginWithGoogle() {
        try {
            setError(null);
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google login error:', error);
            setError("Google login failed. Please try again.");
            throw error;
        }
    }

    async function loginWithEmail(email, password) {
        try {
            setError(null);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Email login error:', error);
            setError("Login failed. Check your email and password.");
            throw error;
        }
    }

    async function signupWithEmail(email, password) {
        try {
            setError(null);
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Signup error:', error);
            setError("Failed to create account. Email might be in use.");
            throw error;
        }
    }

    async function logout() {
        try {
            setError(null);
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            setError("Logout failed.");
        }
    }

    // ========== ICON MANAGEMENT ==========

    const addIcons = useCallback(async (newIcons) => {
        if (!user) return;
        const uniqueIcons = [...new Set([...inventory.icons, ...newIcons])];
        await saveInventory({ icons: uniqueIcons });
        return uniqueIcons;
    }, [user, inventory.icons, saveInventory]);

    const equipIcon = useCallback(async (iconId) => {
        if (!user) return;
        await saveInventory({ equippedIcon: iconId });
    }, [user, saveInventory]);

    // ========== ECONOMY MANAGEMENT ==========

    const addZoins = useCallback(async (amount) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                zoins: increment(amount)
            });
            setInventory(prev => ({ ...prev, zoins: (prev.zoins || 0) + amount }));
        } catch (error) {
            console.error('Error adding Zoins:', error);
        }
    }, [user]);

    const spendZoins = useCallback(async (amount) => {
        if (!user || (inventory.zoins || 0) < amount) return false;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                zoins: increment(-amount)
            });
            setInventory(prev => ({ ...prev, zoins: (prev.zoins || 0) - amount }));
            return true;
        } catch (error) {
            console.error('Error spending Zoins:', error);
            setError("Transaction failed. Zoins not deducted.");
            return false;
        }
    }, [user, inventory.zoins]);

    const joinWagerMatch = useCallback(async (amount) => {
        if (!user || (inventory.zoins || 0) < amount) return false;
        // Deduct entry fee immediately (The "Ante")
        const success = await spendZoins(amount);
        if (success) {
            setCurrentWager(amount);
            return true;
        }
        return false;
    }, [user, inventory.zoins, spendZoins]);

    const applyPenalty = useCallback(async (penaltyType) => {
        // ... (no change needed for logic, but error handling)
        if (!user) return;

        let updates = {};
        if (penaltyType === 'RAGE_QUIT') {
            const newConsecutive = (inventory.consecutiveQuits || 0) + 1;
            const penaltyAmount = -1; // -1 credit

            updates = {
                credits: increment(penaltyAmount),
                consecutiveQuits: increment(1)
            };

            // Apply ban if 0 credits or multiple quits
            if ((inventory.credits || 0) <= 0 || newConsecutive > 1) {
                const banMinutes = [1, 5, 30, 60, 1440][Math.min(newConsecutive - 1, 4)];
                const banUntil = new Date(Date.now() + banMinutes * 60000).toISOString();
                updates.banUntil = banUntil;
            }
        }

        try {
            await updateDoc(doc(db, 'users', user.uid), updates);
            setInventory(prev => ({
                ...prev,
                credits: Math.max(0, (prev.credits || 0) - 1),
                consecutiveQuits: (prev.consecutiveQuits || 0) + 1,
                ...((updates.banUntil) ? { banUntil: updates.banUntil } : {})
            }));
        } catch (error) {
            console.error('Error applying penalty:', error);
        }
    }, [user, inventory.credits, inventory.consecutiveQuits]);

    const useFreePack = useCallback(async () => {
        if (!user || inventory.freePacks < 1) return false;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                freePacks: increment(-1)
            });
            setInventory(prev => ({ ...prev, freePacks: prev.freePacks - 1 }));
            return true;
        } catch (error) {
            console.error('Error using free pack:', error);
            setError("Failed to open pack. Please try again.");
            return false;
        }
    }, [user, inventory.freePacks]);

    // ========== LOADOUT MANAGEMENT ==========

    const updateLoadout = useCallback(async (loadoutIndex, newLoadout) => {
        if (!user) return;
        const updatedLoadouts = [...inventory.loadouts];
        updatedLoadouts[loadoutIndex] = newLoadout;
        await saveInventory({ loadouts: updatedLoadouts });
    }, [user, inventory.loadouts, saveInventory]);

    const setActiveLoadout = useCallback(async (index) => {
        if (!user) return;
        await saveInventory({ activeLoadout: index });
    }, [user, saveInventory]);

    // ========== STATS MANAGEMENT ==========

    // Wrap updateMatchStats to include XP calculation & Wager Payout
    const updateMatchStats = useCallback(async (matchResult) => {
        if (!user) return;

        const { won, knockouts, damageDealt, stomps, maxCombo } = matchResult;

        // Calculate XP Rewards
        let xpEarned = 0;
        if (won) xpEarned += XP_WIN_BONUS;
        xpEarned += (knockouts || 0) * XP_KNOCKOUT;
        xpEarned += (stomps || 0) * XP_STOMP;

        try {
            // Psychological Rewards (Messy Numbers)
            const participationReward = 9;
            const winReward = won ? 53 : 0;
            const killReward = (knockouts || 0) * 7;

            // [NEW] Wager Payout Logic
            let wagerWinnings = 0;
            if (won && currentWager > 0) {
                // Winner takes 90% of pot (2x Ante)
                // e.g. 100 in -> 180 out.
                wagerWinnings = Math.floor(currentWager * 2 * 0.9);
            }

            const totalZoinsEarned = participationReward + winReward + killReward + wagerWinnings;

            // Perform single atomic update for Stats + Zoins + XP
            await updateDoc(doc(db, 'users', user.uid), {
                'stats.gamesPlayed': increment(1),
                'stats.wins': increment(won ? 1 : 0),
                'stats.knockouts': increment(knockouts || 0),
                'stats.damageDealt': increment(Math.floor(damageDealt || 0)),
                'stats.stomps': increment(stomps || 0),
                'stats.highestCombo': Math.max(inventory.stats.highestCombo, maxCombo || 0),
                zoins: increment(totalZoinsEarned),
                consecutiveQuits: 0,
                // Add XP atomically
                xp: increment(xpEarned)
            });

            setInventory(prev => ({
                ...prev,
                zoins: (prev.zoins || 0) + totalZoinsEarned,
                consecutiveQuits: 0,
                xp: (prev.xp || 0) + xpEarned,
                stats: {
                    ...prev.stats,
                    gamesPlayed: prev.stats.gamesPlayed + 1,
                    wins: prev.stats.wins + (won ? 1 : 0),
                    knockouts: prev.stats.knockouts + (knockouts || 0),
                    damageDealt: prev.stats.damageDealt + Math.floor(damageDealt || 0),
                    stomps: prev.stats.stomps + (stomps || 0),
                    highestCombo: Math.max(prev.stats.highestCombo, maxCombo || 0)
                }
            }));

            // Reset Wager
            if (currentWager > 0) setCurrentWager(0);

            return { zoinsEarned: totalZoinsEarned, xpEarned, wagerWinnings };
        } catch (error) {
            console.error('Error updating match stats:', error);
            return null;
        }
    }, [user, inventory.stats.highestCombo, currentWager]); // Added currentWager dependency

    // ========== XP & PROGRESSION ==========

    const addXp = useCallback(async (amount) => {
        if (!user || amount <= 0) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                xp: increment(amount)
            });
            setInventory(prev => ({ ...prev, xp: (prev.xp || 0) + amount }));
        } catch (error) {
            console.error('Error adding XP:', error);
        }
    }, [user]);

    // Update time played every minute if user is active (simple implementation)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            // We could check document.hidden here to only count active time
            if (document.hidden) return;

            try {
                // Add 1 minute to timePlayed and appropriate XP
                const xpAmount = 100; // 100 XP per minute
                await updateDoc(doc(db, 'users', user.uid), {
                    timePlayed: increment(1),
                    xp: increment(xpAmount)
                });
                setInventory(prev => ({
                    ...prev,
                    timePlayed: (prev.timePlayed || 0) + 1,
                    xp: (prev.xp || 0) + xpAmount
                }));
            } catch (err) {
                console.error("Error updating playtime:", err);
            }
        }, 60000); // Every 60 seconds

        return () => clearInterval(interval);
    }, [user]);

    // ========== BAN MANAGEMENT ==========
    const removeBan = useCallback(async () => {
        if (!user || (inventory.zoins || 0) < 75) return false;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                zoins: increment(-75),
                banUntil: null,
                consecutiveQuits: 0
            });
            setInventory(prev => ({
                ...prev,
                zoins: (prev.zoins || 0) - 75,
                banUntil: null,
                consecutiveQuits: 0
            }));
            return true;
        } catch (error) {
            console.error('Error removing ban:', error);
            return false;
        }
    }, [user, inventory.zoins]);

    // ========== ACHIEVEMENTS ==========

    const unlockAchievement = useCallback(async (achievementId) => {
        if (!user || inventory.achievements.includes(achievementId)) return false;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                achievements: arrayUnion(achievementId)
            });
            setInventory(prev => ({
                ...prev,
                achievements: [...prev.achievements, achievementId]
            }));
            return true;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            return false;
        }
    }, [user, inventory.achievements]);

    // ========== ADMIN FUNCTIONS ==========

    const resetInventory = useCallback(async () => {
        if (!user) return;
        const resetData = {
            ...DEFAULT_INVENTORY,
            email: user.email,
            createdAt: inventory.createdAt,
            lastLogin: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), resetData);
        setInventory(resetData);
    }, [user, inventory.createdAt]);

    const resetIcons = useCallback(async () => {
        if (!user) return;
        await saveInventory({ icons: [], equippedIcon: null });
    }, [user, saveInventory]);

    const value = {
        user,
        loading,
        error,
        clearError,
        inventory,
        isAdmin,

        // Auth
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        updateUsername: (name) => saveInventory({ username: name }), // [NEW] Expose updateUsername

        // Icons
        addIcons,
        equipIcon,
        resetIcons,

        // Economy
        addZoins,
        spendZoins,
        useFreePack,
        applyPenalty,
        removeBan,
        joinWagerMatch,

        // Loadouts
        updateLoadout,
        setActiveLoadout,

        // Stats
        updateMatchStats, // Used to be updateMatchStatsWithXp wrapper, now integrated
        unlockAchievement,

        // Progression
        addXp,

        // Admin
        resetInventory,
        saveInventory
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
