import { Token } from '../types';

export class TokenMerger {
  merge(tokens: Token[]): Token[] {
    const grouped = this.groupByAddress(tokens);

    return Object.values(grouped).map(group => {
      if (group.length === 1) return group[0];

      group.sort((a, b) => b.liquidity_sol - a.liquidity_sol);
      const mostLiquid = group[0];

      return {
        token_address: mostLiquid.token_address,
        token_name: mostLiquid.token_name,
        token_ticker: mostLiquid.token_ticker,

        price_sol: this.calculateWeightedPrice(group),
        market_cap_sol: Math.max(...group.map(t => t.market_cap_sol)),
        volume_sol: group.reduce((s, t) => s + t.volume_sol, 0),
        liquidity_sol: group.reduce((s, t) => s + t.liquidity_sol, 0),
        transaction_count: group.reduce((s, t) => s + t.transaction_count, 0),

        price_1hr_change: mostLiquid.price_1hr_change,
        protocol: this.mergeProtocols(group),
        sources: this.mergeSources(group),
        last_updated: this.getMostRecent(group),
        metadata: mostLiquid.metadata,
      };
    });
  }

  private groupByAddress(tokens: Token[]): Record<string, Token[]> {
    return tokens.reduce((acc, token) => {
      if (!token.token_address) return acc;

      const key = token.token_address.toLowerCase();
      (acc[key] ||= []).push(token);
      return acc;
    }, {} as Record<string, Token[]>);
  }

  private calculateWeightedPrice(tokens: Token[]): number {
    const totalLiquidity = tokens.reduce((s, t) => s + t.liquidity_sol, 0);
    if (totalLiquidity === 0) return tokens[0].price_sol;

    return tokens.reduce(
      (sum, t) => sum + (t.price_sol * t.liquidity_sol) / totalLiquidity,
      0
    );
  }

  private mergeProtocols(tokens: Token[]): string[] {
    const protocols = new Set<string>();
    tokens.forEach(t => {
      if (Array.isArray(t.protocol)) t.protocol.forEach(p => protocols.add(p));
      else protocols.add(t.protocol);
    });
    return Array.from(protocols).sort();
  }

  private mergeSources(tokens: Token[]): string[] {
    const sources = new Set<string>();
    tokens.forEach(t => {
      if (Array.isArray(t.sources)) {
        t.sources.forEach(s => sources.add(s));
      }
    });
    return Array.from(sources).sort();
  }

  private getMostRecent(tokens: Token[]): string {
    const latest = Math.max(
      ...tokens.map(t => new Date(t.last_updated).getTime())
    );
    return new Date(latest).toISOString();
  }
}

export default new TokenMerger();
