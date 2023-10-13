export type SolanaPrograms = {
  version: '0.1.0';
  name: 'aiverse_assets';
  instructions: [
    {
      name: 'initialize';
      accounts: [
        {
          name: 'state';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'manager';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'mintNft';
      accounts: [
        {
          name: 'state';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'destination';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'metadata';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenMetadataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'masterEdition';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'ixSysvar';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'name';
          type: 'string';
        },
        {
          name: 'symbol';
          type: 'string';
        },
        {
          name: 'uri';
          type: 'string';
        },
        {
          name: 'sig';
          type: {
            array: ['u8', 64];
          };
        },
      ];
    },
    {
      name: 'verifyEd25519';
      docs: [
        'External instruction that only gets executed if',
        'an `Ed25519Program.createInstructionWithPublicKey`',
        'instruction was sent in the same transaction.',
      ];
      accounts: [
        {
          name: 'sender';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'ixSysvar';
          isMut: false;
          isSigner: false;
          docs: [
            'The address check is needed because otherwise',
            'the supplied Sysvar could be anything else.',
            'The Instruction Sysvar has not been implemented',
            'in the Anchor framework yet, so this is the safe approach.',
          ];
        },
      ];
      args: [
        {
          name: 'pubkey';
          type: {
            array: ['u8', 32];
          };
        },
        {
          name: 'msg';
          type: 'bytes';
        },
        {
          name: 'sig';
          type: {
            array: ['u8', 64];
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'AssetsState';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'manager';
            type: 'publicKey';
          },
        ];
      };
    },
  ];
  events: [
    {
      name: 'NftMinted';
      fields: [
        {
          name: 'mint';
          type: 'publicKey';
          index: false;
        },
      ];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'SigVerificationFailed';
      msg: 'Signature verification failed.';
    },
  ];
};

export const IDL: SolanaPrograms = {
  version: '0.1.0',
  name: 'aiverse_assets',
  instructions: [
    {
      name: 'initialize',
      accounts: [
        {
          name: 'state',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'mintNft',
      accounts: [
        {
          name: 'state',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'destination',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'metadata',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenMetadataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'masterEdition',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'ixSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'symbol',
          type: 'string',
        },
        {
          name: 'uri',
          type: 'string',
        },
        {
          name: 'sig',
          type: {
            array: ['u8', 64],
          },
        },
      ],
    },
    {
      name: 'verifyEd25519',
      docs: [
        'External instruction that only gets executed if',
        'an `Ed25519Program.createInstructionWithPublicKey`',
        'instruction was sent in the same transaction.',
      ],
      accounts: [
        {
          name: 'sender',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'ixSysvar',
          isMut: false,
          isSigner: false,
          docs: [
            'The address check is needed because otherwise',
            'the supplied Sysvar could be anything else.',
            'The Instruction Sysvar has not been implemented',
            'in the Anchor framework yet, so this is the safe approach.',
          ],
        },
      ],
      args: [
        {
          name: 'pubkey',
          type: {
            array: ['u8', 32],
          },
        },
        {
          name: 'msg',
          type: 'bytes',
        },
        {
          name: 'sig',
          type: {
            array: ['u8', 64],
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'AssetsState',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'manager',
            type: 'publicKey',
          },
        ],
      },
    },
  ],
  events: [
    {
      name: 'NftMinted',
      fields: [
        {
          name: 'mint',
          type: 'publicKey',
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'SigVerificationFailed',
      msg: 'Signature verification failed.',
    },
  ],
};
