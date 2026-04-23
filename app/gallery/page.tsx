"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const WAVEFORM_BARS = [8, 16, 32, 48, 24, 12, 32, 64, 40, 20, 8, 24, 48, 16, 28];

const CHAPTERS = [
    { number: "01", title: "Childhood in Shanghai", duration: "12:45", active: false },
    { number: "02", title: "The Years of Becoming", duration: "18:20", active: true },
    { number: "03", title: "Echoes Across Oceans", duration: "16:07", active: false },
];

export default function GalleryPage() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const musicRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasDocumentary, setHasDocumentary] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Load documentary audio from sessionStorage on mount
    useEffect(() => {
        const proxyUrl = (url: string) =>
            url.includes(".private.blob.vercel-storage.com")
                ? `/api/audio-proxy?url=${encodeURIComponent(url)}`
                : url;

        const voiceUrl = sessionStorage.getItem("voiceUrl") ?? sessionStorage.getItem("documentaryAudio");
        const musicUrl = sessionStorage.getItem("musicUrl");

        if (voiceUrl && audioRef.current) {
            audioRef.current.src = proxyUrl(voiceUrl);
            setHasDocumentary(true);
        }
        if (musicUrl && musicRef.current) {
            musicRef.current.src = proxyUrl(musicUrl);
            musicRef.current.volume = 0.15;
            musicRef.current.loop = true;
        }
    }, []);

    // Update time and duration
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            musicRef.current?.pause();
            if (musicRef.current) musicRef.current.currentTime = 0;
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            musicRef.current?.pause();
        } else {
            audioRef.current.play();
            musicRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * duration;
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="film-grain vignette relative min-h-screen flex flex-col bg-[#1A1612] overflow-x-hidden">
            {/* Warm center glow */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(212,168,83,0.05) 0%, transparent 70%)",
                }}
            />

            {/* Header */}
            <header className="relative z-10 flex justify-between items-center px-8 py-6">
                <Link
                    href="/"
                    className="italic text-[#D4A853] text-xl tracking-tight"
                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                >
                    Echoes of Us
                </Link>
                <nav>
                    <Link
                        href="/gallery"
                        className="text-xs uppercase tracking-widest text-[#D4A853] border-b border-[#D4A853] pb-0.5"
                        style={{ fontFamily: "var(--font-inter)" }}
                    >
                        My Stories
                    </Link>
                </nav>
            </header>

            {/* Main */}
            <main className="relative z-10 flex flex-col items-center gap-14 px-4 md:px-8 py-8 pb-20 w-full max-w-5xl mx-auto">

                {/* Hero player card */}
                <section
                    className="w-full rounded-3xl p-8 md:p-12 flex flex-col items-center text-center gap-8"
                    style={{
                        background: "rgba(34, 30, 25, 0.75)",
                        backdropFilter: "blur(24px)",
                        boxShadow: "0 0 48px rgba(212, 168, 83, 0.06), inset 0 0 0 1px rgba(212, 168, 83, 0.08)",
                    }}
                >
                    {/* Title */}
                    <div className="space-y-2">
                        <h1
                            className="text-5xl md:text-6xl text-[#F5ECD7] tracking-tight"
                            style={{ fontFamily: "var(--font-eb-garamond)" }}
                        >
                            Margaret Chen
                        </h1>
                        <p
                            className="italic text-[#F5ECD7]/60 text-lg font-light"
                            style={{ fontFamily: "var(--font-eb-garamond)" }}
                        >
                            A Life in Stories{" "}
                            <span className="text-[#D4A853]/40 not-italic mx-1">·</span>{" "}
                            47 minutes
                        </p>
                    </div>

                    {/* Amber rule */}
                    <div className="w-20 h-px bg-[#D4A853]/30" />

                    {/* Decorative waveform */}
                    <div
                        className="flex items-center justify-center gap-[3px] h-16 w-full"
                        aria-hidden="true"
                    >
                        {WAVEFORM_BARS.map((h, i) => (
                            <div
                                key={i}
                                className="w-1 rounded-full bg-[#D4A853]"
                                style={{ height: `${h}px`, opacity: 0.4 + (h / 64) * 0.6 }}
                            />
                        ))}
                    </div>

                    {/* Playback controls */}
                    <div className="flex items-center justify-center gap-10 md:gap-14 w-full">
                        <button
                            onClick={() => skip(-15)}
                            disabled={!hasDocumentary}
                            aria-label="Rewind 15 seconds"
                            className="text-[#F5ECD7]/50 hover:text-[#F5ECD7] transition-colors duration-300 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8Z" />
                                <text x="8.5" y="15" fontSize="5" fill="currentColor" fontFamily="Inter">15</text>
                            </svg>
                        </button>

                        <button
                            onClick={togglePlay}
                            disabled={!hasDocumentary}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D4A853]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(135deg, #C8922A, #D4A853)",
                                boxShadow: "0 0 32px rgba(212, 168, 83, 0.4)",
                            }}
                        >
                            {isPlaying ? (
                                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={() => skip(15)}
                            disabled={!hasDocumentary}
                            aria-label="Forward 15 seconds"
                            className="text-[#F5ECD7]/50 hover:text-[#F5ECD7] transition-colors duration-300 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8Z" />
                                <text x="8.5" y="15" fontSize="5" fill="currentColor" fontFamily="Inter">15</text>
                            </svg>
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div
                        className="w-full flex items-center gap-4 text-xs text-[#D4A853]/60"
                        style={{ fontFamily: "var(--font-inter)" }}
                    >
                        <span className="font-mono" suppressHydrationWarning>{formatTime(currentTime)}</span>
                        <div
                            onClick={seek}
                            className="flex-grow h-1 bg-black/40 rounded-full relative cursor-pointer group"
                        >
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-[#D4A853] rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                                suppressHydrationWarning
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F5ECD7] rounded-full shadow-[0_0_8px_rgba(212,168,83,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                                suppressHydrationWarning
                            />
                        </div>
                        <span className="font-mono" suppressHydrationWarning>{formatTime(duration)}</span>
                        <button aria-label="Volume" className="ml-1 text-[#F5ECD7]/40 hover:text-[#F5ECD7] transition-colors">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>
                        </button>
                    </div>
                </section>

                {/* Chapters */}
                <section className="w-full space-y-6">
                    <h2
                        className="text-3xl text-[#F5ECD7] tracking-tight"
                        style={{ fontFamily: "var(--font-eb-garamond)" }}
                    >
                        Chapters
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {CHAPTERS.map((ch) => (
                            <button
                                key={ch.number}
                                className="text-left rounded-2xl p-6 flex flex-col justify-between min-h-[140px] transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/50 relative overflow-hidden"
                                style={{
                                    background: ch.active
                                        ? "rgba(42, 37, 32, 0.85)"
                                        : "rgba(34, 30, 25, 0.5)",
                                    boxShadow: ch.active
                                        ? "0 0 20px rgba(212, 168, 83, 0.08), inset 0 0 0 1px rgba(212, 168, 83, 0.2)"
                                        : "inset 0 0 0 1px transparent",
                                }}
                            >
                                {/* Active left accent */}
                                {ch.active && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4A853] rounded-r-full" />
                                )}
                                <div className="flex justify-between items-start">
                                    <span
                                        className="text-[10px] uppercase tracking-widest text-[#D4A853]/80 flex items-center gap-2"
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    >
                                        {ch.active && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] animate-pulse" />
                                        )}
                                        Chapter {ch.number}
                                    </span>
                                    <span
                                        className="text-xs font-mono text-[#F5ECD7]/35"
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    >
                                        {ch.duration}
                                    </span>
                                </div>
                                <h3
                                    className="text-2xl text-[#F5ECD7]/90 mt-4"
                                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                                >
                                    {ch.title}
                                </h3>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Share CTA */}
                <button
                    className="px-8 py-3 rounded-full border text-sm uppercase tracking-widest transition-colors duration-500 hover:bg-[#D4A853]/10 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/50"
                    style={{
                        borderColor: "rgba(212, 168, 83, 0.5)",
                        color: "#D4A853",
                        fontFamily: "var(--font-inter)",
                    }}
                >
                    Share Your Story
                </button>
            </main>

            {/* Audio elements for documentary playback */}
            <audio ref={audioRef} />
            <audio ref={musicRef} />
        </div>
    );
}
