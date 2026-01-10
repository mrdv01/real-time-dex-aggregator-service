import { useTokens } from '../context/TokenContext';
import { TokenCard } from './TokenCard';
import { Zap, Signal, Activity, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard = () => {
  const { tokens, isConnected, lastUpdate, filters, setFilters, loadMore, isLoading, hasMore } = useTokens();

  const displayTokens = tokens;

  // Filter change handlers
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans selection:bg-brand-purple/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-bg-dark/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-brand-purple to-brand-green rounded-lg shadow-lg shadow-brand-purple/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Real-Time-DEX <span className="text-gray-500 font-mono text-sm ml-1">/ DISCOVER</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
               <Activity className="w-3 h-3 text-brand-purple" />
               <span>TPS: {Math.floor(3000 + Math.random() * 1000)}</span>
             </div>
             
             <div className="flex items-center gap-2">
               <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-brand-green' : 'bg-brand-red'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-brand-green' : 'bg-brand-red'}`}></span>
                </span>
                <span className="text-sm font-medium text-gray-300">
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
             </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
           <div>
             <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
               Market Pulse
             </h2>
             <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
                Real-time feed of the hottest Solana token pools.
                <span className="block mt-1 text-xs font-mono text-gray-600 flex items-center gap-1">
                   <RefreshCw className="w-3 h-3" /> Updated: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
             </p>
           </div>

           {/* Filter Controls */}
           <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <select 
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="appearance-none bg-bg-card border border-white/10 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-brand-purple focus:border-brand-purple outline-none cursor-pointer hover:border-white/20 transition-colors"
                >
                  <option value="24h">24 Hours</option>
                  <option value="1h">1 Hour</option>
                  <option value="7d">7 Days</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="appearance-none bg-bg-card border border-white/10 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-brand-purple focus:border-brand-purple outline-none cursor-pointer hover:border-white/20 transition-colors"
                >
                  <option value="volume">Volume</option>
                  <option value="price_change">Price Change</option>
                  <option value="market_cap">Market Cap</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  value={filters.order}
                  onChange={(e) => handleFilterChange('order', e.target.value)}
                  className="appearance-none bg-bg-card border border-white/10 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-brand-purple focus:border-brand-purple outline-none cursor-pointer hover:border-white/20 transition-colors"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
                 <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
           </div>
        </div>

        {/* Grid */}
        {tokens.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Signal className="w-12 h-12 mb-4 animate-pulse opacity-50 text-brand-purple" />
            <p>Scanning Solana Mainnet...</p>
          </div>
        ) : (
          <>
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode='popLayout'>
                {displayTokens.map((token, idx) => (
                  <TokenCard key={token.token_address} token={token} index={idx} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load More Button */}
            {hasMore ? (
               <div className="mt-12 flex justify-center">
                  <button 
                    onClick={loadMore}
                    disabled={isLoading}
                    className="group px-8 py-3 bg-bg-card border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 hover:border-brand-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                      </>
                    ) : (
                      <>
                        Load More <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      </>
                    )}
                  </button>
               </div>
            ) : (
                <div className="mt-12 text-center text-gray-600 text-sm">
                   End of results
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
