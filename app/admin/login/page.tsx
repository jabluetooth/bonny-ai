"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSocialLogin = async (provider: 'github' | 'google') => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
                },
            });

            if (error) {
                toast.error("Social login failed: " + error.message);
                setIsLoading(false);
            }
            // Note: No explicit routing here because OAuth redirects the whole window
        } catch (error) {
            toast.error("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error("Login failed: " + error.message);
                setIsLoading(false);
                return;
            }

            toast.success("Welcome back!");
            router.push("/admin");
            router.refresh();
        } catch (error) {
            toast.error("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-muted/40">
            <div className="w-full max-w-sm space-y-6 rounded-lg border bg-background p-6 shadow-sm">
                <div className="flex flex-col space-y-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to access the dashboard
                    </p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isLoading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In with Email
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" disabled={isLoading} onClick={() => handleSocialLogin('github')}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.42-1.305.763-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        GitHub
                    </Button>
                    <Button variant="outline" disabled={isLoading} onClick={() => handleSocialLogin('google')}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                        </svg>
                        Google
                    </Button>
                </div>
            </div>
        </div>
    );
}
