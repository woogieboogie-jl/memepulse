'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Key, Shield, AlertCircle, ArrowLeft } from 'lucide-react'
import { WalletSignaturePrompt } from '@/components/wallet-signature-prompt'
import { useConnectWallet } from '@web3-onboard/react'
import { useAccount } from '@orderly.network/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { userApi } from '@/lib/api'
import { WalletRequired } from '@/components/wallet-required'

// Orderly account status enum
enum AccountStatus {
    EnableTradingWithoutConnected = -1,
    NotConnected = 0,
    Connected = 1,
    NotSignedIn = 2,
    SignedIn = 3,
    DisabledTrading = 4,
    EnableTrading = 5,
}

const STATUS_INFO = {
    [AccountStatus.EnableTradingWithoutConnected]: {
        label: 'Trading Enabled (No Connection)',
        description: 'Trading enabled without connection',
        color: 'bg-green-500',
    },
    [AccountStatus.NotConnected]: {
        label: 'Not Connected',
        description: 'Wallet needs to be connected to Orderly',
        color: 'bg-gray-500',
    },
    [AccountStatus.Connected]: {
        label: 'Connected',
        description: 'Wallet connected, ready to create account',
        color: 'bg-blue-500',
    },
    [AccountStatus.NotSignedIn]: {
        label: 'Not Signed In',
        description: 'Need to create Orderly account',
        color: 'bg-yellow-500',
    },
    [AccountStatus.SignedIn]: {
        label: 'Signed In',
        description: 'Account created, need to add trading key',
        color: 'bg-orange-500',
    },
    [AccountStatus.DisabledTrading]: {
        label: 'Trading Disabled',
        description: 'Trading key expired, need to create new key',
        color: 'bg-red-500',
    },
    [AccountStatus.EnableTrading]: {
        label: 'Trading Enabled',
        description: 'Fully registered and ready to trade',
        color: 'bg-green-500',
    },
}

type RegistrationStep = 'idle' | 'creating-account' | 'account-created' | 'creating-key' | 'saving' | 'complete'

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isRenewalMode = searchParams.get('mode') === 'renew'

    const [{ wallet }] = useConnectWallet()
    const { account, state } = useAccount()
    const { auth, isAuthenticated } = useAuth()

    const address = wallet?.accounts?.[0]?.address

    const [step, setStep] = useState<RegistrationStep>('idle')
    const [error, setError] = useState<string | null>(null)

    const currentStatus = state?.status ?? AccountStatus.NotConnected
    const isFullyRegistered = currentStatus === AccountStatus.EnableTrading

    // Redirect if already registered and backend has keys
    useEffect(() => {
        const checkRegistration = async () => {
            if (!isFullyRegistered || !auth?.token) return

            try {
                const userInfo = await userApi.getMe()
                if (userInfo.orderlyAccountId) {
                    console.log('Already registered with Orderly, redirecting to create agent')
                    router.push('/create')
                }
            } catch (err) {
                console.error('Failed to check registration:', err)
            }
        }

        checkRegistration()
    }, [isFullyRegistered, auth?.token, router])

    const handleCreateAccount = async () => {
        if (!address || !account) {
            setError('Wallet not connected')
            return
        }

        setStep('creating-account')
        setError(null)

        try {
            console.log('Step 1: Creating Orderly account...')
            await account.createAccount()
            console.log('Account created')

            setStep('account-created')
        } catch (err) {
            console.error('Failed to create account:', err)
            setError(err instanceof Error ? err.message : 'Failed to create account')
            setStep('idle')
        }
    }

    const handleCreateKey = async () => {
        if (!address || !account) {
            setError('Wallet not connected')
            return
        }

        setStep('creating-key')
        setError(null)

        try {
            console.log('Creating/renewing Orderly trading key...')
            const keyResult = await account.createOrderlyKey(365)
            console.log('Orderly key created:', keyResult)

            // Get the stored key pair from keyStore
            const storedKeyPair = account.keyStore.getOrderlyKey(address)
            console.log('Stored key pair:', storedKeyPair)

            if (!storedKeyPair) {
                throw new Error('Failed to retrieve stored key pair')
            }

            const publicKey = keyResult.data?.orderly_key ?? keyResult.orderly_key
            const secretKey = storedKeyPair.secretKey

            // Save keys to backend
            setStep('saving')
            console.log('Saving keys to backend...')
            await userApi.registerOrderlyKey({
                accountId: account.accountId!,
                publicKey,
                secretKey,
            })
            console.log('Keys saved to backend')

            // Mark as registered
            localStorage.setItem('orderly_registered', 'true')
            localStorage.removeItem('orderly_key_expired')
            window.dispatchEvent(new Event('localStorageChange'))

            setStep('complete')

            // Redirect after a short delay
            setTimeout(() => {
                const redirectTo = searchParams.get('redirect') || '/create'
                router.push(redirectTo)
            }, 1500)
        } catch (err) {
            console.error('Failed to create key:', err)
            setError(err instanceof Error ? err.message : 'Failed to create trading key')
            setStep('idle')
        }
    }

    const needsAccountCreation = !isRenewalMode && currentStatus <= AccountStatus.NotSignedIn
    const needsKeyCreation = isRenewalMode || currentStatus === AccountStatus.SignedIn || currentStatus === AccountStatus.DisabledTrading
    const isProcessing = step !== 'idle' && step !== 'account-created' && step !== 'complete'
    const isKeyExpired = currentStatus === AccountStatus.DisabledTrading || isRenewalMode

    // Show connect wallet message if not connected
    if (!isAuthenticated) {
        return (
            <WalletRequired
                title="Connect Wallet"
                description="Please connect your wallet to register with Orderly."
                variant="card"
                showHeader={false}
            >
                <div />
            </WalletRequired>
        )
    }

    return (
        <div className="min-h-screen bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">
                                    {isRenewalMode ? 'Renew Trading Key' : 'Register with Orderly'}
                                </CardTitle>
                                <CardDescription>
                                    {isRenewalMode
                                        ? 'Your trading key has expired. Renew it to continue trading.'
                                        : 'Two-step setup to enable AI agent trading'}
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-destructive">Error</p>
                                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Current Status */}
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                            <Badge variant="outline" className="gap-2">
                                <div className={`h-2 w-2 rounded-full ${STATUS_INFO[currentStatus]?.color || 'bg-gray-500'}`} />
                                {STATUS_INFO[currentStatus]?.label || 'Unknown'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {STATUS_INFO[currentStatus]?.description || 'Unknown status'}
                        </p>
                    </div>

                    {/* Expired Key Warning */}
                    {isKeyExpired && step === 'idle' && (
                        <div className={`border rounded-lg p-4 flex items-start gap-3 ${isRenewalMode
                            ? 'bg-orange-500/10 border-orange-500/20'
                            : 'bg-destructive/10 border-destructive/20'
                            }`}>
                            <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${isRenewalMode ? 'text-orange-500' : 'text-destructive'
                                }`} />
                            <div className="space-y-1">
                                <p className={`text-sm font-medium ${isRenewalMode ? 'text-orange-500' : 'text-destructive'
                                    }`}>
                                    {isRenewalMode ? 'Trading Key Renewal Required' : 'Trading Key Expired'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isRenewalMode
                                        ? 'Your trading key has expired. Please create a new one to continue managing your agents.'
                                        : 'Your trading key has reached its 365-day expiration. Renew it below to continue trading.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Create Account (Completed View for Renewal) */}
                    {isRenewalMode && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-green-700 dark:text-green-400">Orderly Account Active</h3>
                                    <p className="text-xs text-muted-foreground">Account ID: {account.accountId?.slice(0, 10)}...</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/5">
                                Completed
                            </Badge>
                        </div>
                    )}

                    {/* Step 1: Create Account (Normal Flow) */}
                    {needsAccountCreation && step === 'idle' && !isRenewalMode && (
                        <div className="space-y-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                                    Create Orderly Account
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    First, we'll create your Orderly account on-chain. This requires one wallet signature.
                                </p>
                                <Button onClick={handleCreateAccount} className="w-full" size="lg" disabled={isProcessing}>
                                    <Key className="mr-2 h-4 w-4" />
                                    Create Account
                                </Button>
                            </div>

                            <div className="bg-muted/30 border border-border rounded-lg p-4 opacity-60">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-sm">2</span>
                                    Create Trading Key
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Available after account creation
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Wallet Signature: Creating Account */}
                    {step === 'creating-account' && (
                        <WalletSignaturePrompt
                            message="Creating Orderly Account"
                            description="Please sign the registration message in your wallet"
                        />
                    )}

                    {/* Step 2: Create Trading Key */}
                    {(step === 'account-created' || (needsKeyCreation && step === 'idle')) && (
                        <div className="space-y-4">
                            {step === 'account-created' && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-500">Account Created Successfully</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Now let's create your trading key
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">
                                        {isRenewalMode ? '1' : '2'}
                                    </span>
                                    {isRenewalMode ? 'Renew Trading Key' : 'Create Trading Key'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {isRenewalMode
                                        ? 'Sign to generate a new trading key valid for 365 days.'
                                        : 'Now create a trading key to enable API access.'}
                                </p>
                                <Button onClick={handleCreateKey} className="w-full" size="lg" disabled={isProcessing}>
                                    <Key className="mr-2 h-4 w-4" />
                                    {isRenewalMode ? 'Renew Key' : 'Create Key'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Wallet Signature: Creating Key */}
                    {step === 'creating-key' && (
                        <WalletSignaturePrompt
                            message={isRenewalMode ? "Renewing Trading Key" : "Creating Trading Key"}
                            description="Please sign the key addition message in your wallet"
                        />
                    )}

                    {/* Saving to Backend */}
                    {step === 'saving' && (
                        <WalletSignaturePrompt
                            message="Saving Credentials"
                            description="Securely storing your keys..."
                        />
                    )}

                    {/* Complete */}
                    {step === 'complete' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 flex flex-col items-center text-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium text-green-500">
                                    {isRenewalMode ? 'Key Renewed Successfully!' : 'Registration Complete!'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Redirecting to agent creation...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info Section */}
                    {step === 'idle' && !isKeyExpired && (
                        <div className="bg-muted/30 border border-border rounded-lg p-4">
                            <h4 className="font-medium mb-2">What is Orderly?</h4>
                            <p className="text-sm text-muted-foreground">
                                Orderly is a decentralized trading infrastructure that powers your AI trading agent.
                                Registration is free and only needs to be done once.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <RegisterContent />
        </Suspense>
    )
}
