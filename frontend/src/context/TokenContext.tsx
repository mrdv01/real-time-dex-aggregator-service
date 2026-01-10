import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Token, WebSocketEvent, FilterState, ApiResponse } from '../types';

interface TokenContextType {
  tokens: Token[];
  isConnected: boolean;
  lastUpdate: number;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  loadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (!context) throw new Error('useTokens must be used within a TokenProvider');
  return context;
};

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokensMap, setTokensMap] = useState<Map<string, Token>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // REST State
  const [filters, setFilters] = useState<FilterState>({
    period: '24h',
    sortBy: 'volume',
    order: 'desc'
  });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  // To avoid circular dep between filters change and fetching
  const filtersRef = useRef(filters);

  // Fetch from REST
  const fetchTokens = async (append = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { period, sortBy, order } = filtersRef.current;
      let url = `http://localhost:3000/api/tokens?limit=30&period=${period}&sortBy=${sortBy}&order=${order}`;
      
      if (append && nextCursor) {
        url += `&cursor=${nextCursor}`;
      }

      const res = await fetch(url);
      const data: ApiResponse = await res.json();

      if (data.success && data.data) {
        setTokensMap(prev => {
          const next = append ? new Map(prev) : new Map();
          data.data.forEach(t => next.set(t.token_address, t));
          return next;
        });

        if (data.pagination) {
          setNextCursor(data.pagination.nextCursor || null);
          setHasMore(data.pagination.hasMore);
        } else {
            setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // On Filters Change
  useEffect(() => {
     // Skip first run? No, we need data.
     filtersRef.current = filters;
     setNextCursor(null);
     fetchTokens(false);
  }, [filters]);

  useEffect(() => {
    // Initialize Socket
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      // Wait for REST to load first usually, unless we want instant snapshot
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle Snapshot - ONLY if we haven't loaded data or explicit resync?
    // User logic: "Handle tokens:snapshot" but "Let REST handle first load"
    socket.on('tokens:snapshot', (payload: { tokens: Token[] }) => {
        setTokensMap(prev => {
             if (prev.size === 0) {
                 const newMap = new Map();
                 payload.tokens.forEach(t => newMap.set(t.token_address, t));
                 return newMap;
             }
             return prev; 
        });
        setLastUpdate(Date.now());
    });

    // Handle Updates (Delta)
    socket.on('token:update', (event: WebSocketEvent) => {
      const token = event.data || (event as any).token;
      if (!token) return;

      setTokensMap(prev => {
        if (prev.has(token.token_address)) {
             const next = new Map(prev);
             const updatedToken = { 
                 ...token, 
                 lastTransition: event.metadata?.direction 
             };
             next.set(token.token_address, updatedToken);
             return next;
        }
        return prev;
      });
      setLastUpdate(Date.now());
    });

    // Handle Discovery (New Token) - Always add to top
    socket.on('token:new', (event: WebSocketEvent) => {
      const token = event.data || (event as any).token;
      if (!token) return;

      setTokensMap(prev => {
        const next = new Map();
        next.set(token.token_address, token);
        prev.forEach((val, key) => {
            if (key !== token.token_address) {
                next.set(key, val);
            }
        });
        return next;
      });
      setLastUpdate(Date.now());
    });
    
    socket.on('token:volume_spike', (event: WebSocketEvent) => {
        const token = event.data || (event as any).token;
        if (!token) return;
        setTokensMap(prev => {
           if (prev.has(token.token_address)) {
                const next = new Map(prev);
                next.set(token.token_address, token);
                return next;
           }
           const next = new Map(prev);
           next.set(token.token_address, token);
           return next;
        });
        setLastUpdate(Date.now());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadMore = () => {
      if (nextCursor && !isLoading) {
          fetchTokens(true);
      }
  };

  const tokenArray = Array.from(tokensMap.values());

  return (
    <TokenContext.Provider value={{ 
        tokens: tokenArray, 
        isConnected, 
        lastUpdate, 
        filters, 
        setFilters,
        loadMore,
        isLoading,
        hasMore 
    }}>
      {children}
    </TokenContext.Provider>
  );
};
