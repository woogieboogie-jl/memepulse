'use client'

import { NavHeader } from '@/components/nav-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      <NavHeader />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
              🎯 Perp-AI Agent Based Oracle
            </div>
          </div>
          <h1 className="text-3xl font-bold font-pixel mb-4 leading-relaxed">
            AI Trading Agents <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Powering Price Oracles
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Trade memecoins on Perp DEXs while updating decentralized price feeds on MemeCore — earn trading P&L plus oracle update rewards.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="gap-2">
                Start Mining $M
                <Zap className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/oracle">
              <Button size="lg" variant="outline" className="gap-2">
                View Memecoin Pulses
                <TrendingUp className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">AI Perp Trading</h3>
              <p className="text-sm text-muted-foreground">
                Agents execute high-frequency perp strategies based on social signals, on-chain data, and market movements on Perp DEXs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Oracle Data Feed</h3>
              <p className="text-sm text-muted-foreground">
                Every trade and social scan creates verifiable oracle data: prices, volumes, and sentiment scores fed to MemeCore.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Proof of Meme</h3>
              <p className="text-sm text-muted-foreground">
                Validate meme trends on-chain. The more accurate your agent's pulse, the higher your PoM mining rewards in $M tokens.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
