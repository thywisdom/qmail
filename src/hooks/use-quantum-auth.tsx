"use client"

import React, { createContext, useContext, useState, useCallback } from "react";
import { deriveKeyFromQMK } from "@/lib/crypto-utils";
import { toast } from "sonner";

interface QuantumAuthContextType {
    isQuantumReady: boolean;
    login: (qmk: string) => Promise<boolean>;
    logout: () => void;
    derivedKey: CryptoKey | null;
}

const QuantumAuthContext = createContext<QuantumAuthContextType | undefined>(undefined);

// Fixed salt for MVP. In production, this should be user-specific (e.g. user ID or from DB)
// Using a constant allows QMK to be portable across devices without fetching a specific salt first (though fetching user ID first is better).
// For now, let's use the user's email or a constant if email isn't available in this context scope easily without extra props.
// We will accept salt as an arg to login for better security.
const DEFAULT_SALT = "QUANTUM_MAIL_SALT_V1";

export function QuantumAuthProvider({ children }: { children: React.ReactNode }) {
    const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);

    const login = useCallback(async (qmk: string) => {
        try {
            // In a real app, we might verify this key against a known hash, 
            // but here we just derive it. Validation happens when we try to decrypt something.
            const key = await deriveKeyFromQMK(qmk, DEFAULT_SALT);
            setDerivedKey(key);
            return true;
        } catch (error) {
            console.error("QMK Derivation Failed", error);
            toast.error("Failed to process Quantum Master Key");
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        setDerivedKey(null);
        toast.info("Quantum Mode Locked");
    }, []);

    return (
        <QuantumAuthContext.Provider value={{
            isQuantumReady: !!derivedKey,
            login,
            logout,
            derivedKey
        }}>
            {children}
        </QuantumAuthContext.Provider>
    );
}

export function useQuantumAuth() {
    const context = useContext(QuantumAuthContext);
    if (context === undefined) {
        throw new Error("useQuantumAuth must be used within a QuantumAuthProvider");
    }
    return context;
}
