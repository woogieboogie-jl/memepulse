'use client'

import { useState, useEffect } from 'react'
import { createWalletClient, custom } from 'viem'
import { memeCoreTestnet } from '@/lib/client'

declare global {
    interface Window {
        ethereum?: any
    }
}

export function useWallet() {
    const [address, setAddress] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)

    const connect = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            alert('Please install a wallet like MetaMask')
            return
        }

        setIsConnecting(true)
        try {
            const client = createWalletClient({
                chain: memeCoreTestnet,
                transport: custom(window.ethereum)
            })

            const [account] = await client.requestAddresses()
            setAddress(account)

            // Switch chain if needed
            try {
                await client.switchChain({ id: memeCoreTestnet.id })
            } catch (e) {
                console.log('Chain not found, attempting to add...', e)
                // Add chain if missing
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x' + memeCoreTestnet.id.toString(16),
                            chainName: memeCoreTestnet.name,
                            nativeCurrency: memeCoreTestnet.nativeCurrency,
                            rpcUrls: [memeCoreTestnet.rpcUrls.default.http[0]],
                            blockExplorerUrls: [memeCoreTestnet.blockExplorers.default.url]
                        }]
                    })
                } catch (addError) {
                    console.error('Failed to add chain', addError)
                }
            }
        } catch (error) {
            console.error('Failed to connect', error)
        } finally {
            setIsConnecting(false)
        }
    }

    const disconnect = () => {
        setAddress(null)
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            // Check if already connected
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: any) => {
                    if (accounts.length > 0) setAddress(accounts[0])
                })
                .catch(console.error)

            // Listen for changes
            const handleAccountsChanged = (accounts: any) => {
                setAddress(accounts.length > 0 ? accounts[0] : null)
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged)

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
            }
        }
    }, [])

    return { address, isConnected: !!address, connect, disconnect, isConnecting }
}
