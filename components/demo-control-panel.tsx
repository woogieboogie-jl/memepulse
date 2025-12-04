'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Settings,
    RotateCcw,
    Key,
    AlertTriangle,
    CheckCircle,
    X,
    ChevronUp,
    ChevronDown,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react'

export function DemoControlPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [showValues, setShowValues] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [isKeyExpired, setIsKeyExpired] = useState(false)

    // Update state from localStorage
    const updateState = () => {
        if (typeof window !== 'undefined') {
            setIsRegistered(localStorage.getItem('orderly_registered') === 'true')
            setIsKeyExpired(localStorage.getItem('orderly_key_expired') === 'true')
        }
    }

    // Initialize and listen for changes
    useEffect(() => {
        updateState()

        // Listen for custom storage events
        const handleStorageChange = () => {
            updateState()
        }

        window.addEventListener('localStorageChange', handleStorageChange)
        return () => window.removeEventListener('localStorageChange', handleStorageChange)
    }, [])

    // Keyboard shortcut: Cmd/Ctrl + Shift + D
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [])

    const [confirmResetAll, setConfirmResetAll] = useState(false)
    const [confirmResetReg, setConfirmResetReg] = useState(false)

    // Reset confirmation states when panel closes
    useEffect(() => {
        if (!isOpen) {
            setConfirmResetAll(false)
            setConfirmResetReg(false)
        }
    }, [isOpen])

    const handleResetAll = () => {
        if (confirmResetAll) {
            localStorage.clear()
            window.location.reload()
        } else {
            setConfirmResetAll(true)
            // Auto-reset confirmation after 3 seconds
            setTimeout(() => setConfirmResetAll(false), 3000)
        }
    }

    const handleResetRegistration = () => {
        if (confirmResetReg) {
            localStorage.removeItem('orderly_registered')
            window.location.reload()
        } else {
            setConfirmResetReg(true)
            setTimeout(() => setConfirmResetReg(false), 3000)
        }
    }

    const handleToggleKeyExpiration = () => {
        if (isKeyExpired) {
            localStorage.removeItem('orderly_key_expired')
        } else {
            localStorage.setItem('orderly_key_expired', 'true')
        }
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new Event('localStorageChange'))
    }

    const handleMarkAsRegistered = () => {
        localStorage.setItem('orderly_registered', 'true')
        localStorage.removeItem('orderly_key_expired')
        // Dispatch custom event for same-tab sync
        window.dispatchEvent(new Event('localStorageChange'))
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={() => setIsOpen(true)}
                    size="lg"
                    className="rounded-full shadow-lg h-14 w-14 p-0"
                    title="Open Demo Control Panel"
                >
                    <Settings className="h-6 w-6" />
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 shadow-2xl border-2 border-primary/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">Demo Controls</CardTitle>
                                <CardDescription className="text-xs">Testing utilities</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                {isMinimized ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {!isMinimized && (
                    <CardContent className="space-y-4">
                        {/* Current State */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Current State</p>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Registration:</span>
                                    <Badge variant={isRegistered ? "default" : "secondary"} className="gap-1">
                                        {isRegistered ? (
                                            <>
                                                <CheckCircle className="h-3 w-3" />
                                                Registered
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-3 w-3" />
                                                Not Registered
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                {/* Only show Trading Key if registered */}
                                {isRegistered && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Trading Key:</span>
                                        <Badge
                                            variant={isKeyExpired ? "outline" : "default"}
                                            className={isKeyExpired ? "gap-1 border-orange-500/50 bg-orange-500/10 text-orange-500" : "gap-1"}
                                        >
                                            {isKeyExpired ? (
                                                <>
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Expired
                                                </>
                                            ) : (
                                                <>
                                                    <Key className="h-3 w-3" />
                                                    Active
                                                </>
                                            )}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* localStorage Values */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">localStorage</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setShowValues(!showValues)}
                                >
                                    {showValues ? (
                                        <>
                                            <EyeOff className="h-3 w-3 mr-1" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-3 w-3 mr-1" />
                                            Show
                                        </>
                                    )}
                                </Button>
                            </div>
                            {showValues && (
                                <div className="bg-muted/50 rounded-md p-2 space-y-1 font-mono text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">orderly_registered:</span>
                                        <span className="font-semibold">
                                            {localStorage.getItem('orderly_registered') || 'null'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">orderly_key_expired:</span>
                                        <span className="font-semibold">
                                            {localStorage.getItem('orderly_key_expired') || 'null'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={handleToggleKeyExpiration}
                                    disabled={!isRegistered}
                                >
                                    <Key className="h-3 w-3 mr-1" />
                                    {isKeyExpired ? 'Activate Key' : 'Expire Key'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={handleMarkAsRegistered}
                                    disabled={isRegistered && !isKeyExpired}
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Set Registered
                                </Button>
                            </div>
                        </div>

                        {/* Reset Actions */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Reset Actions</p>
                            <div className="space-y-2">
                                <Button
                                    variant={confirmResetReg ? "destructive" : "outline"}
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={handleResetRegistration}
                                    disabled={!isRegistered}
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    {confirmResetReg ? 'Are you sure? Click to Confirm' : 'Reset Registration Only'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className={`w-full text-xs ${confirmResetAll ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                    onClick={handleResetAll}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    {confirmResetAll ? 'Are you sure? Click to Confirm' : 'Clear All & Reload'}
                                </Button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-muted/30 rounded-md p-2">
                            <p className="text-xs text-muted-foreground">
                                💡 <span className="font-medium">Tip:</span> Use keyboard shortcut{' '}
                                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
                                    Cmd/Ctrl + Shift + D
                                </kbd>{' '}
                                to toggle this panel
                            </p>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
