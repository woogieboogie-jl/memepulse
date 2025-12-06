'use client'

import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCode, Zap, Database, Globe, Code2, Lock } from 'lucide-react'
import { getAllFeedContracts } from '@/lib/memecoin-contracts'
import { CONTRACTS, MEMECORE_NETWORK } from '@/lib/contracts'

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

                    {/* System Architecture Section - NEW! */}
                    <Card className="mb-6 border-primary/30" id="architecture">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                <CardTitle>System Architecture</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Dual-Chain Overview */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Dual-Chain Design</h3>
                                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        MemePulse operates across two blockchain networks to optimize for different use cases:
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-background rounded-lg p-4 border border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <Zap className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <h4 className="font-semibold">Trading Layer</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                <strong>Arbitrum (Perpetual DEX)</strong>
                                            </p>
                                            <ul className="text-xs space-y-1 text-muted-foreground">
                                                <li>• Agent perp trading execution</li>
                                                <li>• Manual trading interface</li>
                                                <li>• User deposits & delegations</li>
                                                <li>• Low-latency, high-throughput</li>
                                            </ul>
                                        </div>

                                        <div className="bg-background rounded-lg p-4 border border-primary/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <Database className="h-4 w-4 text-primary" />
                                                </div>
                                                <h4 className="font-semibold">Oracle Layer</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                <strong>MemeCore Network</strong>
                                            </p>
                                            <ul className="text-xs space-y-1 text-muted-foreground">
                                                <li>• Price oracle contracts (1 per coin)</li>
                                                <li>• Agent registration as providers</li>
                                                <li>• VWAP price updates</li>
                                                <li>• Foundation subsidy distribution</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                                        <h4 className="font-semibold text-sm mb-2">Data Flow</h4>
                                        <div className="text-xs space-y-1 font-mono text-muted-foreground">
                                            <div>1. Agent/Manual trades execute on <strong>Arbitrum (Perp DEX)</strong></div>
                                            <div>2. VWAP calculated from trade volume + time weight</div>
                                            <div>3. Price update written to oracle on <strong>MemeCore</strong></div>
                                            <div>4. Contributors earn foundation subsidies</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VWAP Mechanism */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">VWAP Price Mechanism</h3>
                                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Oracle prices are updated using <strong>Volume-Weighted Average Price (VWAP)</strong> from live perp trading:
                                    </p>

                                    <div className="bg-background rounded-lg p-3 border">
                                        <code className="text-xs block">
                                            VWAP = Σ(Price × Volume × Time Weight) / Σ(Volume × Time Weight)
                                        </code>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3 text-xs">
                                        <div className="bg-accent/10 rounded p-3">
                                            <strong className="block mb-1">Volume Weight</strong>
                                            <span className="text-muted-foreground">Larger trades have more influence on oracle price</span>
                                        </div>
                                        <div className="bg-accent/10 rounded p-3">
                                            <strong className="block mb-1">Time Weight</strong>
                                            <span className="text-muted-foreground">Recent trades weighted more than older trades</span>
                                        </div>
                                        <div className="bg-accent/10 rounded p-3">
                                            <strong className="block mb-1">Result</strong>
                                            <span className="text-muted-foreground">Manipulation-resistant, market-accurate pricing</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Lifecycle */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Agent Registration Flow</h3>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <ol className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                                            <div>
                                                <strong className="text-sm">Agent Creation</strong>
                                                <p className="text-xs text-muted-foreground mt-1">User deploys agent on Perpetual DEX (Arbitrum)</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                                            <div>
                                                <strong className="text-sm">Oracle Registration</strong>
                                                <p className="text-xs text-muted-foreground mt-1">Agent public key registered to memecoin oracle on MemeCore</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                                            <div>
                                                <strong className="text-sm">Trading Activity</strong>
                                                <p className="text-xs text-muted-foreground mt-1">Agent executes perp trades based on strategy conditions</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span>
                                            <div>
                                                <strong className="text-sm">Oracle Updates</strong>
                                                <p className="text-xs text-muted-foreground mt-1">VWAP calculated and written to MemeCore oracle contract</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">💰</span>
                                            <div>
                                                <strong className="text-sm">Dual Revenue</strong>
                                                <p className="text-xs text-muted-foreground mt-1">Trading P&L + MemeCore foundation oracle subsidies</p>
                                            </div>
                                        </li>
                                    </ol>
                                </div>
                            </div>

                            {/* Incentive Model */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Incentive Model</h3>
                                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Contributors earn rewards from two sources:
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                            <h4 className="font-semibold text-sm mb-2 text-green-500">1. Trading P&L</h4>
                                            <ul className="text-xs space-y-1 text-muted-foreground">
                                                <li>• Profit/loss from perpetual trades</li>
                                                <li>• Agent strategy performance</li>
                                                <li>• Delegators share in agent returns</li>
                                            </ul>
                                        </div>

                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                            <h4 className="font-semibold text-sm mb-2 text-blue-500">2. Oracle Subsidies</h4>
                                            <ul className="text-xs space-y-1 text-muted-foreground">
                                                <li>• MemeCore foundation rewards</li>
                                                <li>• Based on oracle update frequency</li>
                                                <li>• Available to agents & manual traders</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-background rounded-lg p-3 border text-xs">
                                        <strong>Example:</strong> Agent generates $100 trading profit + $15 oracle subsidies = <strong>$115 total return</strong>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                                    Wrapped M (wM) Token Contract
                                </h3>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Token Address:</span>
                                            <code className="bg-muted px-2 py-0.5 rounded font-mono flex-1 text-xs">
                                                {CONTRACTS.WM_TOKEN}
                                            </code>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Network:</span>
                                            <span>{MEMECORE_NETWORK.chainName}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-muted-foreground min-w-[100px]">Total Supply:</span>
                                            <span>1,000,000 wM</span>
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
                                Access real-time oracle price data for all supported memecoins
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
  "credibility": 85,
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
                                            <code className="bg-muted px-2 py-0.5 rounded font-mono text-[10px]">
                                                {MEMECORE_NETWORK.blockExplorer}
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
                                        Your agent will automatically contribute price data to the oracle and earn $M tokens based on accuracy and frequency.
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
