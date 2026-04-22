"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AudioPlayerProvider } from "@/app/components/AudioPlayerProvider";
import AudioPlayer from "@/app/components/AudioPlayer";

interface Profile {
    id: string;
    name: string;
    age: number;
    relation: string | null;
    chapters: Chapter[];
}

interface Chapter {
    id: string;
    chapterNumber: number;
    title: string;
    audioUrl: string | null;
    summary: string | null;
}

export default function PublicAudiobookPage() {
    const params = useParams();
    const shareSlug = params.share_slug as string;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`/api/book/${shareSlug}`);
                if (!response.ok) {
                    throw new Error("Audiobook not found");
                }
                const data = await response.json();
                setProfile(data);
            } catch (err) {
                console.error("Error fetching audiobook:", err);
                setError("Audiobook not found");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [shareSlug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1A1612]">
                <div className="text-[#D4A853] text-xl" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                    Loading audiobook...
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1A1612] px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl text-[#F5ECD7] italic" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                        Audiobook Not Found
                    </h1>
                    <p className="text-[#F5ECD7]/60" style={{ fontFamily: "var(--font-inter)" }}>
                        The audiobook you're looking for doesn't exist or has been removed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AudioPlayerProvider>
            <div className="film-grain vignette relative min-h-screen bg-[#1A1612] overflow-x-hidden">
                {/* Background gradient */}
                <div className="pointer-events-none fixed inset-0 z-0" style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(212,168,83,0.08) 0%, transparent 60%)"
                }} />

                {/* Header */}
                <header className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4A853]/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#D4A853]">
                                <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
                            </svg>
                        </div>
                        <span className="text-[#D4A853] text-xl italic tracking-tight" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                            Echoes of Us
                        </span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-12 pb-32">
                    {/* Album Art & Info Section */}
                    <section className="mb-16">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            {/* Album Art Placeholder */}
                            <div className="w-full md:w-80 h-80 flex-shrink-0">
                                <div
                                    className="w-full h-full rounded-3xl flex items-center justify-center"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(212,168,83,0.15) 0%, rgba(200,146,42,0.25) 100%)",
                                        backdropFilter: "blur(20px)",
                                        boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(212,168,83,0.2)"
                                    }}
                                >
                                    <div className="text-center space-y-4">
                                        <div className="w-24 h-24 mx-auto rounded-full bg-[#D4A853]/20 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-[#D4A853]">
                                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-[#F5ECD7]/40 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                                            Photo Coming Soon
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-[#D4A853]/80 mb-3" style={{ fontFamily: "var(--font-inter)" }}>
                                        AUDIOBOOK
                                    </p>
                                    <h1 className="text-5xl md:text-6xl text-[#F5ECD7] tracking-tight mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                        {profile.name}
                                    </h1>
                                    <div className="flex items-center gap-3 text-[#F5ECD7]/70" style={{ fontFamily: "var(--font-inter)" }}>
                                        {profile.relation && (
                                            <>
                                                <span className="text-base italic" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                                    {profile.relation}
                                                </span>
                                                <span className="text-[#D4A853]/40">•</span>
                                            </>
                                        )}
                                        <span className="text-base">Age {profile.age}</span>
                                        <span className="text-[#D4A853]/40">•</span>
                                        <span className="text-base">{profile.chapters.length} {profile.chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[#F5ECD7]/60 text-base leading-relaxed max-w-2xl" style={{ fontFamily: "var(--font-inter)" }}>
                                    A collection of memories and stories, preserved in their own voice.
                                    Listen to the chapters below to experience their life journey.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Tracklist */}
                    <section className="space-y-6">
                        <h2 className="text-2xl text-[#F5ECD7] tracking-tight mb-8" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                            Chapters
                        </h2>

                        {profile.chapters.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-[#F5ECD7]/40" style={{ fontFamily: "var(--font-inter)" }}>
                                    No chapters available yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {profile.chapters.map((chapter) => (
                                    <div
                                        key={chapter.id}
                                        className="rounded-2xl p-6 transition-all duration-300"
                                        style={{
                                            background: "rgba(34, 30, 25, 0.5)",
                                            backdropFilter: "blur(16px)",
                                            border: "1px solid rgba(212, 168, 83, 0.1)"
                                        }}
                                    >
                                        <div className="flex items-start gap-6">
                                            {/* Track Number */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
                                                <span className="text-[#D4A853] font-bold text-lg" style={{ fontFamily: "var(--font-inter)" }}>
                                                    {chapter.chapterNumber}
                                                </span>
                                            </div>

                                            {/* Track Info & Player */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl text-[#F5ECD7] mb-2 truncate" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                                    {chapter.title}
                                                </h3>

                                                {chapter.summary && (
                                                    <p className="text-sm text-[#F5ECD7]/50 mb-4 line-clamp-2" style={{ fontFamily: "var(--font-inter)" }}>
                                                        {chapter.summary}
                                                    </p>
                                                )}

                                                {/* Audio Player */}
                                                {chapter.audioUrl ? (
                                                    <AudioPlayer
                                                        chapterId={chapter.id}
                                                        audioUrl={chapter.audioUrl}
                                                        chapterTitle={chapter.title}
                                                    />
                                                ) : (
                                                    <div className="mt-4 p-3 rounded-lg bg-[#F5ECD7]/5 border border-[#F5ECD7]/10">
                                                        <p className="text-sm text-[#F5ECD7]/40" style={{ fontFamily: "var(--font-inter)" }}>
                                                            Audio not available
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-[#F5ECD7]/10 py-8">
                    <div className="max-w-6xl mx-auto px-6 md:px-12">
                        <p className="text-center text-[#F5ECD7]/30 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                            Created with <span className="text-[#D4A853]">Echoes of Us</span> • Preserving memories for generations
                        </p>
                    </div>
                </footer>
            </div>
        </AudioPlayerProvider>
    );
}
