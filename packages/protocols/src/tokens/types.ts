export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
  name: string;
  logoURI?: string;
}

export interface TokenAmount {
  token: Token;
  amount: string;
  formatted: string;
}

export interface TokenPair {
  token0: Token;
  token1: Token;
  pairAddress: string;
  chainId: number;
}

export interface TokenPrice {
  token: Token;
  price: string;
  timestamp: number;
  source: string;
} 