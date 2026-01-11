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

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Default inventory structure
const DEFAULT_INVENTORY = {
    icons: [],
    equippedIcon: null,
    skins: [],
    equippedSkin: null,
    credits: 0,
    freePacks: 1,
    packCredits: 0,
    banUntil: null,
    consecutiveQuits: 0,
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
    const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
    const [isAdmin, setIsAdmin] = useState(false);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await loadUserData(firebaseUser.uid);
            } else {
                setUser(null);
                setInventory(DEFAULT_INVENTORY);
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Load user data from Firestore
    async function loadUserData(uid) {
        try {
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
        }
    }, [user]);

    // ========== AUTH METHODS ==========

    async function loginWithGoogle() {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    }

    async function loginWithEmail(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Email login error:', error);
            throw error;
        }
    }

    async function signupWithEmail(email, password) {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    async function logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
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

    const addCredits = useCallback(async (amount) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                credits: increment(amount)
            });
            setInventory(prev => ({ ...prev, credits: (prev.credits || 0) + amount }));
        } catch (error) {
            console.error('Error adding credits:', error);
        }
    }, [user]);

    const spendCredits = useCallback(async (amount) => {
        if (!user || (inventory.credits || 0) < amount) return false;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                credits: increment(-amount)
            });
            setInventory(prev => ({ ...prev, credits: (prev.credits || 0) - amount }));
            return true;
        } catch (error) {
            console.error('Error spending credits:', error);
            return false;
        }
    }, [user, inventory.credits]);

    const applyPenalty = useCallback(async (penaltyType) => {
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

    const updateMatchStats = useCallback(async (matchResult) => {
        if (!user) return;

        const { won, knockouts, damageDealt, stomps, maxCombo } = matchResult;

        try {
            const creditsEarned = won ? 3 : 2;

            await updateDoc(doc(db, 'users', user.uid), {
                'stats.gamesPlayed': increment(1),
                'stats.wins': increment(won ? 1 : 0),
                'stats.knockouts': increment(knockouts || 0),
                'stats.damageDealt': increment(Math.floor(damageDealt || 0)),
                'stats.stomps': increment(stomps || 0),
                'stats.highestCombo': Math.max(inventory.stats.highestCombo, maxCombo || 0),
                credits: increment(creditsEarned),
                consecutiveQuits: 0
            });

            setInventory(prev => ({
                ...prev,
                credits: (prev.credits || 0) + creditsEarned,
                consecutiveQuits: 0,
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

            return { creditsEarned };
        } catch (error) {
            console.error('Error updating match stats:', error);
            return null;
        }
    }, [user, inventory.stats.highestCombo]);

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
        inventory,
        isAdmin,

        // Auth
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,

        // Icons
        addIcons,
        equipIcon,
        resetIcons,

        // Economy
        addCredits,
        spendCredits,
        useFreePack,
        applyPenalty,

        // Loadouts
        updateLoadout,
        setActiveLoadout,

        // Stats
        updateMatchStats,
        unlockAchievement,

        // Admin
        resetInventory,
        saveInventory
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
