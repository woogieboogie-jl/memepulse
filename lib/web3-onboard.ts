import injectedModule from '@web3-onboard/injected-wallets';
import { init } from '@web3-onboard/react';
import walletConnectModule from '@web3-onboard/walletconnect';

const injected = injectedModule();
const walletConnect = walletConnectModule({
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '4e8e1862e0bf5ba22e1f45a99a89a221',
  requiredChains: [42161], // Arbitrum One
  optionalChains: [421614], // Arbitrum Sepolia
});

export const web3Onboard = init({
  wallets: [injected, walletConnect],
  chains: [
    {
      id: '0xa4b1', // 42161 in hex
      token: 'ETH',
      label: 'Arbitrum One',
      rpcUrl: 'https://arb1.arbitrum.io/rpc'
    },
    {
      id: '0x66eee', // 421614 in hex
      token: 'ETH',
      label: 'Arbitrum Sepolia',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
    }
  ],
  appMetadata: {
    name: 'MemePulse',
    description: 'AI-Powered Memecoin Trading & Oracle Mining',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎮</text></svg>',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' },
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
    ]
  },
  accountCenter: {
    desktop: { enabled: false },
    mobile: { enabled: false }
  },
  connect: {
    autoConnectLastWallet: true,
  }
});
