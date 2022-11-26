export type HelloAnchor = {
  "version": "0.1.0",
  "name": "hello_anchor",
  "instructions": [
    {
      "name": "initSystem",
      "accounts": [
        {
          "name": "systemFeeAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
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
          "name": "pda",
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
          "name": "feeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "estimateLoanFee",
      "accounts": [
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ],
      "returns": "u64"
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
          "name": "loan",
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
      "name": "claimNft",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "loanPda",
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
      "name": "settlementAmount",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "u128"
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
          "name": "loan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanPda",
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
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftDestination",
          "isMut": false,
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
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "splitLoan",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "mergeLoan",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "loan",
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
            "name": "status",
            "type": {
              "defined": "LoanStatus"
            }
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
            "name": "OneHour"
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
            "name": "OneYear"
          }
        ]
      }
    },
    {
      "name": "AppError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ExceededSlippage"
          },
          {
            "name": "ZeroTradingTokens"
          },
          {
            "name": "EmptySupply"
          },
          {
            "name": "InvalidOwner"
          },
          {
            "name": "ConversionFailure"
          },
          {
            "name": "FeeNotEnough"
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
            "name": "Disabled"
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
  ]
};

export const IDL: HelloAnchor = {
  "version": "0.1.0",
  "name": "hello_anchor",
  "instructions": [
    {
      "name": "initSystem",
      "accounts": [
        {
          "name": "systemFeeAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
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
          "name": "pda",
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
          "name": "feeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "estimateLoanFee",
      "accounts": [
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ],
      "returns": "u64"
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
          "name": "loan",
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
      "name": "claimNft",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "loanPda",
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
      "name": "settlementAmount",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "u128"
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
          "name": "loan",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanPda",
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
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftDestination",
          "isMut": false,
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
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "splitLoan",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "mergeLoan",
      "accounts": [
        {
          "name": "loan",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "loan",
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
            "name": "status",
            "type": {
              "defined": "LoanStatus"
            }
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
            "name": "OneHour"
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
            "name": "OneYear"
          }
        ]
      }
    },
    {
      "name": "AppError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ExceededSlippage"
          },
          {
            "name": "ZeroTradingTokens"
          },
          {
            "name": "EmptySupply"
          },
          {
            "name": "InvalidOwner"
          },
          {
            "name": "ConversionFailure"
          },
          {
            "name": "FeeNotEnough"
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
            "name": "Disabled"
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
  ]
};
