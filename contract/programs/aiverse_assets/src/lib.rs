use anchor_lang::solana_program::ed25519_program::ID as ED25519_ID;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_lang::solana_program::sysvar::instructions::{load_instruction_at_checked, ID as IX_ID};
use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::*,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::instructions::{CreateMasterEditionV3, CreateMetadataAccountV3};

declare_id!("GrCtU8rnH6JpBfV3g7McW3sGMSWUQP9Qa6Vc574XmBqe");

#[program]
pub mod aiverse_assets {

    use anchor_lang::solana_program::{
        ed25519_program, entrypoint::ProgramResult, instruction::Instruction, program::invoke,
    };
    use mpl_token_metadata::{
        instructions::{
            CreateMasterEditionV3InstructionArgs, CreateMetadataAccountV3InstructionArgs,
        },
        types::{Creator, DataV2},
    };

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.state.manager = ctx.accounts.manager.key();

        Ok(())
    }

    // pub fn mint_nft_no_verify(
    //     ctx: Context<MintNFTNoVerify>,
    //     name: String,
    //     symbol: String,
    //     uri: String,
    // ) -> Result<()> {
    //     // 2. 铸造NFT
    //     msg!("Initializing Mint Ticket");
    //     let cpi_accounts = MintTo {
    //         mint: ctx.accounts.mint.to_account_info(),
    //         to: ctx.accounts.destination.to_account_info(),
    //         authority: ctx.accounts.payer.to_account_info(),
    //         // authority: ctx.accounts.mint.to_account_info(),
    //     };
    //     msg!("CPI Accounts Assigned");
    //     let cpi_program = ctx.accounts.token_program.to_account_info();

    //     msg!("CPI Program Assigned");
    //     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    //     msg!("CPI Context Assigned");
    //     mint_to(cpi_ctx, 1)?;
    //     msg!("Token Minted !!!");

    //     let create_metadat_account_v3 = CreateMetadataAccountV3 {
    //         metadata: ctx.accounts.metadata.key(),
    //         mint: ctx.accounts.mint.key(),
    //         mint_authority: ctx.accounts.payer.key(),
    //         payer: ctx.accounts.payer.key(),
    //         update_authority: (ctx.accounts.payer.key(), true),
    //         system_program: ctx.accounts.system_program.key(),
    //         rent: None,
    //     };

    //     let create_metadat_account_v3_instruction =
    //         create_metadat_account_v3.instruction(CreateMetadataAccountV3InstructionArgs {
    //             data: DataV2 {
    //                 name: name,
    //                 symbol: symbol,
    //                 uri: uri,
    //                 seller_fee_basis_points: 1,
    //                 creators: Some(vec![
    //                     Creator {
    //                         address: id(),
    //                         verified: false,
    //                         share: 0,
    //                     },
    //                     Creator {
    //                         address: ctx.accounts.payer.key(),
    //                         verified: true,
    //                         share: 100,
    //                     },
    //                 ]),
    //                 collection: None,
    //                 uses: None,
    //             },
    //             is_mutable: false,
    //             collection_details: None,
    //         });

    //     let create_metadata_account_v3_account_infos = vec![
    //         ctx.accounts.metadata.to_account_info(),
    //         ctx.accounts.mint.to_account_info(),
    //         ctx.accounts.payer.to_account_info(), // ctx.accounts.mint_authority.to_account_info(),
    //         ctx.accounts.payer.to_account_info(),
    //         ctx.accounts.token_metadata_program.to_account_info(),
    //         ctx.accounts.token_program.to_account_info(),
    //         ctx.accounts.system_program.to_account_info(),
    //         ctx.accounts.rent.to_account_info(),
    //     ];

    //     invoke(
    //         &create_metadat_account_v3_instruction,
    //         &create_metadata_account_v3_account_infos,
    //     )?;
    //     msg!("Metadata Account Created ");

    //     let create_master_edition_v3 = CreateMasterEditionV3 {
    //         edition: ctx.accounts.master_edition.key(),
    //         mint: ctx.accounts.mint.key(),
    //         update_authority: ctx.accounts.payer.key(),
    //         mint_authority: ctx.accounts.payer.key(),
    //         metadata: ctx.accounts.metadata.key(),
    //         payer: ctx.accounts.payer.key(),
    //         token_program: ctx.accounts.token_program.key(),
    //         system_program: ctx.accounts.system_program.key(),
    //         rent: ctx.accounts.rent.key().into(),
    //     };

    //     let create_master_edition_v3_instruction =
    //         create_master_edition_v3.instruction(CreateMasterEditionV3InstructionArgs {
    //             max_supply: Some(0),
    //         });
    //     let create_master_edition_v3_account_infos = vec![
    //         ctx.accounts.master_edition.to_account_info(),
    //         ctx.accounts.mint.to_account_info(),
    //         ctx.accounts.payer.to_account_info(), // minter
    //         ctx.accounts.payer.to_account_info(), // payer
    //         ctx.accounts.metadata.to_account_info(),
    //         ctx.accounts.token_metadata_program.to_account_info(),
    //         ctx.accounts.token_program.to_account_info(),
    //         ctx.accounts.system_program.to_account_info(),
    //         ctx.accounts.rent.to_account_info(),
    //     ];
    //     invoke(
    //         &create_master_edition_v3_instruction,
    //         &create_master_edition_v3_account_infos,
    //     )?;
    //     msg!("Master Edition Nft Minted");

    //     emit!(NftMinted {
    //         mint: ctx.accounts.mint.key(),
    //     });

    //     Ok(())
    // }

    // pub fn update_manager(ctx: Context<UpdateManager>, manager: Pubkey) -> Result<()> {
    //     ctx.accounts.state.manager = manager;
    //     Ok(())
    // }

    pub fn get_consts(ctx: Context<GetConsts>) -> Result<Pubkey> {
        Ok(ctx.accounts.state.manager)
    }

    //
    pub fn mint_nft(
        ctx: Context<MintNFT>,
        // params: InitTokenParams,
        name: String,
        symbol: String,
        uri: String,
        sig: [u8; 64],
    ) -> Result<()> {
        // 1. 校验签名, url 由 manager 签名 得到 sig
        // ctx.accounts.state.manager;
        let msg = format!("{}{}{}", name, symbol, uri);
        let _msg = msg.as_bytes().to_vec();
        let pubkey = ctx.accounts.state.manager.to_bytes();

        msg!("Verification Signature");
        msg!(&format!("pubkey: {:?}", pubkey));
        msg!(&format!("sig-msg: {}", msg));
        msg!(&format!("sig-msg_bytes: {:?}", _msg));
        // Get what should be the Ed25519Program instruction
        let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;

        // Check that ix is what we expect to have been sent
        utils::verify_ed25519_ix(&ix, &pubkey, &_msg, &sig)?;

        // 2. 铸造NFT
        msg!("Initializing Mint Ticket");
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
            // authority: ctx.accounts.mint.to_account_info(),
        };
        msg!("CPI Accounts Assigned");
        let cpi_program = ctx.accounts.token_program.to_account_info();

        msg!("CPI Program Assigned");
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        msg!("CPI Context Assigned");
        mint_to(cpi_ctx, 1)?;
        msg!("Token Minted !!!");

        // let account_info = vec![
        //     ctx.accounts.metadata.to_account_info(),
        //     ctx.accounts.mint.to_account_info(),
        //     ctx.accounts.mint_authority.to_account_info(),
        //     ctx.accounts.payer.to_account_info(),
        //     ctx.accounts.token_metadata_program.to_account_info(),
        //     ctx.accounts.token_program.to_account_info(),
        //     ctx.accounts.system_program.to_account_info(),
        //     ctx.accounts.rent.to_account_info(),
        // ];
        // msg!("Account Info Assigned");
        // let creator = vec![
        //     mpl_token_metadata::state::Creator {
        //         address: creator_key,
        //         verified: false,
        //         share: 100,
        //     },
        //     mpl_token_metadata::state::Creator {
        //         address: ctx.accounts.mint_authority.key(),
        //         verified: false,
        //         share: 0,
        //     },
        // ];
        // msg!("Creator Assigned");
        // let symbol = std::string::ToString::to_string("symb");
        // invoke(
        //     &create_metadata_accounts_v2(
        //         ctx.accounts.token_metadata_program.key(),
        //         ctx.accounts.metadata.key(),
        //         ctx.accounts.mint.key(),
        //         ctx.accounts.mint_authority.key(),
        //         ctx.accounts.payer.key(),
        //         ctx.accounts.payer.key(),
        //         title,
        //         symbol,
        //         uri,
        //         Some(creator),
        //         1,
        //         true,
        //         false,
        //         None,
        //         None,
        //     ),
        //     account_info.as_slice(),
        // )?;
        // msg!("Metadata Account Created !!!");

        let create_metadat_account_v3 = CreateMetadataAccountV3 {
            metadata: ctx.accounts.metadata.key(),
            mint: ctx.accounts.mint.key(),
            mint_authority: ctx.accounts.payer.key(),
            payer: ctx.accounts.payer.key(),
            update_authority: (ctx.accounts.payer.key(), true),
            system_program: ctx.accounts.system_program.key(),
            rent: None,
        };

        let create_metadat_account_v3_instruction =
            create_metadat_account_v3.instruction(CreateMetadataAccountV3InstructionArgs {
                data: DataV2 {
                    name: name,
                    symbol: symbol,
                    uri: uri,
                    seller_fee_basis_points: 1,
                    creators: Some(vec![
                        Creator {
                            address: id(),
                            verified: false,
                            share: 0,
                        },
                        Creator {
                            address: ctx.accounts.payer.key(),
                            verified: true,
                            share: 100,
                        },
                    ]),
                    collection: None,
                    uses: None,
                },
                is_mutable: false,
                collection_details: None,
            });

        let create_metadata_account_v3_account_infos = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(), // ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];

        invoke(
            &create_metadat_account_v3_instruction,
            &create_metadata_account_v3_account_infos,
        )?;
        msg!("Metadata Account Created ");
        // let master_edition_infos = vec![
        //     ctx.accounts.master_edition.to_account_info(),
        //     ctx.accounts.mint.to_account_info(),
        //     ctx.accounts.mint_authority.to_account_info(),
        //     ctx.accounts.payer.to_account_info(),
        //     ctx.accounts.metadata.to_account_info(),
        //     ctx.accounts.token_metadata_program.to_account_info(),
        //     ctx.accounts.token_program.to_account_info(),
        //     ctx.accounts.system_program.to_account_info(),
        //     ctx.accounts.rent.to_account_info(),
        // ];
        // msg!("Master Edition Account Infos Assigned");
        // invoke(
        //     &create_master_edition_v3(
        //         ctx.accounts.token_metadata_program.key(),
        //         ctx.accounts.master_edition.key(),
        //         ctx.accounts.mint.key(),
        //         ctx.accounts.payer.key(),
        //         ctx.accounts.mint_authority.key(),
        //         ctx.accounts.metadata.key(),
        //         ctx.accounts.payer.key(),
        //         Some(0),
        //     ),
        //     master_edition_infos.as_slice(),
        // )?;
        // msg!("Master Edition Nft Minted !!!");

        let create_master_edition_v3 = CreateMasterEditionV3 {
            edition: ctx.accounts.master_edition.key(),
            mint: ctx.accounts.mint.key(),
            update_authority: ctx.accounts.payer.key(),
            mint_authority: ctx.accounts.payer.key(),
            metadata: ctx.accounts.metadata.key(),
            payer: ctx.accounts.payer.key(),
            token_program: ctx.accounts.token_program.key(),
            system_program: ctx.accounts.system_program.key(),
            rent: ctx.accounts.rent.key().into(),
        };

        let create_master_edition_v3_instruction =
            create_master_edition_v3.instruction(CreateMasterEditionV3InstructionArgs {
                max_supply: Some(0),
            });
        let create_master_edition_v3_account_infos = vec![
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(), // minter
            ctx.accounts.payer.to_account_info(), // payer
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];
        invoke(
            &create_master_edition_v3_instruction,
            &create_master_edition_v3_account_infos,
        )?;
        msg!("Master Edition Nft Minted");

        emit!(NftMinted {
            mint: ctx.accounts.mint.key(),
        });

        Ok(())
    }

    /// External instruction that only gets executed if
    /// an `Ed25519Program.createInstructionWithPublicKey`
    /// instruction was sent in the same transaction.
    pub fn verify_ed25519(
        ctx: Context<Verify>,
        pubkey: [u8; 32],
        msg: Vec<u8>,
        sig: [u8; 64],
    ) -> Result<()> {
        msg!(&format!("pubkey: {:?}", pubkey));
        // Get what should be the Ed25519Program instruction
        let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;

        // Check that ix is what we expect to have been sent
        utils::verify_ed25519_ix(&ix, &pubkey, &msg, &sig)?;

        // Do other stuff

        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct AssetsState {
    manager: Pubkey,
}

#[derive(Accounts)]
#[instruction()]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = manager,
        space = 8 + AssetsState::MAX_SIZE,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, AssetsState>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct GetConsts<'info> {
    #[account(
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, AssetsState>,
}

#[derive(Accounts)]
pub struct UpdateManager<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, AssetsState>,
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, AssetsState>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
        mint::freeze_authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    // pub rent: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    // for signature verification
    // pub sender: Signer<'info>,
    /// CHECK:
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MintNFTNoVerify<'info> {
    #[account(
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, AssetsState>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
        mint::freeze_authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    // pub rent: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
}

// #[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
// pub struct InitTokenParams {

// }

impl AssetsState {
    pub const MAX_SIZE: usize = 32;
}

/// Context accounts
#[derive(Accounts)]
pub struct Verify<'info> {
    pub sender: Signer<'info>,

    /// The address check is needed because otherwise
    /// the supplied Sysvar could be anything else.
    /// The Instruction Sysvar has not been implemented
    /// in the Anchor framework yet, so this is the safe approach.
    /// CHECK:
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,
}

#[event]
pub struct NftMinted {
    mint: Pubkey,
}

pub mod utils {
    use anchor_lang::solana_program::instruction::Instruction;

    use super::*;

    /// Verify Ed25519Program instruction fields
    pub fn verify_ed25519_ix(
        ix: &Instruction,
        pubkey: &[u8],
        msg: &[u8],
        sig: &[u8],
    ) -> Result<()> {
        if ix.program_id       != ED25519_ID                   ||  // The program id we expect
            ix.accounts.len()   != 0                            ||  // With no context accounts
            ix.data.len()       != (16 + 64 + 32 + msg.len())
        // And data of this size
        {
            return Err(CustomErrorCode::SigVerificationFailed.into()); // Otherwise, we can already throw err
        }

        check_ed25519_data(&ix.data, pubkey, msg, sig)?; // If that's not the case, check data

        Ok(())
    }

    // /// Verify Secp256k1Program instruction fields
    // pub fn verify_secp256k1_ix(
    //     ix: &Instruction,
    //     eth_address: &[u8],
    //     msg: &[u8],
    //     sig: &[u8],
    //     recovery_id: u8,
    // ) -> ProgramResult {
    //     if ix.program_id       != SECP256K1_ID                 ||  // The program id we expect
    //         ix.accounts.len()   != 0                            ||  // With no context accounts
    //         ix.data.len()       != (12 + 20 + 64 + 1 + msg.len())
    //     // And data of this size
    //     {
    //         return Err(ErrorCode::SigVerificationFailed.into()); // Otherwise, we can already throw err
    //     }

    //     check_secp256k1_data(&ix.data, eth_address, msg, sig, recovery_id)?; // If that's not the case, check data

    //     Ok(())
    // }

    /// Verify serialized Ed25519Program instruction data
    pub fn check_ed25519_data(data: &[u8], pubkey: &[u8], msg: &[u8], sig: &[u8]) -> Result<()> {
        // According to this layout used by the Ed25519Program
        // https://github.com/solana-labs/solana-web3.js/blob/master/src/ed25519-program.ts#L33

        // "Deserializing" byte slices

        let num_signatures = &[data[0]]; // Byte  0
        let padding = &[data[1]]; // Byte  1
        let signature_offset = &data[2..=3]; // Bytes 2,3
        let signature_instruction_index = &data[4..=5]; // Bytes 4,5
        let public_key_offset = &data[6..=7]; // Bytes 6,7
        let public_key_instruction_index = &data[8..=9]; // Bytes 8,9
        let message_data_offset = &data[10..=11]; // Bytes 10,11
        let message_data_size = &data[12..=13]; // Bytes 12,13
        let message_instruction_index = &data[14..=15]; // Bytes 14,15

        let data_pubkey = &data[16..16 + 32]; // Bytes 16..16+32
        let data_sig = &data[48..48 + 64]; // Bytes 48..48+64
        let data_msg = &data[112..]; // Bytes 112..end

        // Expected values

        let exp_public_key_offset: u16 = 16; // 2*u8 + 7*u16
        let exp_signature_offset: u16 = exp_public_key_offset + pubkey.len() as u16;
        let exp_message_data_offset: u16 = exp_signature_offset + sig.len() as u16;
        let exp_num_signatures: u8 = 1;
        let exp_message_data_size: u16 = msg.len().try_into().unwrap();

        // Header and Arg Checks

        // Header
        if num_signatures != &exp_num_signatures.to_le_bytes()
            || padding != &[0]
            || signature_offset != &exp_signature_offset.to_le_bytes()
            || signature_instruction_index != &u16::MAX.to_le_bytes()
            || public_key_offset != &exp_public_key_offset.to_le_bytes()
            || public_key_instruction_index != &u16::MAX.to_le_bytes()
            || message_data_offset != &exp_message_data_offset.to_le_bytes()
            || message_data_size != &exp_message_data_size.to_le_bytes()
            || message_instruction_index != &u16::MAX.to_le_bytes()
        {
            return Err(CustomErrorCode::SigVerificationFailed.into());
        }

        // Arguments
        if data_pubkey != pubkey || data_msg != msg || data_sig != sig {
            return Err(CustomErrorCode::SigVerificationFailed.into());
        }

        Ok(())
    }

    // /// Verify serialized Secp256k1Program instruction data
    // pub fn check_secp256k1_data(
    //     data: &[u8],
    //     eth_address: &[u8],
    //     msg: &[u8],
    //     sig: &[u8],
    //     recovery_id: u8,
    // ) -> ProgramResult {
    //     // According to this layout used by the Secp256k1Program
    //     // https://github.com/solana-labs/solana-web3.js/blob/master/src/secp256k1-program.ts#L49

    //     // "Deserializing" byte slices

    //     let num_signatures = &[data[0]]; // Byte  0
    //     let signature_offset = &data[1..=2]; // Bytes 1,2
    //     let signature_instruction_index = &[data[3]]; // Byte  3
    //     let eth_address_offset = &data[4..=5]; // Bytes 4,5
    //     let eth_address_instruction_index = &[data[6]]; // Byte  6
    //     let message_data_offset = &data[7..=8]; // Bytes 7,8
    //     let message_data_size = &data[9..=10]; // Bytes 9,10
    //     let message_instruction_index = &[data[11]]; // Byte  11

    //     let data_eth_address = &data[12..12 + 20]; // Bytes 12..12+20
    //     let data_sig = &data[32..32 + 64]; // Bytes 32..32+64
    //     let data_recovery_id = &[data[96]]; // Byte  96
    //     let data_msg = &data[97..]; // Bytes 97..end

    //     // Expected values

    //     const SIGNATURE_OFFSETS_SERIALIZED_SIZE: u16 = 11;
    //     const DATA_START: u16 = 1 + SIGNATURE_OFFSETS_SERIALIZED_SIZE;

    //     let msg_len: u16 = msg.len().try_into().unwrap();
    //     let eth_address_len: u16 = eth_address.len().try_into().unwrap();
    //     let sig_len: u16 = sig.len().try_into().unwrap();

    //     let exp_eth_address_offset: u16 = DATA_START;
    //     let exp_signature_offset: u16 = DATA_START + eth_address_len;
    //     let exp_message_data_offset: u16 = exp_signature_offset + sig_len + 1;
    //     let exp_num_signatures: u8 = 1;

    //     // Header and Arg Checks

    //     // Header
    //     if num_signatures != &exp_num_signatures.to_le_bytes()
    //         || signature_offset != &exp_signature_offset.to_le_bytes()
    //         || signature_instruction_index != &[0]
    //         || eth_address_offset != &exp_eth_address_offset.to_le_bytes()
    //         || eth_address_instruction_index != &[0]
    //         || message_data_offset != &exp_message_data_offset.to_le_bytes()
    //         || message_data_size != &msg_len.to_le_bytes()
    //         || message_instruction_index != &[0]
    //     {
    //         return Err(ErrorCode::SigVerificationFailed.into());
    //     }

    //     // Arguments
    //     if data_eth_address != eth_address
    //         || data_sig != sig
    //         || data_recovery_id != &[recovery_id]
    //         || data_msg != msg
    //     {
    //         return Err(ErrorCode::SigVerificationFailed.into());
    //     }

    //     Ok(())
    // }
}

#[error_code]
pub enum CustomErrorCode {
    #[msg("Signature verification failed.")]
    SigVerificationFailed,
}
