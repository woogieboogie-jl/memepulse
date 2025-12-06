'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { OrderlyConfigProvider } from '@orderly.network/hooks'
import { DefaultEVMWalletAdapter } from '@orderly.network/default-evm-adapter'
import { EthersProvider } from '@orderly.network/web3-provider-ethers'
import { AuthProvider } from '@/contexts/AuthContext'
import { web3Onboard } from '@/lib/web3-onboard'

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <Web3OnboardProvider web3Onboard={web3Onboard}>
                <OrderlyConfigProvider
                    brokerId="woofi_pro"
                    networkId="mainnet"
                    brokerName="WOOFi"
                    walletAdapters={[new DefaultEVMWalletAdapter(new EthersProvider())]}
                >
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </OrderlyConfigProvider>
            </Web3OnboardProvider>
        </QueryClientProvider>
    )
}
