'use client'

import dynamic from 'next/dynamic'

// Load BackgroundVideo only on client-side to avoid hydration mismatch
const BackgroundVideo = dynamic(
    () => import('@/components/background-video').then(mod => ({ default: mod.BackgroundVideo })),
    { ssr: false }
)

export function ClientBackgroundVideo() {
    return <BackgroundVideo />
}
