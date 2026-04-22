"use client";

import { useRef, useState, useEffect } from "react";
import { useAudioPlayer } from "./AudioPlayerProvider";

interface AudioPlayerProps {
    chapterId: string;
    audioUrl: string;
    chapterTitle: string;
}

interface AudioPlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isLoading: boolean;
    error: string | null;
}

export default function AudioPlayer({ chapterId, audioUrl, chapterTitle }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { currentPlayingId, setCurrentPlayingId } = useAudioPlayer();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Convert Vercel Blob private URLs to use proxy
    const getProxiedUrl = (url: string): string => {
        // Check if it's a Vercel Blob private URL
        if (url.includes('.private.blob.vercel-storage.com')) {
            return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
        }
        // For blob: URLs or other URLs, return as-is
        return url;
    };

    const proxiedAudioUrl = getProxiedUrl(audioUrl);

    // Format time in MM:SS format
    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Handle seek
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || duration === 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Handle touch seek
    const handleTouchSeek = (e: React.TouchEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || duration === 0) return;

        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Handle play/pause toggle
    const handlePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        console.log("[AudioPlayer] Play/Pause clicked", {
            isPlaying,
            currentTime: audio.currentTime,
            duration: audio.duration,
            volume: audio.volume,
            muted: audio.muted,
            paused: audio.paused,
            src: audio.src
        });

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                // Pause other players
                if (currentPlayingId && currentPlayingId !== chapterId) {
                    setCurrentPlayingId(chapterId);
                }

                // Ensure volume is set
                audio.volume = 1.0;
                audio.muted = false;

                setIsLoading(true);
                await audio.play();
                setIsPlaying(true);
                setCurrentPlayingId(chapterId);
                setIsLoading(false);

                console.log("[AudioPlayer] Playback started successfully");
            }
        } catch (err) {
            console.error("[AudioPlayer] Play error:", err);
            setError("Unable to play audio");
            setIsLoading(false);
        }
    };

    // Listen for other players starting
    useEffect(() => {
        // Only pause if another player (not this one) is playing
        if (currentPlayingId && currentPlayingId !== chapterId) {
            const audio = audioRef.current;
            if (audio && !audio.paused) {
                console.log("[AudioPlayer] Pausing because another player started:", currentPlayingId);
                audio.pause();
                setIsPlaying(false);
            }
        }
    }, [currentPlayingId, chapterId]);

    // Handle audio completion
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let loadingTimeout: NodeJS.Timeout;

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentPlayingId(null);
        };

        const handleTimeUpdate = () => {
            console.log("[AudioPlayer] Time update:", audio.currentTime);
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            console.log("[AudioPlayer] Metadata loaded, duration:", audio.duration);
            setDuration(audio.duration);
        };

        const handleCanPlay = () => {
            console.log("[AudioPlayer] Can play");
            setIsLoading(false);
            if (loadingTimeout) clearTimeout(loadingTimeout);
        };

        const handlePlay = () => {
            console.log("[AudioPlayer] Play event fired");
        };

        const handlePause = () => {
            console.log("[AudioPlayer] Pause event fired");
        };

        const handleWaiting = () => {
            console.log("[AudioPlayer] Waiting for data");
            setIsLoading(true);
            // Set 10-second timeout for loading
            loadingTimeout = setTimeout(() => {
                setError("Audio loading timeout");
                setIsLoading(false);
            }, 10000);
        };

        const handleError = (e: Event) => {
            const target = e.target as HTMLAudioElement;
            const errorCode = target.error?.code;

            console.error("[AudioPlayer]", {
                chapterId,
                audioUrl,
                errorCode,
                errorMessage: target.error?.message,
                timestamp: new Date().toISOString(),
            });

            let errorMessage = "Unable to load audio";
            if (errorCode === 4) {
                errorMessage = "Audio format not supported";
            } else if (errorCode === 3) {
                errorMessage = "Playback interrupted";
            } else if (errorCode === 2) {
                errorMessage = "Network error";
            }

            setError(errorMessage);
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("error", handleError);
            if (loadingTimeout) clearTimeout(loadingTimeout);
        };
    }, [setCurrentPlayingId, chapterId, audioUrl]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
            }
            if (currentPlayingId === chapterId) {
                setCurrentPlayingId(null);
            }
        };
    }, [chapterId, currentPlayingId, setCurrentPlayingId]);

    return (
        <div className="mt-4 space-y-3">
            <audio ref={audioRef} src={proxiedAudioUrl} preload="metadata" />

            {/* Progress Bar */}
            <div className="w-full">
                <div
                    className="relative h-2 bg-[#F5ECD7]/10 rounded-full overflow-hidden cursor-pointer hover:h-2.5 transition-all"
                    onClick={handleSeek}
                    onTouchMove={handleTouchSeek}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C8922A] to-[#D4A853] transition-all duration-100"
                        style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                    />
                </div>
            </div>

            {/* Time Display and Controls */}
            <div className="flex items-center justify-between gap-4">
                {/* Time Display */}
                <div className="flex items-center gap-2 text-xs text-[#F5ECD7]/60" style={{ fontFamily: "var(--font-inter)" }}>
                    <span className="min-w-[40px]">{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span className="min-w-[40px]">{formatTime(duration)}</span>
                </div>

                {/* Play/Pause Button */}
                <button
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 min-w-[44px] min-h-[44px]"
                    style={{ fontFamily: "var(--font-inter)" }}
                    aria-label={isPlaying ? `Pause ${chapterTitle}` : `Play ${chapterTitle}`}
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-[#1A1612]/30 border-t-[#1A1612] rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                            <span className="text-sm font-semibold tracking-wide">PAUSE</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <span className="text-sm font-semibold tracking-wide">PLAY</span>
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-2 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                    <p className="text-sm text-red-400 mb-2">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            setIsLoading(false);
                            const audio = audioRef.current;
                            if (audio) {
                                audio.load();
                            }
                        }}
                        className="text-xs text-[#D4A853] hover:text-[#C8922A] underline"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
}
