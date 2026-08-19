import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiUrl, getAuthApiUrl } from '@/utils/api';

interface User {
    _id?: string;
    email: string;
    name?: string;
    role?: 'admin' | 'manager' | 'user' | 'astrologer' | 'pandit';
    password?: string;
    authProvider?: string;
    avatar?: string;
    banner?: string;
    hasUsedFreeChat?: boolean;
}

type AuthResult = { success: boolean, message?: string, role?: string };
type SocialLoginTokens = { accessToken?: string; access_token?: string; idToken?: string };
type GoogleProfile = { email: string; name: string; socialId: string };

interface GoogleUserInfoResponse {
    email?: string;
    email_verified?: boolean | string;
    id?: string;
    name?: string;
    given_name?: string;
    sub?: string;
}

interface AuthApiResponse {
    success?: boolean;
    message?: string;
    token?: string;
    user?: User;
}

interface AuthContextType {
    isUserAuthenticated: boolean;
    isAdminAuthenticated: boolean;
    user: User | null;
    admin: User | null;
    isLoading: boolean;
    loginUser: (email: string, password?: string, role?: string) => Promise<AuthResult>;
    signupUser: (email: string, password?: string, name?: string, role?: string) => Promise<AuthResult>;
    loginAdmin: (email: string, password?: string) => boolean; // Keeping mock admin for now or adjust later
    logoutUser: () => void;
    logoutAdmin: () => void;
    // New Advanced Auth Methods
    sendOtp: (email: string, role?: string) => Promise<AuthResult>;
    verifyOtp: (email: string, otp: string, role?: string) => Promise<AuthResult>;
    socialLogin: (provider: string, email?: string, name?: string, socialId?: string, role?: string, tokens?: SocialLoginTokens) => Promise<AuthResult>;
    loginWithGoogle: (accessToken: string, role?: string) => Promise<AuthResult>;
    updateUserProfile: (updates: Partial<User>) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [admin, setAdmin] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // App Load: Check Tokens
        const userToken = localStorage.getItem('userToken');
        if (userToken) {
            fetchUserFromToken(userToken);
        } else {
            setIsLoading(false);
        }

        // Keep Admin mock state check
        const storedAdminAuth = localStorage.getItem('isAdminAuthenticated');
        const storedAdmin = localStorage.getItem('admin');
        if (storedAdminAuth === 'true' && storedAdmin) {
            setIsAdminAuthenticated(true);
            setAdmin(JSON.parse(storedAdmin));
        }
    }, []);

    const fetchUserFromToken = async (token: string) => {
        try {
            const res = await fetch(getAuthApiUrl('/api/auth/me'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                setIsUserAuthenticated(true);
            } else {
                logoutUser();
            }
        } catch (error) {
            console.error(error);
            logoutUser();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthSuccess = async (data: AuthApiResponse): Promise<AuthResult> => {
        if (data.success && data.token) {
            localStorage.setItem('userToken', data.token);
            // Fetch full profile immediately to ensure all fields like avatar/banner are present 
            // and synced from the server's source of truth.
            await fetchUserFromToken(data.token);
            return { success: true, message: data.message || "Success", role: data.user?.role };
        }
        return { success: false, message: data.message || "Authentication failed" };
    };

    const signupUser = async (email: string, password?: string, name?: string, role: string = 'user'): Promise<AuthResult> => {
        try {
            const res = await fetch(getAuthApiUrl('/api/auth/signup'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, phone: '', role })
            });
            const data = await res.json();
            return await handleAuthSuccess(data);
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: "Network error occurred." };
        }
    };

    const loginUser = async (email: string, password?: string, role: string = 'user'): Promise<AuthResult> => {
        try {
            const res = await fetch(getAuthApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();
            return await handleAuthSuccess(data);
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: "Network error occurred." };
        }
    };

    const sendOtp = async (email: string, role: string = 'user'): Promise<AuthResult> => {
        try {
            const res = await fetch(getAuthApiUrl('/api/auth/send-otp'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });
            const data = await res.json();
            return { success: data.success, message: data.message };
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: "Network error occurred." };
        }
    };

    const verifyOtp = async (email: string, otp: string, role: string = 'user'): Promise<AuthResult> => {
        try {
            const res = await fetch(getAuthApiUrl('/api/auth/verify-otp'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, role })
            });
            const data = await res.json();
            return await handleAuthSuccess(data);
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: "Network error occurred." };
        }
    };

    const socialLogin = async (
        provider: string,
        email: string = '',
        name: string = '',
        socialId: string = '',
        role: string = 'user',
        tokens: SocialLoginTokens = {}
    ): Promise<AuthResult> => {
        try {
            const res = await fetch(getAuthApiUrl('/api/auth/social-login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, email, name, socialId, role, ...tokens })
            });
            const data = await res.json();
            return await handleAuthSuccess(data);
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: "Network error occurred." };
        }
    };

    const getGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!res.ok) {
            throw new Error('Unable to read Google profile.');
        }

        const profile = await res.json() as GoogleUserInfoResponse;
        const email = String(profile.email || '').trim().toLowerCase();
        const socialId = String(profile.sub || profile.id || '').trim();
        const name = String(profile.name || profile.given_name || '').trim();

        if (!email || !socialId || profile.email_verified === false || profile.email_verified === 'false') {
            throw new Error('Google account did not return a verified email profile.');
        }

        return { email, name, socialId };
    };

    const loginWithGoogle = async (accessToken: string, role: string = 'user'): Promise<AuthResult> => {
        try {
            const profile = await getGoogleProfile(accessToken);
            return socialLogin('google', profile.email, profile.name, profile.socialId, role, {
                accessToken,
                access_token: accessToken
            });
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: err instanceof Error ? err.message : "Google login failed." };
        }
    };

    const loginAdmin = (email: string, password?: string): boolean => {
        if (email.toLowerCase() === 'admin@namandarshan.com' && password === 'admin123') {
            const adminUser: User = { email, name: 'Admin', role: 'admin' };
            setAdmin(adminUser);
            setIsAdminAuthenticated(true);
            localStorage.setItem('isAdminAuthenticated', 'true');
            localStorage.setItem('admin', JSON.stringify(adminUser));
            return true;
        }
        return false;
    };

    const updateUserProfile = async (updates: Partial<User>): Promise<AuthResult> => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) return { success: false, message: "Not authorized" };

            const res = await fetch(getAuthApiUrl('/api/auth/profile'), {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (data.success) {
                // Combine existing user with updates for absolute immediate feedback 
                // in case the server response is missing fields we just updated.
                setUser(prev => prev ? { ...prev, ...updates } : null);
                
                // Then sync with whatever server definitely has
                if (data.user) {
                    setUser(data.user);
                }
                
                return { success: true, message: "Profile updated successfully" };
            }
            return { success: false, message: data.message || "Update failed" };
        } catch (err: unknown) {
            console.error(err);
            return { success: false, message: "Network error occurred." };
        }
    };

    const logoutUser = () => {
        setIsUserAuthenticated(false);
        setUser(null);
        localStorage.removeItem('userToken');
        // Clear all identity-related localStorage keys
        localStorage.removeItem("devotee_name");
        localStorage.removeItem("user.profileImage");
        localStorage.removeItem("user.banner");
    };

    const logoutAdmin = () => {
        setIsAdminAuthenticated(false);
        setAdmin(null);
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('admin');
    };

    return (
        <AuthContext.Provider value={{
            isUserAuthenticated, isAdminAuthenticated, user, admin, isLoading,
            loginUser, signupUser, loginAdmin, logoutUser, logoutAdmin,
            sendOtp, verifyOtp, socialLogin, loginWithGoogle, updateUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
