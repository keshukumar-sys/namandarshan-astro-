import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@/assets/hero-aarti.jpg";

// import AppleLogin from 'react-apple-login';
import { AtSign, Mail } from "lucide-react";
import { getApiUrl } from "@/utils/api";
import { toast } from "sonner";
import { getPostAuthPath } from "@/utils/authRouting";
import { SafeGoogleLoginButton } from "@/components/common/SafeGoogleLoginButton";

type RedirectState = { from?: { pathname?: string } | string };

const Login = () => {
    const [searchParams] = useSearchParams();
    const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [accountRole, setAccountRole] = useState<"user" | "pandit">(
        searchParams.get("role") === "pandit" ? "pandit" : "user"
    );

    // Forgot Password states
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotMessage, setForgotMessage] = useState("");

    const { loginUser, signupUser, sendOtp, verifyOtp, loginWithGoogle, user } = useAuth();
    const mode = searchParams.get("mode") || "login";
    const isFromGame = searchParams.get("isFromGame") === "true";
    const redirectUrl = searchParams.get("redirect");

    const navigate = useNavigate();
    const location = useLocation();
    const redirectState = location.state as RedirectState | null;
    const from =
        typeof redirectState?.from === "string"
            ? redirectState.from
            : redirectState?.from?.pathname || "/";

    const resetOtpState = useCallback(() => {
        setOtp("");
        setOtpSent(false);
    }, []);

    const handleAccountRoleChange = useCallback((role: "user" | "pandit") => {
        setAccountRole(role);
        resetOtpState();
    }, [resetOtpState]);

    useEffect(() => {
        setAccountRole(searchParams.get("role") === "pandit" ? "pandit" : "user");
        resetOtpState();
    }, [resetOtpState, searchParams]);

    const handleSuccessfulAuth = (role?: string) => {
        const nextPath = getPostAuthPath({ role: role || user?.role, redirectUrl, from });
        navigate(nextPath);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim();

        if (loginMethod === "password") {
            const res = await loginUser(trimmedEmail, password, accountRole);
            if (res.success) handleSuccessfulAuth(res.role || accountRole);
            else toast.error(res.message || "Invalid credentials.");
        } else {
            if (!otpSent) {
                const res = await sendOtp(trimmedEmail, accountRole);
                if (res.success) {
                    setOtpSent(true);
                    toast.success("OTP sent to your email!");
                } else toast.error(res.message || "Failed to send OTP.");
            } else {
                const normalizedOtp = otp.replace(/\D/g, "");
                if (normalizedOtp.length !== 6) {
                    toast.error("Enter the 6-digit OTP sent to your email.");
                    return;
                }

                const res = await verifyOtp(trimmedEmail, normalizedOtp, accountRole);
                if (res.success) handleSuccessfulAuth(accountRole);
                else toast.error(res.message || "Invalid OTP.");
            }
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await signupUser(email, password, name, accountRole);
        if (res.success) {
            toast.success("Account created successfully!");
            handleSuccessfulAuth(accountRole);
        } else {
            toast.error(res.message || "Account creation failed.");
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            setForgotMessage(data.message);
        } catch (err) {
            setForgotMessage("Error sending reset link.");
        }
    };

    const handleGoogleToken = async (accessToken: string) => {
        try {
            const socialRes = await loginWithGoogle(accessToken, accountRole);
            if (socialRes.success) handleSuccessfulAuth(accountRole);
            else toast.error(socialRes.message || "Google Login failed on server.");
        } catch (error) {
            toast.error("Google Login failed.");
        }
    };



    /*
    const handleAppleLoginSuccess = async (response: any) => {
        try {
            // Apple response contains user object on first login only
            const user = response.user || {};
            const socialRes = await socialLogin('apple', user.email || '', `${user.name?.firstName || ''} ${user.name?.lastName || ''}`.trim() || 'Apple User', response.authorization.id_token);
            if (socialRes.success) handleSuccessfulAuth();
            else toast.error(socialRes.message || "Apple Login failed on server.");
        } catch (error) {
            toast.error("Failed to process Apple Login");
        }
    };
    */

    // Render forms based on state
    if (isForgotPassword) {
        return (
            <div className="min-h-screen flex flex-col relative">
                <SEO title="Forgot Password" />
                <div className="absolute inset-0 z-0">
                    <img src={heroImage} alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                </div>
                <Header />
                <main className="flex-grow container mx-auto px-4 flex items-start justify-center relative z-10 pt-32 pb-8 md:pt-40 md:pb-12">
                    <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-white/20 mt-4 md:mt-8">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                            <CardDescription>Enter your email to receive a reset link.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input required type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                {forgotMessage && <p className="text-sm text-green-600">{forgotMessage}</p>}
                                <Button type="submit" className="w-full bg-primary py-6">Send Reset Link</Button>
                                <Button variant="link" onClick={() => setIsForgotPassword(false)} className="w-full">Back to Login</Button>
                            </form>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative">
            <SEO title="Login" />
            <div className="absolute inset-0 z-0">
                <img src={heroImage} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>
            <Header />

            <main className="flex-grow container mx-auto px-4 flex items-start justify-center relative z-10 pt-48 pb-8 md:pt-64 md:pb-12">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16 w-full max-w-7xl justify-center">
                    
                    {/* Center Column: Login Card */}
                    <div className="w-full max-w-md order-1 lg:order-2">
                        <Card className="w-full bg-white/95 backdrop-blur-md shadow-2xl border-white/20">
                            <CardHeader className="space-y-1 text-center pb-2">
                                <CardTitle className="text-3xl font-display font-bold text-primary">Namandarshan</CardTitle>
                                <CardDescription className="text-sm">
                                    Your gateway to divine journeys
                                </CardDescription>
                                {isFromGame && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center font-medium animate-pulse">
                                        🎁 Login to get 10% discount on your next booking!
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue={mode} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="login">Login</TabsTrigger>
                                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="login">
                                        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                            <Button type="button" variant={accountRole === "user" ? "default" : "ghost"} className="w-full" onClick={() => handleAccountRoleChange("user")}>Devotee</Button>
                                            <Button type="button" variant={accountRole === "pandit" ? "default" : "ghost"} className="w-full" onClick={() => handleAccountRoleChange("pandit")}>Pandit</Button>
                                        </div>
                                        {accountRole === "pandit" && (
                                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                Pandit access will open your dashboard after sign-in.
                                            </div>
                                        )}
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="flex justify-between mb-2">
                                                <Button
                                                    type="button"
                                                    variant={loginMethod === 'password' ? 'default' : 'outline'}
                                                    className="w-[48%]"
                                                    onClick={() => {
                                                        setLoginMethod('password');
                                                        resetOtpState();
                                                    }}
                                                >
                                                    <AtSign className="w-4 h-4 mr-2" /> Password
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={loginMethod === 'otp' ? 'default' : 'outline'}
                                                    className="w-[48%]"
                                                    onClick={() => {
                                                        setLoginMethod('otp');
                                                        resetOtpState();
                                                    }}
                                                >
                                                    <Mail className="w-4 h-4 mr-2" /> Email OTP
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    placeholder="devotee@example.com"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        if (otpSent) resetOtpState();
                                                    }}
                                                    className="bg-white"
                                                />
                                            </div>

                                            {loginMethod === 'password' && (
                                                <div className="space-y-2 relative">
                                                    <div className="flex justify-between">
                                                        <Label htmlFor="password">Password</Label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsForgotPassword(true)}
                                                            className="text-xs text-primary hover:underline"
                                                        >
                                                            Forgot Password?
                                                        </button>
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        required
                                                        className="bg-white"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {loginMethod === 'otp' && otpSent && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="otp">Enter 6-digit OTP</Label>
                                                    <Input
                                                        id="otp"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]{6}"
                                                        maxLength={6}
                                                        placeholder="123456"
                                                        required
                                                        className="bg-white text-center tracking-widest text-lg"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    />
                                                </div>
                                            )}

                                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mt-4">
                                                {loginMethod === 'otp' ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Sign In'}
                                            </Button>
                                        </form>

                                        <div className="mt-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-300"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="bg-white/95 px-2 text-muted-foreground">Or continue with</span>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <SafeGoogleLoginButton variant="outline" className="w-full" onToken={handleGoogleToken} onUnavailable={toast.error}>
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                </SafeGoogleLoginButton>

                                        {/* 
                                        <AppleLogin
                                            clientId={import.meta.env.VITE_APPLE_CLIENT_ID || ""}
                                            redirectURI={import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin}
                                            callback={handleAppleLoginSuccess}
                                            render={(props) => (
                                                <Button variant="outline" type="button" className="w-full" onClick={() => {
                                                    if (!import.meta.env.VITE_APPLE_CLIENT_ID) {
                                                        toast.error("Apple Client ID not configured. Please check .env file.");
                                                        return;
                                                    }
                                                    props.onClick();
                                                }}>
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.65-2.67-.65-1.25 0-1.64.65-2.67.65-1.01 0-2.12-.89-3.11-1.89C3.47 18.17 1.9 14.16 2.95 11.23c.53-1.46 1.87-2.4 3.31-2.42 1.04-.02 2.02.69 2.67.69.64 0 1.84-.85 3.1-.73 1.33.05 2.54.54 3.42 1.41-2.06 1.22-1.74 3.84.27 4.98-.44 1.13-.98 2.21-1.67 3.12zM15.13 5.3c-.56.68-1.39 1.13-2.26 1.08-.1-1.02.37-2.01.95-2.68.56-.67 1.45-1.12 2.28-1.1.1 1.04-.39 2.01-.97 2.7z" />
                                                    </svg>
                                                </Button>
                                            )}
                                        />
                                        */}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="signup">
                                        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                            <Button type="button" variant={accountRole === "user" ? "default" : "ghost"} className="w-full" onClick={() => handleAccountRoleChange("user")}>Devotee</Button>
                                            <Button type="button" variant={accountRole === "pandit" ? "default" : "ghost"} className="w-full" onClick={() => handleAccountRoleChange("pandit")}>Pandit</Button>
                                        </div>
                                        {accountRole === "pandit" && (
                                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                Pandit accounts are routed to your dashboard after registration.
                                            </div>
                                        )}
                                        <form onSubmit={handleSignup} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    placeholder="Your Name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="signup-email">Email</Label>
                                                <Input
                                                    id="signup-email"
                                                    type="email"
                                                    required
                                                    placeholder="devotee@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="signup-password">Password</Label>
                                                <Input
                                                    id="signup-password"
                                                    type="password"
                                                    required
                                                    className="bg-white"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </div>
                                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mt-4">
                                                Create Account
                                            </Button>
                                        </form>

                                        <div className="mt-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-300"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="bg-white/95 px-2 text-muted-foreground">Or sign up with</span>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <SafeGoogleLoginButton variant="outline" className="w-full" onToken={handleGoogleToken} onUnavailable={toast.error}>
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                </SafeGoogleLoginButton>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                            <CardFooter className="flex justify-center text-sm text-muted-foreground pb-6">
                                By continuing, you agree to our Terms of Service
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Login;
