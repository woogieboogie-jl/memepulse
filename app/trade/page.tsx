'use client'

import { NavHeader } from '@/components/nav-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MarketList } from '@/components/market-list'
import { TradingChart } from '@/components/trading-chart'
import { OrderBook } from '@/components/order-book'
import { TradeFeed } from '@/components/trade-feed'
import { initializeMockData, getPositions, getOrders, getTradeHistory, updatePositionsPnL, type Position, type Order } from '@/lib/trading-data'
import { KeyRenewalModal } from '@/components/modals/key-renewal-modal'
import { PulseMonitor } from '@/components/pulse-monitor'
import { OracleMiningBanner } from '@/components/oracle-mining-banner'
import { WalletRequired } from '@/components/wallet-required'
import { useAuth } from '@/contexts/AuthContext'


export default function TradePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [selectedAsset, setSelectedAsset] = useState('DOGE-PERP')
  const [mounted, setMounted] = useState(false)
  const [isMarketListVisible, setIsMarketListVisible] = useState(true)

  // Order form state
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState('limit')
  const [price, setPrice] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [leverage, setLeverage] = useState('10x')

  // Trading data state
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tradeHistory, setTradeHistory] = useState<Order[]>([])
  const [totalBalance, setTotalBalance] = useState(10000) // Mock balance

  // Pagination state
  const [positionsPage, setPositionsPage] = useState(0)
  const positionsPerPage = 5
  const [pendingPage, setPendingPage] = useState(0)
  const [filledPage, setFilledPage] = useState(0)
  const [historyPage, setHistoryPage] = useState(0)
  const ordersPerPage = 5
  const [showRenewalModal, setShowRenewalModal] = useState(false)

  // Protect page - require valid trading key (only run when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return // Don't check until authenticated
    
    const isRegistered = localStorage.getItem('orderly_registered') === 'true'
    const isKeyExpired = localStorage.getItem('orderly_key_expired') === 'true'

    if (isKeyExpired) {
      setShowRenewalModal(true)
      return
    }

    if (!isRegistered) {
      router.push('/register')
    }
  }, [router, isAuthenticated])

  const handleRenewalSuccess = () => {
    setShowRenewalModal(false)
    window.dispatchEvent(new Event('localStorageChange'))
  }

  useEffect(() => {
    setMounted(true)
    // Initialize mock trading data
    initializeMockData()

    // Load initial data
    setPositions(getPositions())
    setOrders(getOrders())
    setTradeHistory(getTradeHistory())

    // Update positions P&L every 5 seconds
    const interval = setInterval(() => {
      const updatedPositions = updatePositionsPnL()
      setPositions(updatedPositions)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <NavHeader />
        <main className="container mx-auto px-4 py-4">
          <div className="max-w-full">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold font-pixel">Manual Mode</h1>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <WalletRequired
      title="Connect Your Wallet"
      description="Please connect your wallet to access Manual Trading mode."
      variant="minimal"
    >
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <h1 className="text-3xl font-bold font-pixel">Manual Mode</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Professional trading terminal with advanced order management
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PulseMonitor />
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                  SIMULATION
                </Badge>
              </div>
            </div>

            {/* Oracle + Mining Banner (Consolidated) - Pass selected asset */}
            <div className="mt-4">
              <OracleMiningBanner selectedFeed={selectedAsset} />
            </div>
          </div>
        </div>

        {/* Main Trading Interface - Flex Layout */}
        <div className="container mx-auto px-2 sm:px-4 pb-4">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-2 sm:gap-4" style={{ minHeight: 'calc(100vh - 140px)' }}>

            {/* Left + Center Area */}
            <div className="flex-1 flex flex-col gap-2 sm:gap-4 min-h-0">

              {/* Top Section - Chart and Market List */}
              <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 h-[400px] sm:h-[500px] lg:h-[700px]">

                {/* Left Panel - Market List - Hidden on mobile, collapsible on tablet+ */}
                <div className={`hidden md:block transition-all duration-300 ${isMarketListVisible ? 'w-full md:w-64' : 'w-12'} flex-shrink-0 relative`} style={{ paddingRight: '12px' }}>
                  <MarketList
                    selectedAsset={selectedAsset}
                    onAssetSelect={setSelectedAsset}
                    isVisible={isMarketListVisible}
                    onToggleVisibility={() => setIsMarketListVisible(!isMarketListVisible)}
                  />
                </div>

                {/* Mobile Market Selector - Only visible on mobile */}
                <div className="md:hidden mb-2">
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger className="w-full h-9 text-sm font-sans">
                      <SelectValue placeholder="Select Market" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Memecoin-only perps */}
                      {['DOGE-PERP', 'PEPE-PERP', 'SHIB-PERP', 'FLOKI-PERP', 'WIF-PERP', 'BONK-PERP', 'BTC-PERP'].map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Center Panel - Trading Chart */}
                <div className="flex-1 min-w-0 min-h-[300px] sm:min-h-[400px]">
                  <TradingChart selectedAsset={selectedAsset} />
                </div>
              </div>

              {/* Bottom Panel - Trading History (Only spans left + center) - Sized for exactly 5 positions */}
              <div className="flex-shrink-0 overflow-hidden" style={{ height: positions.length > 0 ? '340px' : '120px' }}>
                <Card className="h-full flex flex-col">
                  <CardContent className="p-1.5 sm:p-2 flex flex-col h-full min-h-0 overflow-hidden">
                    <Tabs defaultValue="positions" className="w-full h-full flex flex-col">
                      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 flex-shrink-0 h-8 overflow-x-auto">
                        <TabsTrigger value="positions" className="text-[9px] sm:text-[10px] py-1 px-1 sm:px-2">Positions</TabsTrigger>
                        <TabsTrigger value="pending" className="text-[9px] sm:text-[10px] py-1 px-1 sm:px-2">Pending</TabsTrigger>
                        <TabsTrigger value="filled" className="text-[9px] sm:text-[10px] py-1 px-1 sm:px-2">Filled</TabsTrigger>
                        <TabsTrigger value="history" className="text-[9px] sm:text-[10px] py-1 px-1 sm:px-2">History</TabsTrigger>
                        <TabsTrigger value="assets" className="text-[9px] sm:text-[10px] py-1 px-1 sm:px-2">Assets</TabsTrigger>
                        <TabsTrigger value="pnl" className="text-[9px] sm:text-[10px] py-1 px-1 sm:px-2">P&L</TabsTrigger>
                      </TabsList>

                      <TabsContent value="positions" className="mt-1 flex flex-col h-full overflow-hidden">
                        {positions.length > 0 ? (
                          <>
                            <div className="space-y-1 flex-1 overflow-y-auto">
                              {positions.slice(positionsPage * positionsPerPage, (positionsPage + 1) * positionsPerPage).map((position) => (
                                <div key={position.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 rounded border bg-card hover:bg-muted/50 transition-colors gap-1.5 sm:gap-0">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[8px] sm:text-[9px] px-1 py-0.5 h-4 ${position.side === 'long' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
                                      {position.side.toUpperCase()}
                                    </Badge>
                                    <span className="text-[9px] sm:text-[10px] font-medium font-sans">{position.symbol}</span>
                                    <span className="text-[7px] sm:text-[8px] text-muted-foreground font-sans">{position.leverage}x</span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] font-sans overflow-x-auto">
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-muted-foreground text-[6px] sm:text-[7px]">Size</div>
                                      <div className="font-medium">{position.size}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-muted-foreground text-[6px] sm:text-[7px]">Entry</div>
                                      <div className="font-medium">${position.entryPrice}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-muted-foreground text-[6px] sm:text-[7px]">P&L</div>
                                      <div className={`font-medium ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ${position.pnl} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pagination Controls */}
                            {positions.length > positionsPerPage && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border flex-shrink-0">
                                <span className="text-[9px] text-muted-foreground font-sans">
                                  {positionsPage * positionsPerPage + 1}-{Math.min((positionsPage + 1) * positionsPerPage, positions.length)} of {positions.length}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPositionsPage(Math.max(0, positionsPage - 1))}
                                    disabled={positionsPage === 0}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPositionsPage(positionsPage + 1)}
                                    disabled={(positionsPage + 1) * positionsPerPage >= positions.length}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center border border-dashed rounded-lg p-4">
                            <p className="text-[11px] text-muted-foreground">No open positions</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="pending" className="mt-1 flex flex-col">
                        {orders.filter(order => order.status === 'pending').length > 0 ? (
                          <>
                            <div className="space-y-1 flex-1 overflow-y-auto">
                              {orders.filter(order => order.status === 'pending').slice(pendingPage * ordersPerPage, (pendingPage + 1) * ordersPerPage).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-1.5 rounded border bg-card hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[9px] px-1 py-0.5 h-4 ${order.side === 'buy' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
                                      {order.side.toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] font-medium font-sans">{order.symbol}</span>
                                    <Badge variant="secondary" className="text-[8px] px-1 py-0.5 h-4">
                                      {order.type.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] font-sans">
                                    <div className="text-right">
                                      <div className="text-muted-foreground text-[7px]">Size</div>
                                      <div className="font-medium">{order.size}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground text-[7px]">Price</div>
                                      <div className="font-medium">${order.price}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground text-[7px]">Status</div>
                                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 text-yellow-600 border-yellow-200">
                                        {order.status}
                                      </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-4 px-1 text-[7px] text-red-600 hover:text-red-700 hover:bg-red-50">
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pagination Controls */}
                            {orders.filter(order => order.status === 'pending').length > ordersPerPage && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border flex-shrink-0">
                                <span className="text-[9px] text-muted-foreground font-sans">
                                  {pendingPage * ordersPerPage + 1}-{Math.min((pendingPage + 1) * ordersPerPage, orders.filter(order => order.status === 'pending').length)} of {orders.filter(order => order.status === 'pending').length}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPendingPage(Math.max(0, pendingPage - 1))}
                                    disabled={pendingPage === 0}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPendingPage(pendingPage + 1)}
                                    disabled={(pendingPage + 1) * ordersPerPage >= orders.filter(order => order.status === 'pending').length}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center border border-dashed rounded-lg p-4">
                            <p className="text-[10px] text-muted-foreground">No pending orders</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="filled" className="mt-1 flex flex-col">
                        {orders.filter(order => order.status === 'filled').length > 0 ? (
                          <>
                            <div className="space-y-1 flex-1 overflow-y-auto">
                              {orders.filter(order => order.status === 'filled').slice(filledPage * ordersPerPage, (filledPage + 1) * ordersPerPage).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-1.5 rounded border bg-card hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[9px] px-1 py-0.5 h-4 ${order.side === 'buy' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
                                      {order.side.toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] font-medium font-sans">{order.symbol}</span>
                                    <Badge variant="secondary" className="text-[8px] px-1 py-0.5 h-4">
                                      {order.type.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] font-sans">
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Size</div>
                                      <div className="font-medium">{order.filled}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Price</div>
                                      <div className="font-medium">${order.price}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Total</div>
                                      <div className="font-medium">${(order.filled * (order.price || 0)).toFixed(2)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Time</div>
                                      <div className="font-medium">{new Date(order.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pagination Controls */}
                            {orders.filter(order => order.status === 'filled').length > ordersPerPage && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border flex-shrink-0">
                                <span className="text-[9px] text-muted-foreground font-sans">
                                  {filledPage * ordersPerPage + 1}-{Math.min((filledPage + 1) * ordersPerPage, orders.filter(order => order.status === 'filled').length)} of {orders.filter(order => order.status === 'filled').length}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilledPage(Math.max(0, filledPage - 1))}
                                    disabled={filledPage === 0}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilledPage(filledPage + 1)}
                                    disabled={(filledPage + 1) * ordersPerPage >= orders.filter(order => order.status === 'filled').length}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center border border-dashed rounded-lg p-4">
                            <p className="text-[10px] text-muted-foreground">No filled orders</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="history" className="mt-1 flex flex-col">
                        {tradeHistory.length > 0 ? (
                          <>
                            <div className="space-y-1 flex-1 overflow-y-auto">
                              {tradeHistory.slice(historyPage * ordersPerPage, (historyPage + 1) * ordersPerPage).map((trade) => (
                                <div key={trade.id} className="flex items-center justify-between p-1.5 rounded border bg-card hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[9px] px-1 py-0.5 h-4 ${trade.side === 'buy' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
                                      {trade.side.toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] font-medium font-sans">{trade.symbol}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] font-sans">
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Size</div>
                                      <div className="font-medium">{trade.filled}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Price</div>
                                      <div className="font-medium">${trade.price}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Fee</div>
                                      <div className="font-medium">${((trade.filled * (trade.price || 0)) * 0.001).toFixed(4)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Total</div>
                                      <div className="font-medium">${(trade.filled * (trade.price || 0)).toFixed(2)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground">Time</div>
                                      <div className="font-medium">{new Date(trade.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pagination Controls */}
                            {tradeHistory.length > ordersPerPage && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border flex-shrink-0">
                                <span className="text-[9px] text-muted-foreground font-sans">
                                  {historyPage * ordersPerPage + 1}-{Math.min((historyPage + 1) * ordersPerPage, tradeHistory.length)} of {tradeHistory.length}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
                                    disabled={historyPage === 0}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHistoryPage(historyPage + 1)}
                                    disabled={(historyPage + 1) * ordersPerPage >= tradeHistory.length}
                                    className="h-6 px-2 text-[8px]"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center border border-dashed rounded-lg p-4">
                            <p className="text-[10px] text-muted-foreground">No trade history</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="assets" className="mt-2 flex-1 min-h-0 overflow-y-auto px-1">
                        <div className="space-y-1">
                          {/* Portfolio Summary */}
                          <div className="grid grid-cols-4 gap-2 p-1.5 rounded border bg-card">
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Total Balance</div>
                              <div className="text-[9px] font-bold font-sans">${totalBalance.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Available</div>
                              <div className="text-[9px] font-bold font-sans text-green-600">
                                ${(totalBalance - positions.reduce((sum, pos) => sum + pos.margin, 0)).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Used Margin</div>
                              <div className="text-[9px] font-bold font-sans text-orange-600">
                                ${positions.reduce((sum, pos) => sum + pos.margin, 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Unrealized P&L</div>
                              <div className={`text-[9px] font-bold font-sans ${positions.reduce((sum, pos) => sum + pos.pnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                ${positions.reduce((sum, pos) => sum + pos.pnl, 0).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Asset Breakdown */}
                          <div className="space-y-1">
                            <h4 className="text-[7px] font-medium text-muted-foreground font-sans">Asset Breakdown</h4>
                            <div className="p-1.5 rounded border bg-card">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                                    <DollarSign className="h-2 w-2 text-primary" />
                                  </div>
                                  <span className="text-[10px] font-medium font-sans">USD</span>
                                </div>
                                <div className="text-[9px] font-bold font-sans">${totalBalance.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pnl" className="mt-2 flex-1 min-h-0 overflow-y-auto px-1">
                        <div className="space-y-1">
                          {/* P&L Summary */}
                          <div className="grid grid-cols-3 gap-2 p-1.5 rounded border bg-card">
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Today's P&L</div>
                              <div className="text-[9px] font-bold font-sans text-green-600">+$127.45</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Total P&L</div>
                              <div className="text-[9px] font-bold font-sans text-green-600">
                                +${positions.reduce((sum, pos) => sum + pos.pnl, 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[7px] text-muted-foreground font-sans">Win Rate</div>
                              <div className="text-[9px] font-bold font-sans">73.2%</div>
                            </div>
                          </div>

                          {/* Recent P&L */}
                          <div className="space-y-1">
                            <h4 className="text-[7px] font-medium text-muted-foreground font-sans">Recent Performance</h4>
                            {positions.map((position) => (
                              <div key={position.id} className="flex items-center justify-between p-1.5 rounded border bg-card">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium font-sans">{position.symbol}</span>
                                  <Badge variant="outline" className={`text-[9px] px-1 py-0.5 h-4 ${position.side === 'long' ? 'text-green-600' : 'text-red-600'}`}>
                                    {position.side}
                                  </Badge>
                                </div>
                                <div className={`text-[9px] font-bold font-sans ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${position.pnl} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Full Height (Place Order + Order Book) - Independent */}
            <Card className="w-full lg:w-80 flex-shrink-0 flex flex-col h-auto lg:h-full mt-4 lg:mt-0">

              {/* Place Order Form - Dynamic Height */}
              <CardContent className="flex-shrink-0 p-2 sm:p-3 pb-3 sm:pb-4 border-b border-border">
                <div className="space-y-2">
                  {/* Buy/Sell Toggle */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant={side === 'buy' ? 'default' : 'outline'}
                      className={`h-9 sm:h-8 text-xs sm:text-sm font-sans font-medium transition-all touch-manipulation ${side === 'buy'
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                        : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-950'
                        }`}
                      onClick={() => setSide('buy')}
                    >
                      Buy
                    </Button>
                    <Button
                      variant={side === 'sell' ? 'default' : 'outline'}
                      className={`h-9 sm:h-8 text-xs sm:text-sm font-sans font-medium transition-all touch-manipulation ${side === 'sell'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                        : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950'
                        }`}
                      onClick={() => setSide('sell')}
                    >
                      Sell
                    </Button>
                  </div>

                  {/* Order Type and Leverage */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 block font-sans">
                        Type
                      </label>
                      <Select value={orderType} onValueChange={setOrderType}>
                        <SelectTrigger className="h-8 sm:h-7 text-[11px] sm:text-xs font-sans">
                          <SelectValue placeholder="Order Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="limit">Limit</SelectItem>
                          <SelectItem value="market">Market</SelectItem>
                          <SelectItem value="stop">Stop Loss</SelectItem>
                          <SelectItem value="stop-limit">Stop Limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 block font-sans">
                        Leverage
                      </label>
                      <Select value={leverage} onValueChange={setLeverage}>
                        <SelectTrigger className="h-8 sm:h-7 text-[11px] sm:text-xs font-sans">
                          <SelectValue placeholder="Leverage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1x">1x</SelectItem>
                          <SelectItem value="2x">2x</SelectItem>
                          <SelectItem value="5x">5x</SelectItem>
                          <SelectItem value="10x">10x</SelectItem>
                          <SelectItem value="25x">25x</SelectItem>
                          <SelectItem value="50x">50x</SelectItem>
                          <SelectItem value="100x">100x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price Input */}
                  {orderType !== 'market' && (
                    <div>
                      <label className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 block font-sans">
                        {orderType === 'stop' || orderType === 'stop-limit' ? 'Stop Price' : 'Price'}
                      </label>
                      <Input
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-8 sm:h-7 text-[11px] sm:text-xs font-sans"
                        type="number"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Stop Limit - Additional Limit Price */}
                  {orderType === 'stop-limit' && (
                    <div>
                      <label className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 block font-sans">
                        Limit Price
                      </label>
                      <Input
                        placeholder="0.00"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="h-8 sm:h-7 text-[11px] sm:text-xs font-sans"
                        type="number"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Amount Input */}
                  <div>
                    <label className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 block font-sans">
                      Amount ({selectedAsset.split('-')[0]})
                    </label>
                    <Input
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-8 sm:h-7 text-[11px] sm:text-xs font-sans"
                      type="number"
                      step="0.0001"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {['25%', '50%', '75%', 'Max'].map((percent) => (
                      <Button
                        key={percent}
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-6 text-[8px] sm:text-[9px] font-sans hover:bg-primary/10 touch-manipulation"
                        onClick={() => {
                          // Mock calculation - in real app would calculate based on balance
                          const mockBalance = 1000
                          const percentage = percent === 'Max' ? 1 : parseInt(percent) / 100
                          setAmount((mockBalance * percentage).toFixed(4))
                        }}
                      >
                        {percent}
                      </Button>
                    ))}
                  </div>

                  {/* Order Summary */}
                  {amount && (price || orderType === 'market') && (
                    <div className="bg-muted/30 rounded-md p-1.5 space-y-0.5">
                      <div className="flex justify-between text-[9px] font-sans">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">
                          ${orderType === 'market' ? (parseFloat(amount) * 3500).toFixed(2) : (parseFloat(amount) * parseFloat(price || '0')).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-sans">
                        <span className="text-muted-foreground">Margin:</span>
                        <span className="font-medium">
                          ${((parseFloat(amount) * (parseFloat(price) || 3500)) / parseInt(leverage)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <Button
                    className={`w-full h-9 sm:h-8 text-xs sm:text-sm font-sans font-medium transition-all shadow-md touch-manipulation ${side === 'buy'
                      ? 'bg-green-500 hover:bg-green-600 hover:shadow-lg'
                      : 'bg-red-500 hover:bg-red-600 hover:shadow-lg'
                      }`}
                    onClick={() => {
                      // Mock order placement
                      console.log('Order placed:', {
                        side,
                        orderType,
                        price,
                        limitPrice: orderType === 'stop-limit' ? limitPrice : undefined,
                        amount,
                        leverage,
                        asset: selectedAsset
                      })
                      // Reset form
                      setPrice('')
                      setAmount('')
                      setLimitPrice('')
                    }}
                    disabled={!amount || (orderType !== 'market' && !price)}
                  >
                    {side === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.split('-')[0]}
                  </Button>
                </div>
              </CardContent>

              {/* Order Book / Trade Feed - Minimum Height */}
              <CardContent className="min-h-[250px] sm:min-h-[300px] flex-1 p-2 sm:p-3 pt-0 pb-0 flex flex-col min-h-0">
                <Tabs defaultValue="orderbook" className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-2 sm:mb-3">
                    <TabsTrigger value="orderbook" className="text-[10px] sm:text-xs font-sans py-1.5 sm:py-1">Order Book</TabsTrigger>
                    <TabsTrigger value="trades" className="text-[10px] sm:text-xs font-sans py-1.5 sm:py-1">Recent Trades</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orderbook" className="flex-1 min-h-0 mt-0">
                    <div className="h-full -mx-3">
                      <OrderBook selectedAsset={selectedAsset} />
                    </div>
                  </TabsContent>

                  <TabsContent value="trades" className="flex-1 min-h-0 mt-0">
                    <div className="h-full -mx-3">
                      <TradeFeed selectedAsset={selectedAsset} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <KeyRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSuccess={handleRenewalSuccess}
        isExpired={true}
      />
    </div>
    </WalletRequired>
  )
}
