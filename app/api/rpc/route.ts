import { NextResponse } from 'next/server'

// Target RPC endpoint (env preferred)
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.insectarium.memecore.net'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const upstream = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    })

    const text = await upstream.text()

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: 'RPC proxy error', details: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Only POST is allowed
export const GET = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
