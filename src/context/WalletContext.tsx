import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getApiUrl, readJsonResponse } from '@/utils/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { toast } from 'sonner';

type RechargeResult = {
    success: boolean;
    message?: string;
    balance?: number;
};

type RazorpayPaymentResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayFailedResponse = {
    error?: {
        description?: string;
        reason?: string;
    };
};

type RazorpayCheckoutOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
    handler: (response: RazorpayPaymentResponse) => void;
};

type RazorpayCheckout = {
    open: () => void;
    on: (event: 'payment.failed', handler: (response: RazorpayFailedResponse) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayCheckout;

declare global {
    interface Window {
        Razorpay: RazorpayConstructor | undefined;
    }
}

type PaymentOrderResponse = {
    message?: string;
    key?: string;
    amount?: number;
    currency?: string;
    order?: {
        id?: string;
        amount?: number;
        currency?: string;
        receipt?: string;
    };
};

type VerifyPaymentResponse = {
    message?: string;
    wallet?: {
        balance?: number;
    };
};

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpayScriptPromise: Promise<void> | null = null;

const loadRazorpayCheckout = () => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Razorpay checkout can only open in a browser.'));
    }

    if (window.Razorpay) {
        return Promise.resolve();
    }

    if (razorpayScriptPromise) {
        return razorpayScriptPromise;
    }

    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${RAZORPAY_CHECKOUT_URL}"]`
        );

        const handleReady = () => {
            if (window.Razorpay) {
                resolve();
            } else {
                razorpayScriptPromise = null;
                reject(new Error('Razorpay checkout script loaded, but checkout is unavailable.'));
            }
        };

        const handleError = () => {
            razorpayScriptPromise = null;
            reject(new Error('Unable to load Razorpay checkout. Please try again.'));
        };

        if (existingScript) {
            existingScript.addEventListener('load', handleReady, { once: true });
            existingScript.addEventListener('error', handleError, { once: true });
            window.setTimeout(handleReady, 1000);
            return;
        }

        const script = document.createElement('script');
        script.src = RAZORPAY_CHECKOUT_URL;
        script.async = true;
        script.onload = handleReady;
        script.onerror = handleError;
        document.body.appendChild(script);
    });

    return razorpayScriptPromise;
};

interface WalletContextType {
    balance: number;
    isLoading: boolean;
    isLowBalance: boolean; // true when balance can't sustain much more session time
    refreshBalance: () => Promise<void>;
    rechargeWallet: (amount: number) => Promise<RechargeResult>;
    hasSufficientBalance: (requiredAmount: number) => boolean;
}

const LOW_BALANCE_THRESHOLD = 50; // ₹ - below this we treat wallet as "low" for timer colors

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const { isUserAuthenticated } = useAuth();
    const { socket } = useSocket();
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshBalance = useCallback(async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            setBalance(0);
            setIsLoading(false);
            return;
        }
        try {
            const res = await fetch(getApiUrl('/api/wallet/balance'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setBalance(Number(data.balance) || 0);
            }
        } catch (err) {
            console.error('[WalletContext] Failed to fetch balance:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load + reload whenever auth state flips
    useEffect(() => {
        if (isUserAuthenticated) {
            refreshBalance();
        } else {
            setBalance(0);
            setIsLoading(false);
        }
    }, [isUserAuthenticated, refreshBalance]);

    // Live sync: backend pushes balance updates (e.g. while a paid chat/call is running)
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (payload: { balance: number }) => {
            if (typeof payload?.balance === 'number') {
                setBalance(payload.balance);
            }
        };

        const handleLow = (payload: { balance: number }) => {
            if (typeof payload?.balance === 'number') {
                setBalance(payload.balance);
            }
            toast.warning('Your wallet balance is running low. Please recharge to continue.');
        };

        socket.on('wallet:update', handleUpdate);
        socket.on('wallet:low', handleLow);

        return () => {
            socket.off('wallet:update', handleUpdate);
            socket.off('wallet:low', handleLow);
        };
    }, [socket]);

    const rechargeWallet = async (amount: number): Promise<{ success: boolean; message?: string }> => {
        const token = localStorage.getItem('userToken');
        if (!token) return { success: false, message: 'Please login first.' };

        try {
            const res = await fetch(getApiUrl('/api/astro-payments/recharge'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await readJsonResponse<PaymentOrderResponse>(res);
            if (!res.ok) {
                return { success: false, message: data.message || 'Failed to create payment order.' };
            }

            if (!data.order?.id) {
                return { success: false, message: 'Invalid payment order received from server.' };
            }

            await loadRazorpayCheckout();

            return new Promise<{ success: boolean; message?: string }>((resolve) => {
                if (!window.Razorpay) {
                    resolve({ success: false, message: 'Razorpay checkout is unavailable.' });
                    return;
                }

                const handlePaymentSuccess = async (response: RazorpayPaymentResponse) => {
                    try {
                        const verifyRes = await fetch(getApiUrl('/api/astro-payments/verify'), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await readJsonResponse<VerifyPaymentResponse>(verifyRes);
                        if (!verifyRes.ok) {
                            resolve({ success: false, message: verifyData.message || 'Payment verification failed.' });
                            return;
                        }

                        if (typeof verifyData.wallet?.balance === 'number') {
                            setBalance(verifyData.wallet.balance);
                        } else {
                            await refreshBalance();
                        }

                        toast.success(`₹${amount} added to your wallet.`);
                        resolve({ success: true });
                    } catch (error) {
                        console.error('[WalletContext] Payment verification error:', error);
                        resolve({ success: false, message: 'Payment verification failed.' });
                    }
                };

                const options: RazorpayCheckoutOptions = {
                    key: data.key || import.meta.env.VITE_RZP_KEY_ID,
                    amount: data.order.amount || amount * 100,
                    currency: data.order.currency || data.currency || 'INR',
                    name: 'Naman Darshan',
                    description: `Wallet recharge of ₹${amount}`,
                    order_id: data.order.id,
                    prefill: {
                        name: '',
                        email: '',
                    },
                    theme: {
                        color: '#ff6d00',
                    },
                    modal: {
                        ondismiss: () => {
                            resolve({ success: false, message: 'Payment was cancelled.' });
                        }
                    },
                    handler: handlePaymentSuccess
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', (response) => {
                    console.error('[WalletContext] Razorpay payment failed:', response);
                    resolve({
                        success: false,
                        message:
                            response.error?.description ||
                            response.error?.reason ||
                            'Payment failed. Please try again.'
                    });
                });

                rzp.open();
            });
        } catch (err) {
            console.error('[WalletContext] Recharge error:', err);
            return { success: false, message: 'Network error occurred.' };
        }
    };

    const hasSufficientBalance = (requiredAmount: number) => balance >= requiredAmount;

    return (
        <WalletContext.Provider
            value={{
                balance,
                isLoading,
                isLowBalance: balance > 0 && balance <= LOW_BALANCE_THRESHOLD,
                refreshBalance,
                rechargeWallet,
                hasSufficientBalance,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
