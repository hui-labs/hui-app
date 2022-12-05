export type Hui = {
  "version": "0.1.0",
  "name": "hui",
  "instructions": [
    {
      "name": "initPool",
      "accounts": [
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vaultMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemFeeAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "config",
          "type": {
            "defined": "PoolConfig"
          }
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commissionFee",
          "type": "u64"
        },
        {
          "name": "loanTerm",
          "type": {
            "defined": "LoanTerm"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "depositor",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initLoan",
      "accounts": [
        {
          "name": "masterLoan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "loanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closePool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closeLoan",
      "accounts": [
        {
          "name": "loan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimNft",
      "accounts": [
        {
          "name": "masterLoan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanMetadataPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "claimAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "finalSettlement",
      "accounts": [
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "loanMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimLoan",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "masterLoan",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "loanMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "listNft",
      "accounts": [
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "loanMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "itemAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyNft",
      "accounts": [
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "loanMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "delistNft",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimFund",
      "accounts": [
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ownerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "itemForSale",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "ownerAccount",
            "type": "publicKey"
          },
          {
            "name": "metadataAccount",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "itemAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultMint",
            "type": "publicKey"
          },
          {
            "name": "vaultAccount",
            "type": "publicKey"
          },
          {
            "name": "isOpen",
            "type": "bool"
          },
          {
            "name": "isSold",
            "type": "bool"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "loanMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "parent",
            "type": "publicKey"
          },
          {
            "name": "nftAccount",
            "type": "publicKey"
          },
          {
            "name": "claimAccount",
            "type": "publicKey"
          },
          {
            "name": "status",
            "type": {
              "defined": "LoanStatus"
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "masterLoan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "collateralAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultMint",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "nftAccount",
            "type": "publicKey"
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "loanTerm",
            "type": {
              "defined": "LoanTerm"
            }
          },
          {
            "name": "fees",
            "type": {
              "defined": "Fees"
            }
          },
          {
            "name": "minLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanThreshold",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "receivedAmount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "vaultAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultMint",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "poolFeeAccount",
            "type": "publicKey"
          },
          {
            "name": "loanTerm",
            "type": {
              "defined": "LoanTerm"
            }
          },
          {
            "name": "fees",
            "type": {
              "defined": "Fees"
            }
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "minLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanThreshold",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": "PoolStatus"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Fees",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transferFee",
            "type": "u64"
          },
          {
            "name": "loanFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PoolConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "minLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanThreshold",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "LoanTerm",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TwoMinutes"
          },
          {
            "name": "OneMonth"
          },
          {
            "name": "ThreeMonths"
          },
          {
            "name": "SixMonths"
          },
          {
            "name": "NineMonths"
          },
          {
            "name": "TwelveMonths"
          }
        ]
      }
    },
    {
      "name": "LoanStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Opening"
          },
          {
            "name": "Final"
          },
          {
            "name": "Closed"
          },
          {
            "name": "Done"
          }
        ]
      }
    },
    {
      "name": "PoolStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Opening"
          },
          {
            "name": "Disabled"
          },
          {
            "name": "Closed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SignerIsNotNftOwner",
      "msg": "Signer is not nft owner"
    },
    {
      "code": 6001,
      "name": "PoolAmountNotEnough",
      "msg": "Pool amount is not enough"
    },
    {
      "code": 6002,
      "name": "AmountTooLarge",
      "msg": "Provided amount is too large"
    },
    {
      "code": 6003,
      "name": "AmountTooSmall",
      "msg": "Provided amount is too small"
    },
    {
      "code": 6004,
      "name": "AmountIsZero",
      "msg": "Provided amount is zero"
    },
    {
      "code": 6005,
      "name": "FeeNotEnough",
      "msg": "Provided fee is invalid"
    },
    {
      "code": 6006,
      "name": "NftAlreadyClaimed",
      "msg": "NFT has already claimed"
    },
    {
      "code": 6007,
      "name": "NftAlreadyListed",
      "msg": "NFT has already listed"
    }
  ]
};

export const IDL: Hui = {
  "version": "0.1.0",
  "name": "hui",
  "instructions": [
    {
      "name": "initPool",
      "accounts": [
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vaultMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemFeeAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "config",
          "type": {
            "defined": "PoolConfig"
          }
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commissionFee",
          "type": "u64"
        },
        {
          "name": "loanTerm",
          "type": {
            "defined": "LoanTerm"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "depositor",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initLoan",
      "accounts": [
        {
          "name": "masterLoan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "loanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closePool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closeLoan",
      "accounts": [
        {
          "name": "loan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimNft",
      "accounts": [
        {
          "name": "masterLoan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanMetadataPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "claimAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "finalSettlement",
      "accounts": [
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "loanMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimLoan",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "masterLoan",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "loanMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterLoanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "listNft",
      "accounts": [
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "loanMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "itemAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyNft",
      "accounts": [
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "loanMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "delistNft",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimFund",
      "accounts": [
        {
          "name": "itemForSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "itemForSalePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ownerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "itemForSale",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "ownerAccount",
            "type": "publicKey"
          },
          {
            "name": "metadataAccount",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "itemAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultMint",
            "type": "publicKey"
          },
          {
            "name": "vaultAccount",
            "type": "publicKey"
          },
          {
            "name": "isOpen",
            "type": "bool"
          },
          {
            "name": "isSold",
            "type": "bool"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "loanMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "parent",
            "type": "publicKey"
          },
          {
            "name": "nftAccount",
            "type": "publicKey"
          },
          {
            "name": "claimAccount",
            "type": "publicKey"
          },
          {
            "name": "status",
            "type": {
              "defined": "LoanStatus"
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "masterLoan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "collateralAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultMint",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "nftAccount",
            "type": "publicKey"
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "loanTerm",
            "type": {
              "defined": "LoanTerm"
            }
          },
          {
            "name": "fees",
            "type": {
              "defined": "Fees"
            }
          },
          {
            "name": "minLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanThreshold",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "receivedAmount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "vaultAccount",
            "type": "publicKey"
          },
          {
            "name": "vaultMint",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "poolFeeAccount",
            "type": "publicKey"
          },
          {
            "name": "loanTerm",
            "type": {
              "defined": "LoanTerm"
            }
          },
          {
            "name": "fees",
            "type": {
              "defined": "Fees"
            }
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "minLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanThreshold",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": "PoolStatus"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Fees",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transferFee",
            "type": "u64"
          },
          {
            "name": "loanFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PoolConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "minLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanAmount",
            "type": "u64"
          },
          {
            "name": "maxLoanThreshold",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "LoanTerm",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TwoMinutes"
          },
          {
            "name": "OneMonth"
          },
          {
            "name": "ThreeMonths"
          },
          {
            "name": "SixMonths"
          },
          {
            "name": "NineMonths"
          },
          {
            "name": "TwelveMonths"
          }
        ]
      }
    },
    {
      "name": "LoanStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Opening"
          },
          {
            "name": "Final"
          },
          {
            "name": "Closed"
          },
          {
            "name": "Done"
          }
        ]
      }
    },
    {
      "name": "PoolStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Opening"
          },
          {
            "name": "Disabled"
          },
          {
            "name": "Closed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SignerIsNotNftOwner",
      "msg": "Signer is not nft owner"
    },
    {
      "code": 6001,
      "name": "PoolAmountNotEnough",
      "msg": "Pool amount is not enough"
    },
    {
      "code": 6002,
      "name": "AmountTooLarge",
      "msg": "Provided amount is too large"
    },
    {
      "code": 6003,
      "name": "AmountTooSmall",
      "msg": "Provided amount is too small"
    },
    {
      "code": 6004,
      "name": "AmountIsZero",
      "msg": "Provided amount is zero"
    },
    {
      "code": 6005,
      "name": "FeeNotEnough",
      "msg": "Provided fee is invalid"
    },
    {
      "code": 6006,
      "name": "NftAlreadyClaimed",
      "msg": "NFT has already claimed"
    },
    {
      "code": 6007,
      "name": "NftAlreadyListed",
      "msg": "NFT has already listed"
    }
  ]
};
