'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { useAccount } from '@orderly.network/hooks';
import { ChainNamespace } from '@orderly.network/types';
import { BaseOrderlyKeyPair } from '@orderly.network/core';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import { authApi } from '@/lib/api';
import { authStorage, type StoredAuth } from '@/lib/auth-storage';

interface AuthContextType {
  auth: StoredAuth | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  hasOrderlyAccount: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ wallet }] = useConnectWallet();
  const [{ connectedChain }, setChain] = useSetChain();
  const { account, state } = useAccount();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const loginAttemptedRef = useRef(false);
  const loggedOutRef = useRef(false);
  const initializedRef = useRef(false);

  const address = wallet?.accounts?.[0]?.address;
  const isConnected = !!wallet;

  // Initialize auth from storage on mount
  useEffect(() => {
    if (!initializedRef.current && typeof window !== 'undefined') {
      initializedRef.current = true;
      const storedAuth = authStorage.getAuth();
      if (storedAuth) {
        setAuth(storedAuth);
      }
    }
  }, []);

  const login = useCallback(async () => {
    if (!address || !wallet) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);
    try {
      const checksumAddress = ethers.utils.getAddress(address);
      const { nonce } = await authApi.getNonce(checksumAddress);

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to MemePulse',
        uri: window.location.origin,
        version: '1',
        chainId: 42161,
        nonce,
      });

      const message = siweMessage.prepareMessage();

      const provider = new ethers.providers.Web3Provider(
        wallet.provider,
        'any'
      );
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      const { token: authToken, user: authUser } = await authApi.verify(
        checksumAddress,
        message,
        signature
      );

      authStorage.setAuth(authToken, authUser);
      setAuth({ token: authToken, user: authUser });
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, wallet]);

  const logout = useCallback(() => {
    console.log('Logging out...');
    loggedOutRef.current = true;
    authStorage.clear();
    setAuth(null);
    loginAttemptedRef.current = false;

    // Clear web3-onboard localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('onboard.js')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Also clear orderly registration status
      localStorage.removeItem('orderly_registered');
      localStorage.removeItem('orderly_key_expired');
    }

    window.location.href = '/';
  }, []);

  // Auto-switch to Arbitrum One when wallet connects
  useEffect(() => {
    const switchToArbitrum = async () => {
      if (!wallet || !isConnected) return;

      const ARBITRUM_ONE_CHAIN_ID = '0xa4b1';

      if (connectedChain?.id !== ARBITRUM_ONE_CHAIN_ID) {
        console.log('Switching to Arbitrum One...');
        try {
          await setChain({ chainId: ARBITRUM_ONE_CHAIN_ID });
          console.log('Switched to Arbitrum One');
        } catch (error) {
          console.error('Failed to switch to Arbitrum One:', error);
        }
      }
    };

    switchToArbitrum();
  }, [wallet, isConnected, connectedChain, setChain]);

  // Auto-login when wallet connects
  useEffect(() => {
    const isAuth = !!auth?.token && !!auth?.user;

    if (
      isConnected &&
      address &&
      !isAuth &&
      !isAuthenticating &&
      !loginAttemptedRef.current &&
      !loggedOutRef.current
    ) {
      loginAttemptedRef.current = true;
      login().catch((error) => {
        console.error('Auto-login failed:', error);
      });
    }
  }, [isConnected, address, auth, isAuthenticating, login]);

  // Reset login attempt when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      loginAttemptedRef.current = false;
    }
  }, [isConnected]);

  // Auto-connect wallet to Orderly when authenticated
  useEffect(() => {
    const connectOrderlyWallet = async () => {
      if (!wallet || !connectedChain || !address || !auth?.token) {
        return;
      }

      await account.setAddress(address, {
        chain: {
          id: connectedChain.id,
          namespace: ChainNamespace.evm,
        },
        provider: wallet.provider,
        wallet: {
          name: wallet.label,
        },
      });

      // Fetch user's Orderly keys from server
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const meResponse = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const meResult = await meResponse.json();
      if (meResult.success && meResult.data) {
        const userData = meResult.data;

        if (
          userData.orderlyAccountId &&
          userData.orderlySecretKey &&
          userData.orderlyPublicKey
        ) {
          const orderlyKeyPair = new BaseOrderlyKeyPair(
            userData.orderlySecretKey
          );

          account.keyStore.setKey(address, orderlyKeyPair);

          // Mark as registered in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('orderly_registered', 'true');
            localStorage.removeItem('orderly_key_expired');
            window.dispatchEvent(new Event('localStorageChange'));
          }
        }
      }
    };

    connectOrderlyWallet().catch((error) => {
      console.error('Failed to connect Orderly wallet:', error);
    });
  }, [wallet, connectedChain, address, account, auth]);

  const value: AuthContextType = {
    auth,
    isAuthenticated: !!auth?.token && !!auth?.user,
    isAuthenticating,
    hasOrderlyAccount: state?.status === 5,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
