import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
// import { SolanaPrograms } from "../target/types/solana_programs";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
} from "@solana/spl-token";
import * as spltoken from "@solana/spl-token";
import { AiverseAssets } from "../target/types/aiverse_assets";
import { keypairIdentity, Metaplex } from "@metaplex-foundation/js";
// import nacl from "tweetnacl";
import { decodeUTF8 } from "tweetnacl-util";

import { webcrypto } from "node:crypto";
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

describe("aiverse_assets", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    ""
  );

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AiverseAssets as Program<AiverseAssets>;

  const manager = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([])
  );
  let state: anchor.web3.PublicKey = null;

  const user = anchor.web3.Keypair.generate();
  const getStoryKey = async (id: anchor.BN) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("story-")),
        id.toBuffer("le", 8),
      ],
      program.programId
    )[0];
  };

  const getMintStateKey = async (id: anchor.BN) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("story-mint-")),
          id.toBuffer("le", 8),
        ],
        program.programId
      )
    )[0];
  };
  const getMetadataKey = async (
    mint: anchor.web3.PublicKey
  ): Promise<anchor.web3.PublicKey> => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  const getMasterEditionKey = async (
    mint: anchor.web3.PublicKey
  ): Promise<anchor.web3.PublicKey> => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  const minter = anchor.web3.Keypair.generate();

  const metaplex = Metaplex.make(anchor.getProvider().connection).use(
    keypairIdentity(minter)
  );

  it("Is initialized!", async () => {
    // Add your test here.
    await airdropSOL({
      provider: anchor.getProvider(),
      target: manager.publicKey,
      amount: anchor.web3.LAMPORTS_PER_SOL,
    });

    await airdropSOL({
      provider: anchor.getProvider(),
      target: user.publicKey,
      amount: anchor.web3.LAMPORTS_PER_SOL,
    });

    state = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode("state"))],
      program.programId
    )[0];

    let tx = await program.methods
      .initialize()
      .accounts({
        manager: manager.publicKey,
        state,
      })
      .signers([manager])
      .rpc();
    console.log("[INIT] transaction signature", tx);

    const mint = anchor.web3.Keypair.generate();
    const destination = await getAssociatedTokenAddress(
      mint.publicKey,
      user.publicKey
    );

    const name = "NAME";
    const symbol = "SYMBOL";
    const uri = "URI";
    const preCalculatedSig = Uint8Array.from([
      202, 86, 5, 201, 17, 232, 101, 150, 103, 217, 56, 33, 226, 166, 170, 139,
      36, 8, 20, 112, 13, 135, 31, 24, 28, 247, 151, 57, 193, 191, 177, 215, 12,
      69, 252, 117, 236, 24, 180, 240, 223, 196, 227, 12, 170, 201, 212, 231,
      90, 56, 13, 11, 216, 60, 100, 104, 41, 164, 178, 219, 126, 13, 203, 14,
    ]);
    const publicKey = manager.publicKey.toBytes();
    console.log("used public key", publicKey);
    const _msg = Buffer.from(name + symbol + uri, "utf-8");
    console.log("used message: ", name + symbol + uri);
    const tx2ix1 = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      publicKey: publicKey, // The public key associated with the instruction (as bytes)
      message: _msg, // The message to be included in the instruction (as a Buffer)
      signature: preCalculatedSig, // The signature associated with the instruction (as a Buffer)
      // instructionIndex: 0
    });

    const tx2ix2 = await program.methods
      .mintNft(name, symbol, uri, toNumArr(preCalculatedSig))
      .accounts({
        state: state,

        payer: user.publicKey,

        mint: mint.publicKey,

        destination: destination,

        metadata: await getMetadataKey(mint.publicKey),

        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,

        masterEdition: await getMasterEditionKey(mint.publicKey),

        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([user, mint])
      .instruction();
    // .catch(console.error);

    let tx2 = new anchor.web3.Transaction().add(tx2ix1, tx2ix2);

    const tx2hash = await anchor.web3.sendAndConfirmTransaction(
      anchor.getProvider().connection,
      tx2,
      [user, mint]
    );

    console.log("[MINT] transaction signature", tx2hash);


    // const userNftTokenAccount = await getOrCreateAssociatedTokenAccount(
    //   anchor.getProvider().connection,
    //   user,
    //   mint.publicKey,
    //   user.publicKey
    // );
    // assert.equal(userNftTokenAccount.amount.toString(), "1");

    // const nftData = await metaplex.nfts().findByMint({
    //   mintAddress: mint.publicKey,
    // });
    // assert.equal(nftData.name, "NAME");
    // assert.equal(nftData.symbol, "SYMBOL");
    // // console.log("[NFT-DATA] ", nftData.);
  });

  it("Verify Signature", async () => {
    // const ed = await import("@noble/ed25519");
    // console.log(ed);
    // // const pair = nacl.sign.keyPair();
    // // const signature = nacl.sign(decodeUTF8(MSG), pair.secretKey);
    // const pair = anchor.web3.Keypair.generate();
    // const signature = ed.sign(decodeUTF8(MSG), pair.secretKey);

    // const publickey = pair.publicKey;

    // console.log(signature.length, signature);
    const publicKey = Uint8Array.from([
      214, 43, 37, 17, 69, 39, 128, 172, 158, 65, 76, 102, 125, 97, 238, 174,
      224, 2, 60, 3, 253, 15, 135, 183, 165, 228, 1, 79, 225, 155, 29, 231,
    ]);
    const MSG = "NAMESYMBOLURI";
    const _msg = Buffer.from(MSG, "utf-8");
    const signature = Uint8Array.from([
      202, 86, 5, 201, 17, 232, 101, 150, 103, 217, 56, 33, 226, 166, 170, 139,
      36, 8, 20, 112, 13, 135, 31, 24, 28, 247, 151, 57, 193, 191, 177, 215, 12,
      69, 252, 117, 236, 24, 180, 240, 223, 196, 227, 12, 170, 201, 212, 231,
      90, 56, 13, 11, 216, 60, 100, 104, 41, 164, 178, 219, 126, 13, 203, 14,
    ]);
    const tx3ix1 = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      publicKey: publicKey, // The public key associated with the instruction (as bytes)
      message: _msg, // The message to be included in the instruction (as a Buffer)
      signature: signature, // The signature associated with the instruction (as a Buffer)
      // instructionIndex: 0
    });

    const tx3ix2 = await program.methods
      .verifyEd25519(toNumArr(publicKey), _msg, toNumArr(signature))
      .accounts({
        sender: manager.publicKey,
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([manager])
      // .rpc()
      // .catch(console.error);
      .instruction();

    let tx3 = new anchor.web3.Transaction().add(tx3ix1, tx3ix2);

    const tx3hash = await anchor.web3.sendAndConfirmTransaction(
      anchor.getProvider().connection,
      tx3,
      [manager]
    );

    console.log("[VERIFY] transaction signature", tx3hash);
  });
});

//  Utils
async function airdropSOL(opts: {
  target: anchor.web3.PublicKey;
  amount: number;
  provider: anchor.Provider;
}) {
  const { target, amount, provider } = opts;
  console.log(`[SOL] airdrop ${shortPubkey(target)} with ${amount} lamports`);
  const signature = await provider.connection.requestAirdrop(target, amount);
  const { value } =
    await await provider.connection.getLatestBlockhashAndContext();
  await provider.connection.confirmTransaction({
    signature,
    ...value,
  });
  const balance = await provider.connection.getBalance(target);
  console.log(`[SOL] balance of ${shortPubkey(target)} is ${balance} lamports`);
  return amount;
}
function shortPubkey(pubkey: anchor.web3.PublicKey) {
  const full = `${pubkey}`;
  return "[" + full.slice(0, 6) + "..." + full.slice(full.length - 6) + "]";
}

async function createMintAndAirdrop(
  airdrops: { acc: anchor.web3.Keypair; amount: number }[],
  opts: {
    connection: anchor.web3.Connection;
    payer: anchor.web3.Keypair;
  }
) {
  const { connection, payer } = opts;
  const mintAddr = await spltoken.createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    9,
    undefined,
    undefined,
    spltoken.TOKEN_PROGRAM_ID
  );
  console.log(`SPLToken: createMint ${mintAddr}`);

  for (const { acc, amount } of airdrops) {
    const tokenAccount = await spltoken.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintAddr,
      acc.publicKey
    );
    // anchor.web3.Keypair.fromSecretKey
    // anchor.utils.bytes.bs58.decode
    console.log(
      `SPLToken: token-account(${mintAddr}, ${acc.publicKey}) => ${tokenAccount}`
    );
    await spltoken.mintTo(
      connection,
      payer,
      mintAddr,
      tokenAccount.address,
      payer, // mint authority
      amount
    );
    console.log(`SPLToken: mintTo(${mintAddr}, ${acc.publicKey}) => ${amount}`);
    // const accountData = await spltoken.getAccount(connection, tokenAccount.address);
    const accountData = await spltoken.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintAddr,
      acc.publicKey
    );
    console.log(
      `SPLToken: token-amount(${mintAddr}, ${acc.publicKey}) => ${accountData.amount}`
    );
  }
  return mintAddr;
}

const toNumArr = (v: Uint8Array) => {
  const arr: number[] = [];
  for (const e of v) {
    arr.push(e);
  }
  return arr;
};
