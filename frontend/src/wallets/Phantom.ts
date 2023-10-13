import { WalletProvider } from '@/wallets/index';
import { getWalletSignInMessage } from '@/utils/utils';
import { loginBySolanaSignature } from '@/services/api';
import { BindTypes } from '@/components/BindStepsModal/BindStepsModal';
import {
  Account,
  clusterApiUrl,
  Connection,
  PublicKey,
  Signer,
  Transaction,
} from '@solana/web3.js';
import { encodeBase64 } from 'tweetnacl-util';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { TokenMetadataProgram } from '@metaplex-foundation/js';
import * as anchor from '@project-serum/anchor';
import { IDL, SolanaPrograms } from './types/solana-program';
import { prePublishSolanaNft } from '@/services/publish';
import * as nacl from 'tweetnacl';

const AIVERSE_PROGRAM = new PublicKey(
  'GrCtU8rnH6JpBfV3g7McW3sGMSWUQP9Qa6Vc574XmBqe',
);
const PURCHASE_WALLET_ADDRESS = new PublicKey(
  'AU8JGWcu3KMYsxosyLLA2rcnqzZXPToM7T1rUoCYMRDB',
);
const PURCHASE_ASSET_PROGRAM = new PublicKey(
  'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
  // 'GrNg1XM2ctzeE2mXxXCfhcTUbejM8Z4z4wNVTy2FjMEz',
);
const SOLANA_NETWORK = 'devnet';

export class PhantomProvider implements WalletProvider {
  onAccountChange?: (account: string) => void;
  onChainChange?: (chainId: string) => void;
  onDisconnect?: () => void;

  provider: any;
  connection: any;
  anchorProvider: any;

  pubKey: string = '';
  address: string = '';

  available() {
    return window.phantom?.solana?.isPhantom;
  }

  constructor(cb: {
    onAccountChange: (account: string) => void;
    onChainChange: (chain: string) => void;
    onDisconnect: () => void;
  }) {
    if (this.available()) {
      const { onAccountChange, onChainChange, onDisconnect } = cb;
      this.onAccountChange = onAccountChange;
      this.onChainChange = onChainChange;
      this.onDisconnect = onDisconnect;

      this.provider = window.phantom?.solana;
      this.provider.on('connect', async (publicKey: string) => {
        this.onAccountChange!(publicKey.toString());

        const wallet = window.solana;
        const network = clusterApiUrl(SOLANA_NETWORK);
        this.connection = new Connection(network, 'finalized');
        this.anchorProvider = new anchor.AnchorProvider(
          this.connection,
          wallet,
          {
            preflightCommitment: 'finalized',
          },
        );
      });
      this.provider.on('disconnect', () => {
        onDisconnect?.();
      });
      this.provider.on('accountChanged', (publicKey: any) => {
        // if (publicKey) {
        //   this.pubKey = publicKey.toBytes().toString();
        //   this.address = publicKey.toString();
        //   this.onAccountChange!(this.address);
        // } else {
        //   this.connect();
        // }
      });
    }
  }

  async connect() {
    if (!this.available()) {
      const site = BindTypes.find((b) => b.chainName === 'Solana')?.site;
      if (!!site) {
        window.open(site, '_blank', 'noreferrer,noopener');
      }
      return;
    }

    try {
      const resp = await this.provider.connect();
      const address = resp.publicKey.toString();
      this.pubKey = resp.publicKey.toBytes().toString();
      this.address = address;
      this.onAccountChange!(address);
    } catch (error) {}
  }

  disconnect(): void {
    this.onDisconnect?.();
  }

  async tryAutoConnect() {}

  getWeb3() {
    return undefined;
  }

  async signMessage(_message: string) {
    if (!this.provider) throw new Error('Provider Unavailable');

    const encodedMessage = new TextEncoder().encode(_message);
    const { signature } = await this.provider.signMessage(
      encodedMessage,
      'utf8',
    );
    console.log('signature', signature);
    return encodeBase64(signature);
  }

  setupPointContract(address: {
    ethPurchaseContractAddress: string;
    neoPurchaseWalletAddress: string;
  }) {
    // this.neoPurchaseWalletAddress = address.neoPurchaseWalletAddress;
  }

  setupEnumerableNftContract(nft: string) {}

  async listNfts(nft: string, account?: string) {
    return [];
  }
  async listNftsMock(nft: string) {
    return [];
  }
  async getNftInfoByTokenId(nft: string, tokenId: number) {}

  getMetadataKey(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TokenMetadataProgram.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      TokenMetadataProgram.publicKey,
    )[0];
  }

  getMasterEditionKey(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TokenMetadataProgram.publicKey.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TokenMetadataProgram.publicKey,
    )[0];
  }

  toNumArr(v: Uint8Array) {
    const arr: number[] = [];
    for (const e of v) {
      arr.push(e);
    }
    return arr;
  }

  async getOrCreateAssociatedTokenAccount(
    connection: Connection,
    payer: Signer,
    mint: PublicKey,
    owner: PublicKey,
  ) {
    const associatedToken = await getAssociatedTokenAddress(mint, owner);
    let account: Account;
    try {
      account = await getAccount(connection, associatedToken, 'confirmed');
    } catch (e) {
      try {
        let recentBlockhash = (await connection.getLatestBlockhash('finalized'))
          .blockhash;
        const transaction = new Transaction({
          recentBlockhash,
          feePayer: payer.publicKey,
        }).add(
          createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedToken,
            owner,
            mint,
          ),
        );
        const { signature } = await this.provider.signAndSendTransaction(
          transaction,
        );
        const { value } = await connection.getLatestBlockhashAndContext();
        await connection.confirmTransaction({ signature, ...value });
      } catch (e) {}
      account = await getAccount(connection, associatedToken, 'confirmed');
    }
    return account;
  }

  async buyPoints(price: number) {
    if (
      !PURCHASE_WALLET_ADDRESS ||
      !this.address ||
      !this.provider ||
      !this.connection
    )
      throw new Error('');

    const fromWallet = await this.provider.connect();

    let sourceAccount = (await this.getOrCreateAssociatedTokenAccount(
      this.connection,
      fromWallet,
      PURCHASE_ASSET_PROGRAM,
      fromWallet.publicKey,
    )) as any;

    let destinationAccount = (await this.getOrCreateAssociatedTokenAccount(
      this.connection,
      fromWallet,
      PURCHASE_ASSET_PROGRAM,
      PURCHASE_WALLET_ADDRESS,
    )) as any;

    const transaction = new Transaction().add(
      createTransferInstruction(
        sourceAccount.address,
        destinationAccount.address,
        fromWallet.publicKey,
        price * Math.pow(10, 6),
      ),
    );

    const { blockhash } = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet.publicKey;
    const { signature } = await this.provider.signAndSendTransaction(
      transaction,
    );
    await this.connection.getSignatureStatus(signature);
  }

  async signIn() {
    if (!this.address) throw new Error('NeoLine Not Connected.');

    const message = getWalletSignInMessage();
    const signature = await this.signMessage(message);
    return await loginBySolanaSignature({
      signature: signature,
      message,
      pubkey: this.pubKey,
      account: this.address,
      wallet: 'Phantom',
    });
  }

  async aiverseMint(offLineId: string, publishType: 'model' | 'template') {
    if (!this.address) {
      await this.connect();
    }
    if (!this.address || !this.provider) throw new Error('');

    const { name, signature, symbol, uri } = await prePublishSolanaNft(
      offLineId,
      publishType,
    );

    const state = PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode('state'))],
      AIVERSE_PROGRAM,
    )[0];

    const program = new anchor.Program<SolanaPrograms>(
      IDL as any,
      AIVERSE_PROGRAM,
      this.anchorProvider,
    );

    const fromWallet = await this.provider.connect();

    const mint = anchor.web3.Keypair.generate();
    const destination = await getAssociatedTokenAddress(
      mint.publicKey,
      fromWallet.publicKey,
    );

    const signatureUint8 = Uint8Array.from(signature.split(',').map(Number));

    const tx2ix1 = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      publicKey: Uint8Array.from([
        103, 149, 58, 113, 68, 116, 23, 19, 204, 81, 187, 246, 251, 169, 46,
        241, 67, 3, 176, 176, 135, 142, 104, 82, 108, 253, 63, 118, 216, 177,
        244, 220,
      ]),
      message: Buffer.from(name + symbol + uri),
      signature: signatureUint8,
    });

    const tx2ix2 = await program.methods
      .mintNft(name, symbol, uri, this.toNumArr(signatureUint8))
      .accounts({
        state: state,
        payer: fromWallet.publicKey,
        mint: mint.publicKey,
        destination: destination,
        metadata: await this.getMetadataKey(mint.publicKey),
        tokenMetadataProgram: TokenMetadataProgram.publicKey,
        masterEdition: await this.getMasterEditionKey(mint.publicKey),
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([fromWallet, mint])
      .instruction();

    let transaction = new Transaction().add(tx2ix1, tx2ix2);

    const { blockhash } = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet.publicKey;

    const mintSig = await nacl.sign.detached(
      transaction.serializeMessage(),
      mint.secretKey,
    );
    transaction.addSignature(mint.publicKey, Buffer.from(mintSig));

    const { signature: sig } = await this.provider.signAndSendTransaction(
      transaction,
    );
    await this.connection.getSignatureStatus(sig);
    return sig;
  }
}
