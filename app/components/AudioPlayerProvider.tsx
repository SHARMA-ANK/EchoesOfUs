"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AudioPlayerContextValue {
    currentPlayingId: string | null;
    setCurrentPlayingId: (id: string | null) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setCurrentPlayingId(null);
        };
    }, []);

    return (
        <AudioPlayerContext.Provider value={{ currentPlayingId, setCurrentPlayingId }}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext);
    if (context === undefined) {
        throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
    }
    return context;
}
