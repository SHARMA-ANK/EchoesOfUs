"use client";

import { useCallback, useState, useRef, useEffect, Suspense } from "react";
import { Conversation } from "@elevenlabs/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const WAVEFORM_BARS = [16, 24, 40, 56, 40, 64, 80, 56, 48, 72, 56, 32, 64, 80, 48, 40, 56, 32, 24, 16];

type MicError = "denied" | "unavailable" | null;
type ConversationStatus = "disconnected" | "connecting" | "connected";

function InterviewPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const profileId = searchParams.get("profileId");
    const magicLinkToken = searchParams.get("token");

    const [micError, setMicError] = useState<MicError>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<ConversationStatus>("disconnected");
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Conversation and MediaRecorder refs
    const conversationRef = useRef<Conversation | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const isConnected = status === "connected";

    const handleStart = useCallback(async () => {
        setMicError(null);
        setStatus("connecting");

        // 1. Request mic permission
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setMicError("denied");
            setStatus("disconnected");
            return;
        }

        const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
        if (!agentId) {
            console.error("NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not set.");
            setStatus("disconnected");
            return;
        }

        // 2. Start MediaRecorder to capture user's voice for cloning
        try {
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.start(1000); // Capture in 1-second chunks
            mediaRecorderRef.current = recorder;
            console.log("MediaRecorder started");
        } catch (err) {
            console.error("MediaRecorder error:", err);
        }

        // 3. Fetch profile context if profileId exists
        let overrides = undefined;
        if (profileId) {
            try {
                const contextRes = await fetch(`/api/profile-context?profileId=${profileId}`);
                if (contextRes.ok) {
                    const contextData = await contextRes.json();
                    if (contextData.hasChapters && contextData.overridePrompt) {
                        overrides = {
                            agent: {
                                prompt: {
                                    prompt: contextData.overridePrompt,
                                },
                                firstMessage: contextData.firstMessage || "Welcome back! Let's continue your story.",
                            },
                        };
                        console.log("Agent memory enabled with overrides");
                        console.log("Override prompt:", contextData.overridePrompt);
                        console.log("First message:", contextData.firstMessage);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile context:", err);
            }
        }

        // 4. Start ElevenLabs conversation with overrides
        try {
            const sessionConfig: any = { agentId };

            if (overrides) {
                sessionConfig.overrides = overrides;
                console.log("Starting Conversation.startSession with overrides");
            }

            const conversation = await Conversation.startSession(sessionConfig);
            conversationRef.current = conversation;

            console.log("Conversation started successfully");
            setStatus("connected");
            setMicError(null);

        } catch (err) {
            console.error("Session start error:", err);
            setMicError("unavailable");
            setStatus("disconnected");
        }
    }, [profileId]);

    const handleEnd = useCallback(async () => {
        const conversation = conversationRef.current;
        const conversationId = conversation?.getId() ?? "";

        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            console.log("MediaRecorder stopped");
        }

        // End ElevenLabs session
        if (conversation) {
            await conversation.endSession();
        }

        // Wait a moment for final audio chunks
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        console.log("Audio blob size:", audioBlob.size);

        if (!conversationId || audioBlob.size === 0) {
            console.error("Missing conversationId or audio");
            if (profileId) {
                router.push(`/profiles/${profileId}`);
            } else {
                router.push("/gallery");
            }
            return;
        }

        // Navigate to processing screen
        setIsProcessing(true);

        // Send to backend for processing
        try {
            const formData = new FormData();
            formData.append("conversationId", conversationId);
            formData.append("audio", audioBlob, "user-voice.webm");

            const response = await fetch("/api/generate-documentary", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Documentary generation failed");
            }

            // Parse the new JSON response { voiceUrl, musicUrl, script, transcript, voiceId }
            const data = await response.json();
            const { voiceUrl, musicUrl, script, transcript, voiceId } = data;

            // If we have a profileId, save the chapter to the database
            if (profileId) {
                console.log("Saving chapter with voiceUrl:", voiceUrl);

                // voiceUrl already uploaded by the API — save chapter directly
                const chapterResponse = await fetch("/api/chapters", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: magicLinkToken,
                        profileId,
                        title: `Chapter ${new Date().toLocaleDateString()}`,
                        transcript,
                        summary: script.substring(0, 200) + "...",
                        audioUrl: voiceUrl,
                        voiceId,
                    }),
                });

                if (!chapterResponse.ok) {
                    const errorText = await chapterResponse.text();
                    console.error("Chapter save failed:", errorText);
                    throw new Error("Failed to save chapter");
                }

                const savedChapter = await chapterResponse.json();
                console.log("Chapter saved successfully:", savedChapter);

                // Redirect to profile dashboard
                router.push(`/profiles/${profileId}`);
            } else {
                // Store in sessionStorage for the gallery page (legacy flow)
                sessionStorage.setItem("voiceUrl", voiceUrl);
                sessionStorage.setItem("musicUrl", musicUrl ?? "");
                sessionStorage.setItem("documentaryScript", script);
                sessionStorage.setItem("voiceId", voiceId);
                router.push("/gallery");
            }
        } catch (error) {
            console.error("Processing error:", error);
            setMicError("unavailable");
            setIsProcessing(false);
        }
    }, [router, profileId]);

    const handleMicToggle = useCallback(() => {
        if (isConnected) {
            handleEnd();
        } else {
            handleStart();
        }
    }, [isConnected, handleEnd, handleStart]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (conversationRef.current) {
                conversationRef.current.endSession();
            }
        };
    }, []);

    // Show processing screen
    if (isProcessing) {
        return (
            <div className="film-grain vignette relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1A1612]">
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(42,34,24,0.9) 0%, #1A1612 70%)",
                    }}
                />
                <main className="relative z-10 flex flex-col items-center text-center gap-8 px-6">
                    <div className="relative">
                        {/* Spinning amber ring */}
                        <div
                            className="w-24 h-24 rounded-full border-4 border-[#D4A853]/20 border-t-[#D4A853] animate-spin"
                            style={{ animationDuration: "1.5s" }}
                        />
                    </div>
                    <div className="space-y-3">
                        <h1
                            className="italic text-4xl md:text-5xl text-[#F5ECD7] tracking-tight"
                            style={{ fontFamily: "var(--font-eb-garamond)" }}
                        >
                            Crafting your story...
                        </h1>
                        <p
                            className="text-lg text-[#D4A853]/75 font-light tracking-wide max-w-md"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            We're turning your memories into a beautiful documentary, narrated in your own voice.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="film-grain vignette relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1A1612]">
            <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    background:
                        "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(42,34,24,0.9) 0%, #1A1612 70%)",
                }}
            />

            <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-[#1A1612]/80 backdrop-blur-xl">
                <Link
                    href="/"
                    className="italic text-[#D4A853] text-xl tracking-tight"
                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                >
                    Echoes of Us
                </Link>
                <div
                    className="flex items-center gap-2 text-xs uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-inter)" }}
                >
                    {isConnected && (
                        <span className="flex items-center gap-1.5 text-[#D4A853]/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] animate-pulse" />
                            Recording
                        </span>
                    )}
                    {status === "connecting" && (
                        <span className="text-[#F5ECD7]/40">Connecting...</span>
                    )}
                </div>
            </header>

            <main className="relative z-10 w-full max-w-3xl flex flex-col items-center justify-center gap-14 px-6 pt-20">
                <div className="text-center space-y-3">
                    <h1
                        className="italic text-4xl md:text-5xl text-[#F5ECD7] tracking-tight"
                        style={{ fontFamily: "var(--font-eb-garamond)" }}
                    >
                        {isSpeaking
                            ? "Speaking..."
                            : isConnected
                                ? "I'm listening..."
                                : status === "connecting"
                                    ? "Connecting..."
                                    : "Ready when you are."}
                    </h1>
                    <p
                        className="text-lg text-[#D4A853]/75 font-light tracking-wide"
                        style={{ fontFamily: "var(--font-inter)" }}
                    >
                        {isConnected
                            ? "Take your time. Speak whenever you're ready."
                            : "Press the microphone to begin your story."}
                    </p>
                </div>

                <div
                    className="w-full rounded-[32px] flex items-center justify-center px-10 py-8 gap-[3px] transition-all duration-700"
                    style={{
                        background: "rgba(42, 37, 32, 0.7)",
                        backdropFilter: "blur(16px)",
                        boxShadow: isConnected
                            ? "0 0 40px rgba(212, 168, 83, 0.15), inset 0 0 0 1px rgba(212, 168, 83, 0.2)"
                            : "inset 0 0 0 1px rgba(212, 168, 83, 0.08)",
                    }}
                    aria-hidden="true"
                >
                    {WAVEFORM_BARS.map((height, i) => (
                        <div
                            key={i}
                            className="w-1.5 rounded-full bg-[#D4A853] transition-all"
                            style={{
                                height: `${height}px`,
                                opacity: isConnected ? 0.4 + (height / 80) * 0.6 : 0.15,
                                animation: isConnected
                                    ? `waveBar 1.2s ease-in-out ${(i * 60) % 600}ms infinite alternate`
                                    : "none",
                            }}
                        />
                    ))}
                </div>

                {micError && (
                    <div
                        className="w-full max-w-md rounded-2xl px-6 py-4 text-center"
                        style={{
                            background: "rgba(180, 60, 40, 0.12)",
                            border: "1px solid rgba(180, 60, 40, 0.25)",
                        }}
                        role="alert"
                    >
                        <p
                            className="text-[#F5ECD7]/90 text-base leading-relaxed"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            {micError === "denied"
                                ? "Microphone access was denied. Please allow microphone access in your browser settings and try again."
                                : "Could not connect to the interview service. Please check your connection and try again."}
                        </p>
                    </div>
                )}

                <div className="flex flex-col items-center gap-5">
                    <div className="relative flex items-center justify-center">
                        {isConnected && (
                            <div
                                className="mic-halo absolute rounded-full"
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    background: "rgba(212, 168, 83, 0.18)",
                                    filter: "blur(20px)",
                                }}
                            />
                        )}
                        <button
                            onClick={handleMicToggle}
                            disabled={status === "connecting"}
                            aria-label={isConnected ? "Stop recording" : "Start recording"}
                            className="relative w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#D4A853]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: isConnected
                                    ? "linear-gradient(135deg, #C8922A, #D4A853)"
                                    : "rgba(42, 37, 32, 0.9)",
                                boxShadow: isConnected
                                    ? "0 0 48px rgba(200, 146, 42, 0.45)"
                                    : "inset 0 0 0 2px rgba(212, 168, 83, 0.3)",
                            }}
                        >
                            {isConnected ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10" aria-hidden="true">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={status === "connecting" ? "rgba(245,236,215,0.4)" : "#D4A853"} className="w-12 h-12 md:w-14 md:h-14" aria-hidden="true">
                                    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Z" />
                                    <path d="M19 10a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 10Z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <p
                        className="text-xl text-[#F5ECD7] font-medium tracking-wide"
                        style={{ fontFamily: "var(--font-inter)" }}
                    >
                        {status === "connecting" ? "Connecting..." : isConnected ? "Tap to stop" : "Tap to begin"}
                    </p>
                </div>

                <div className="text-center space-y-4 pb-12">
                    {isConnected && (
                        <>
                            <p
                                className="text-xs text-[#D4A853]/50 uppercase tracking-[0.2em]"
                                style={{ fontFamily: "var(--font-inter)" }}
                            >
                                Your story is being saved securely.
                            </p>
                            <button
                                onClick={handleEnd}
                                className="text-lg text-[#F5ECD7]/60 hover:text-[#F5ECD7] transition-colors duration-300 border-b border-[#F5ECD7]/15 pb-0.5"
                                style={{ fontFamily: "var(--font-inter)" }}
                            >
                                End Interview
                            </button>
                        </>
                    )}
                    {!isConnected && status !== "connecting" && (
                        <Link
                            href="/"
                            className="text-sm text-[#F5ECD7]/30 hover:text-[#F5ECD7]/60 transition-colors duration-300"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            ← Back to home
                        </Link>
                    )}
                </div>
            </main>

            <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
        </div>
    );
}

export default function InterviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1A1612] flex items-center justify-center"><div className="text-[#D4A853]">Loading...</div></div>}>
            <InterviewPageInner />
        </Suspense>
    );
}
