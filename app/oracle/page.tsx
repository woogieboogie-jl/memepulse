```
import { NavHeader } from '@/components/nav-header'
import { OracleFeed } from '@/components/oracle-feed'

export default function OraclePage() {
    return (
        <div className="min-h-screen bg-background/80 backdrop-blur-sm">
            <NavHeader />
            <main className="container mx-auto px-4 py-6">
                <OracleFeed />
            </main>
        </div>
    )
}
```
