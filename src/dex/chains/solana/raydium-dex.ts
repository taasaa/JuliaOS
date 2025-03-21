import { 
  Token, 
  TokenAmount,
  Liquidity,
  LiquidityPoolKeys,
  LiquidityPoolKeysV4,
  Currency,
  LiquiditySide,
  LiquidityUserKeys
} from '@raydium-io/raydium-sdk';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import BN from 'bn.js';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const DUMMY_PUBKEY = new PublicKey('11111111111111111111111111111111');

export class RaydiumDex {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async calculatePrice(baseReserve: bigint, quoteReserve: bigint): Promise<number> {
    const baseToken = new Token(TOKEN_PROGRAM_ID, DUMMY_PUBKEY, 9);
    const quoteToken = new Token(TOKEN_PROGRAM_ID, DUMMY_PUBKEY, 6);
    const baseAmount = new TokenAmount(baseToken, new BN(baseReserve.toString()));
    const quoteAmount = new TokenAmount(quoteToken, new BN(quoteReserve.toString()));
    return Number(baseAmount.toFixed()) / Number(quoteAmount.toFixed());
  }

  async swap(
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey,
    amountIn: bigint,
    minAmountOut: bigint
  ): Promise<Transaction> {
    const tokenInInfo = new Token(TOKEN_PROGRAM_ID, tokenInMint, 9);
    const tokenOutInfo = new Token(TOKEN_PROGRAM_ID, tokenOutMint, 6);

    const amountInValue = new TokenAmount(tokenInInfo, new BN(amountIn.toString()));
    const minAmountOutValue = new TokenAmount(tokenOutInfo, new BN(minAmountOut.toString()));

    const poolKeys: LiquidityPoolKeysV4 = {
      id: DUMMY_PUBKEY,
      baseMint: tokenInMint,
      quoteMint: tokenOutMint,
      lpMint: DUMMY_PUBKEY,
      baseDecimals: 9,
      quoteDecimals: 6,
      lpDecimals: 9,
      version: 4,
      programId: DUMMY_PUBKEY,
      authority: DUMMY_PUBKEY,
      openOrders: DUMMY_PUBKEY,
      targetOrders: DUMMY_PUBKEY,
      baseVault: DUMMY_PUBKEY,
      quoteVault: DUMMY_PUBKEY,
      withdrawQueue: DUMMY_PUBKEY,
      lpVault: DUMMY_PUBKEY,
      marketVersion: 3,
      marketProgramId: DUMMY_PUBKEY,
      marketId: DUMMY_PUBKEY,
      marketAuthority: DUMMY_PUBKEY,
      marketBaseVault: DUMMY_PUBKEY,
      marketQuoteVault: DUMMY_PUBKEY,
      marketBids: DUMMY_PUBKEY,
      marketAsks: DUMMY_PUBKEY,
      marketEventQueue: DUMMY_PUBKEY,
      lookupTableAccount: DUMMY_PUBKEY
    };

    const userKeys = {
      tokenAccountIn: DUMMY_PUBKEY,
      tokenAccountOut: DUMMY_PUBKEY,
      owner: DUMMY_PUBKEY
    };

    const swapInstruction = await Liquidity.makeSwapInstruction({
      poolKeys,
      userKeys,
      amountIn: amountInValue.raw,
      amountOut: minAmountOutValue.raw,
      fixedSide: 'in'
    });

    const transaction = new Transaction();
    for (const ix of swapInstruction.innerTransaction.instructions) {
      transaction.add(ix);
    }
    return transaction;
  }

  async addLiquidity(
    tokenMint: PublicKey,
    amount: bigint
  ): Promise<Transaction> {
    const tokenInfo = new Token(TOKEN_PROGRAM_ID, tokenMint, 9);
    const amountValue = new TokenAmount(tokenInfo, new BN(amount.toString()));

    const poolKeys: LiquidityPoolKeysV4 = {
      id: DUMMY_PUBKEY,
      baseMint: tokenMint,
      quoteMint: DUMMY_PUBKEY,
      lpMint: DUMMY_PUBKEY,
      baseDecimals: 9,
      quoteDecimals: 6,
      lpDecimals: 9,
      version: 4,
      programId: DUMMY_PUBKEY,
      authority: DUMMY_PUBKEY,
      openOrders: DUMMY_PUBKEY,
      targetOrders: DUMMY_PUBKEY,
      baseVault: DUMMY_PUBKEY,
      quoteVault: DUMMY_PUBKEY,
      withdrawQueue: DUMMY_PUBKEY,
      lpVault: DUMMY_PUBKEY,
      marketVersion: 3,
      marketProgramId: DUMMY_PUBKEY,
      marketId: DUMMY_PUBKEY,
      marketAuthority: DUMMY_PUBKEY,
      marketBaseVault: DUMMY_PUBKEY,
      marketQuoteVault: DUMMY_PUBKEY,
      marketBids: DUMMY_PUBKEY,
      marketAsks: DUMMY_PUBKEY,
      marketEventQueue: DUMMY_PUBKEY,
      lookupTableAccount: DUMMY_PUBKEY
    };

    const userKeys: LiquidityUserKeys = {
      baseTokenAccount: DUMMY_PUBKEY,
      quoteTokenAccount: DUMMY_PUBKEY,
      lpTokenAccount: DUMMY_PUBKEY,
      owner: DUMMY_PUBKEY
    };

    const addLiquidityInstruction = await Liquidity.makeAddLiquidityInstruction({
      poolKeys,
      userKeys,
      baseAmountIn: amountValue.raw,
      quoteAmountIn: new BN(0),
      fixedSide: 'base'
    });

    const transaction = new Transaction();
    for (const ix of addLiquidityInstruction.innerTransaction.instructions) {
      transaction.add(ix);
    }
    return transaction;
  }

  async removeLiquidity(
    tokenMint: PublicKey,
    amount: bigint
  ): Promise<Transaction> {
    const tokenInfo = new Token(TOKEN_PROGRAM_ID, tokenMint, 9);
    const amountValue = new TokenAmount(tokenInfo, new BN(amount.toString()));

    const poolKeys: LiquidityPoolKeysV4 = {
      id: DUMMY_PUBKEY,
      baseMint: tokenMint,
      quoteMint: DUMMY_PUBKEY,
      lpMint: DUMMY_PUBKEY,
      baseDecimals: 9,
      quoteDecimals: 6,
      lpDecimals: 9,
      version: 4,
      programId: DUMMY_PUBKEY,
      authority: DUMMY_PUBKEY,
      openOrders: DUMMY_PUBKEY,
      targetOrders: DUMMY_PUBKEY,
      baseVault: DUMMY_PUBKEY,
      quoteVault: DUMMY_PUBKEY,
      withdrawQueue: DUMMY_PUBKEY,
      lpVault: DUMMY_PUBKEY,
      marketVersion: 3,
      marketProgramId: DUMMY_PUBKEY,
      marketId: DUMMY_PUBKEY,
      marketAuthority: DUMMY_PUBKEY,
      marketBaseVault: DUMMY_PUBKEY,
      marketQuoteVault: DUMMY_PUBKEY,
      marketBids: DUMMY_PUBKEY,
      marketAsks: DUMMY_PUBKEY,
      marketEventQueue: DUMMY_PUBKEY,
      lookupTableAccount: DUMMY_PUBKEY
    };

    const userKeys: LiquidityUserKeys = {
      baseTokenAccount: DUMMY_PUBKEY,
      quoteTokenAccount: DUMMY_PUBKEY,
      lpTokenAccount: DUMMY_PUBKEY,
      owner: DUMMY_PUBKEY
    };

    const removeLiquidityInstruction = await Liquidity.makeRemoveLiquidityInstruction({
      poolKeys,
      userKeys,
      amountIn: amountValue.raw
    });

    const transaction = new Transaction();
    for (const ix of removeLiquidityInstruction.innerTransaction.instructions) {
      transaction.add(ix);
    }
    return transaction;
  }
} 