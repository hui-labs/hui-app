## HUI App

WARNING: This project is under developing. Only avaible on devnet.

Official HUI App program and interface of the HUI protocol.

## How to run

Install npm packages

```shell
npm install
```

Start local node

```shell
solana-test-validator
```

Build anchor project

```shell
anchor build
```

Deploy anchor project to local

```shell
anchor deploy --provider.cluster http://127.0.0.1:8899
```

Copy the `Program Id` to:

1. `declare_id!` in `programs/hui/src/lib.rs`
2. `programs.localnet` in `Anchor.toml`
3. `PROGRAM_ID` in `scripts/bootstrap.ts`

Build anchor project again

```shell
anchor build
```

Deploy anchor project to local again

```shell
anchor deploy --provider.cluster http://127.0.0.1:8899
```
