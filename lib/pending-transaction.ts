export type TransactionType = 'deposit' | 'fund' | 'withdraw'

export interface PendingTransaction {
  type: TransactionType
  amount: number
  previousBalance: number
  timestamp: number
}

export class PendingTransactionManager {
  private static readonly STORAGE_KEY = 'pending_transactions'
  private static readonly EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

  private static load(): Record<string, PendingTransaction> {
    if (typeof window === 'undefined') return {}
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  private static save(transactions: Record<string, PendingTransaction>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions))
  }

  static set(
    type: TransactionType,
    amount: number,
    previousBalance: number
  ): void {
    const transactions = this.load()

    transactions[type] = {
      type,
      amount,
      previousBalance,
      timestamp: Date.now(),
    }

    this.save(transactions)
  }

  static get(
    type: TransactionType,
    currentBalance: number
  ): PendingTransaction | null {
    const transactions = this.load()
    const pending = transactions[type]

    if (!pending) return null

    // Check if expired
    if (Date.now() - pending.timestamp > this.EXPIRY_MS) {
      this.clear(type)
      return null
    }

    // Check if already reflected
    const isReflected =
      type === 'withdraw'
        ? currentBalance < pending.previousBalance
        : currentBalance > pending.previousBalance

    if (isReflected) {
      this.clear(type)
      return null
    }

    return pending
  }

  static clear(type: TransactionType): void {
    const transactions = this.load()
    delete transactions[type]
    this.save(transactions)
  }
}
