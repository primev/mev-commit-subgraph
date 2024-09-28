# Mev-Commit Subgraph

This subgraph is used to index the events from the MevCommitAVSV3, VanillaRegistry, and DelegationManager contracts on the Ethereum network.

## Deploying the subgraph:

### Install dependencies

```ssh
pnpm install
```

### Login to Goldsky

```ssh
goldsky login
```

### Build & Generate Types

```bash
pnpm build
pnpm codegen
```

### Deploy

```bash
pnpm deploy
```
