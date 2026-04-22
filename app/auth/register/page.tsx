"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        familyName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password strength
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    familyName: formData.familyName,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Registration failed");
            }

            // Redirect to dashboard on success
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="film-grain vignette relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 px-4 overflow-hidden bg-[#1A1612]">
            {/* Background Layering */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0" style={{ background: "radial-gradient(circle, transparent 20%, #1A1612 100%)" }}></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4A853]/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#C8922A]/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#1A1612]/70 backdrop-blur-lg">
                <Link href="/" className="text-2xl font-headline italic text-[#D4A853]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                    Echoes of Us
                </Link>
                <Link href="/" className="text-[#F5ECD7]/60 hover:text-[#D4A853] transition-colors duration-500 flex items-center gap-2 text-sm uppercase tracking-widest" style={{ fontFamily: "var(--font-inter)" }}>
                    Home
                </Link>
            </header>

            {/* Central Form Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="p-10 md:p-14 rounded-3xl" style={{
                    background: "rgba(34, 30, 25, 0.7)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(212, 168, 83, 0.1)",
                    boxShadow: "0 0 24px rgba(212, 168, 83, 0.15)"
                }}>
                    {/* Card Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl italic text-[#F5ECD7] mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                            Begin Your Archive
                        </h1>
                        <p className="text-[#F5ECD7]/50 text-sm tracking-wide max-w-xs mx-auto" style={{ fontFamily: "var(--font-inter)" }}>
                            Create an account to preserve your family's legacy
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm text-center" style={{ fontFamily: "var(--font-inter)" }}>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="familyName" style={{ fontFamily: "var(--font-inter)" }}>
                                Family Name
                            </label>
                            <input
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                id="familyName"
                                name="familyName"
                                placeholder="e.g., The Smith Family"
                                required
                                type="text"
                                value={formData.familyName}
                                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                                style={{ fontFamily: "var(--font-inter)" }}
                            />
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="email" style={{ fontFamily: "var(--font-inter)" }}>
                                Email
                            </label>
                            <input
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                id="email"
                                name="email"
                                placeholder="your@email.com"
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{ fontFamily: "var(--font-inter)" }}
                            />
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="password" style={{ fontFamily: "var(--font-inter)" }}>
                                Password
                            </label>
                            <input
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                id="password"
                                name="password"
                                placeholder="At least 8 characters"
                                required
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                style={{ fontFamily: "var(--font-inter)" }}
                            />
                        </div>

                        <div className="relative group">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="confirmPassword" style={{ fontFamily: "var(--font-inter)" }}>
                                Confirm Password
                            </label>
                            <input
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Re-enter your password"
                                required
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                style={{ fontFamily: "var(--font-inter)" }}
                            />
                        </div>

                        {/* CTA */}
                        <div className="pt-4">
                            <button
                                className="w-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold py-5 rounded-xl transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    fontFamily: "var(--font-inter)",
                                    boxShadow: "0 0 20px rgba(212, 168, 83, 0.3)"
                                }}
                            >
                                <span className="text-sm uppercase tracking-[0.2em]">
                                    {isSubmitting ? "Creating Account..." : "Create Account"}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <p className="text-[#F5ECD7]/50 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-[#D4A853] hover:text-[#C8922A] transition-colors duration-300">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* Footnote */}
                    <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-[#F5ECD7]/30" style={{ fontFamily: "var(--font-inter)" }}>
                        Sacred Space • Private Archive • Encrypted
                    </p>
                </div>
            </div>
        </div>
    );
}
