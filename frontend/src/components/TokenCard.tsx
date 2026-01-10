
import { motion, useAnimation } from 'framer-motion';
import {ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Droplets, Wallet, Layers } from 'lucide-react'; 
import { useEffect } from 'react';
import type { Token } from '../types';
import { formatPrice, formatNumber, cn } from '../utils/format';

interface TokenCardProps {
  token: Token;
  index: number;
}

export const TokenCard = ({ token, index }: TokenCardProps) => {
  const isPriceUp = (token.price_1hr_change || 0) >= 0;
  const change = Math.abs(token.price_1hr_change || 0);
  const controls = useAnimation();
  
  useEffect(() => {
    // Entry animation
    controls.start({ opacity: 1, y: 0, scale: 1 });
  }, []);

  useEffect(() => {
    if (token.lastTransition) {
      const color = token.lastTransition === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      const borderColor = token.lastTransition === 'up' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      
      controls.start({
        backgroundColor: [color, 'rgba(10, 10, 10, 1)'],
        borderColor: [borderColor, 'rgba(255, 255, 255, 0.05)'],
        transition: { duration: 0.6 }
      });
    }
  }, [token.last_updated, token.lastTransition, controls]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={controls} 
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05 }} 
      style={{ backgroundColor: 'rgba(10, 10, 10, 1)' }}
      className="group relative overflow-hidden rounded-xl border border-white/5 p-5 hover:border-brand-purple/30 hover:shadow-lg hover:shadow-brand-purple/5 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {token.token_name}
            <span className="text-xs font-normal text-gray-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {token.token_ticker}
            </span>
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-mono font-bold text-white">
              ${formatPrice(token.price_sol)}
            </span>
            <span className={cn(
              "flex items-center text-sm font-medium px-2 py-0.5 rounded-md",
              isPriceUp ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"
            )}>
              {isPriceUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-purple/10 transition-colors">
          <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-brand-purple" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Vol 24h
          </span>
          <span className="text-sm font-medium text-gray-300">
            ${formatNumber(token.volume_sol)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Droplets className="w-3 h-3" /> Liq
          </span>
          <span className="text-sm font-medium text-gray-300">
            ${formatNumber(token.liquidity_sol)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> MCap
          </span>
          <span className="text-sm font-medium text-gray-300">
            ${formatNumber(token.market_cap_sol)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Txns
          </span>
          <span className="text-sm font-medium text-gray-300">
            {formatNumber(token.transaction_count)}
          </span>
        </div>
      </div>
      
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-purple/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
};
