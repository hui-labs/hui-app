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
          "isMut": false,
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
          "name": "vault",
          "isMut": true,
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
          "isMut": false,
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
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanBVault",
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
          "name": "systemFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintNft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "borrower",
          "isMut": false,
          "isSigner": true
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
          "name": "loanAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanBVault",
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
          "name": "mintNft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanVault",
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
            "name": "tokenAAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenBAccount",
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
            "name": "tokenBAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
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
            "name": "Listing"
          },
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
          "isMut": false,
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
          "name": "vault",
          "isMut": true,
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
          "isMut": false,
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
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanBVault",
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
          "name": "systemFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintNft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "borrower",
          "isMut": false,
          "isSigner": true
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
          "name": "loanAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanBVault",
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
          "name": "mintNft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loanVault",
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
            "name": "tokenAAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenBAccount",
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
            "name": "tokenBAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
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
            "name": "Listing"
          },
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
