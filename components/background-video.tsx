'use client'

export function BackgroundVideo() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute min-h-full min-w-full object-cover opacity-80"
            >
                <source src="/background_1.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/30" />
        </div>
    )
}
