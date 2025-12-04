'use client'

import Link from 'next/link'
import { Github, Twitter, MessageCircle, FileCode, Book, Coins } from 'lucide-react'

export function Footer() {
    return (
        <footer className="border-t border-border bg-card mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Coins className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold">
                                <span className="text-primary">Meme</span>
                                <span className="text-accent">Pulse</span>
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            AI-powered memecoin trading agents with social pulse mining. Earn $M tokens through oracle contributions.
                        </p>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h3 className="font-semibold mb-3 text-sm">Platform</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
                                    Marketplace
                                </Link>
                            </li>
                            <li>
                                <Link href="/create" className="text-muted-foreground hover:text-primary transition-colors">
                                    Create Agent
                                </Link>
                            </li>
                            <li>
                                <Link href="/my-agents" className="text-muted-foreground hover:text-primary transition-colors">
                                    My Agents
                                </Link>
                            </li>
                            <li>
                                <Link href="/oracle" className="text-muted-foreground hover:text-primary transition-colors">
                                    Oracle Feeds
                                </Link>
                            </li>
                            <li>
                                <Link href="/trade" className="text-muted-foreground hover:text-primary transition-colors">
                                    Manual Trading
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Developer Resources */}
                    <div>
                        <h3 className="font-semibold mb-3 text-sm">Developers</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                    <Book className="h-3 w-3" />
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs#contracts" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                    <FileCode className="h-3 w-3" />
                                    Smart Contracts
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs#oracle-api" className="text-muted-foreground hover:text-primary transition-colors">
                                    Oracle API
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <Github className="h-3 w-3" />
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Community & Legal */}
                    <div>
                        <h3 className="font-semibold mb-3 text-sm">Community</h3>
                        <ul className="space-y-2 text-sm mb-4">
                            <li>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <Twitter className="h-3 w-3" />
                                    Twitter
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://discord.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <MessageCircle className="h-3 w-3" />
                                    Discord
                                </a>
                            </li>
                        </ul>
                        <h3 className="font-semibold mb-3 text-sm">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} MemePulse. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Built with ❤️ for the memecoin community
                    </p>
                </div>
            </div>
        </footer>
    )
}
