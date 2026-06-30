const ETF_SYMBOLS = new Set(["SPY", "QQQ", "IWM", "DIA", "VOO", "GLD", "SLV", "ARKK"]);

export function toTradingViewSymbol(symbol: string, exchangeName?: string): string {
  const sym = symbol.toUpperCase();
  if (ETF_SYMBOLS.has(sym)) return `AMEX:${sym}`;
  const code = exchangeName ?? "";
  if (code === "NYQ" || code === "NYS") return `NYSE:${sym}`;
  if (code === "ASE" || code === "PCX") return `AMEX:${sym}`;
  return `NASDAQ:${sym}`;
}
