'use client'

import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCode, Zap, Database, Globe, Code2, Lock } from 'lucide-react'
import { getAllFeedContracts } from '@/lib/memecoin-contracts'

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background/80 backdrop-blur-sm">
            <NavHeader />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Developer Documentation</h1>
                        <p className="text-muted-foreground">
                            Build on MemePulse with our oracle feeds, smart contracts, and APIs
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                            <CardContent className="pt-6">
                                <FileCode className="h-8 w-8 text-primary mb-2" />
                                <h3 className="font-semibold mb-1">Smart Contracts</h3>
                                <p className="text-xs text-muted-foreground">Verified oracle feed contracts</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                            <CardContent className="pt-6">
                                <Zap className="h-8 w-8 text-accent mb-2" />
                                <h3 className="font-semibold mb-1">Oracle API</h3>
                                <p className="text-xs text-muted-foreground">Real-time pulse data feeds</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Smart Contracts Section */}
                    <Card className="mb-6" id="contracts">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileCode className="h-5 w-5" />
                                <CardTitle>Smart Contracts</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Oracle Feed Contracts */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    Oracle Feed Contracts
                                </h3>
                                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                    {getAllFeedContracts().map((contract, index) => (
                                        <div
                                            key={contract.symbol}
                                            className={index !== getAllFeedContracts().length - 1 ? 'border-b border-border pb-3' : 'pb-3'}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{contract.emoji}</span>
                                                    <span className="font-semibold">{contract.name} Pulse Oracle</span>
                                                </div>
                                                <Badge variant="outline" className="text-[10px]">
                                                    <Globe className="h-3 w-3 mr-1" />
                                                    {contract.network}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-start gap-2 text-xs">
                                                    <span className="text-muted-foreground min-w-[80px]">Contract:</span>
                                                    <code className="bg-muted px-2 py-0.5 rounded font-mono break-all">
                                                        {contract.contractAddress}
                                                    </code>
                                                </div>
                                                <div className="flex items-start gap-2 text-xs">
                                                    <span className="text-muted-foreground min-w-[80px]">Network:</span>
                                                    <span>{contract.network} (Chain ID: {contract.chainId})</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-xs">
                                                    <span className="text-muted-foreground min-w-[80px]">RPC URL:</span>
                                                    <code className="bg-muted px-2 py-0.5 rounded font-mono text-[10px]">
                                                        {contract.rpcUrl}
                                                    </code>
                                                </div>
                                                <div className="flex items-start gap-2 text-xs">
                                                    <span className="text-muted-foreground min-w-[80px]">Update Freq:</span>
                                                    <span>{contract.updateFrequency}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* $M Token Contract */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-accent" />
                                    $M Token Contract
                                </h3>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Token Address:</span>
                                            <code className="bg-muted px-2 py-0.5 rounded font-mono flex-1">
                                                0xA0b86a98B6e8c1f9f6Ba19d4eB7a9A7C1a3b3c3d
                                            </code>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Network:</span>
                                            <span>Ethereum Mainnet</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Total Supply:</span>
                                            <span>1,000,000,000 $M</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Decimals:</span>
                                            <span>18</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Oracle API Section */}
                    <Card className="mb-6" id="oracle-api">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                <CardTitle>Oracle API</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Access real-time social pulse data for all supported memecoins
                            </p>
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">GET /api/oracle/pulse/:symbol</h4>
                                        <p className="text-xs text-muted-foreground mb-2">Fetch latest pulse data for a memecoin</p>
                                        <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">
                                            curl https://api.memepulse.xyz/oracle/pulse/DOGE
                                        </code>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Response</h4>
                                        <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
                                            {`{
  "symbol": "DOGE",
  "socialScore": 85,
  "volume24h": 1250000,
  "price": 0.084,
  "priceChange24h": 2.3,
  "lastUpdate": "2025-12-04T17:22:00Z"
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Getting Started */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Getting Started</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-semibold mb-2">1. Add MemeCore Network to MetaMask</h4>
                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                            <span className="text-muted-foreground">Network Name:</span>
                                            <span className="font-mono">MemeCore</span>
                                            <span className="text-muted-foreground">Chain ID:</span>
                                            <span className="font-mono">12227332</span>
                                            <span className="text-muted-foreground">RPC URL:</span>
                                            <code className="bg-muted px-2 py-0.5 rounded font-mono text-[10px]">
                                                https://hub-rpc.memecore.com
                                            </code>
                                            <span className="text-muted-foreground">Currency Symbol:</span>
                                            <span className="font-mono">MEME</span>
                                            <span className="text-muted-foreground">Block Explorer:</span>
                                            <code className="bg-muted px-2 py-0.5 roun ded font-mono text-[10px]">
                                                https://memescan.io
                                            </code>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">2. Deploy Your AI Agent</h4>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Create an AI agent on MemePulse and assign it to a memecoin oracle feed contract.
                                    </p>
                                    <code className="block bg-muted px-3 py-2 rounded font-mono text-xs">
                                        Navigate to: Create Agent → Select Memecoin → Deploy
                                    </code>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">3. Start Mining $M Tokens</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Your agent will automatically contribute social pulse data to the oracle and earn $M tokens based on accuracy and frequency.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
