# contracts

`RewardToken` (RWRD) and `DePINRewardDistributor` — the operator claims rewards
from the distributor via `claim(amount, to)`. Balances come from `accrue`
(owner) or a permissionless faucet (`demoReward` on a 60s cooldown) so anyone can
run the flow.

```bash
forge test
forge script script/Deploy.s.sol --broadcast --legacy \
  --rpc-url <rpc> --private-key $DEPLOYER_PRIVATE_KEY
```

Deploy env: `OPERATOR_ADDRESS`, `INITIAL_ACCRUAL`, `POOL_SUPPLY`, `DEMO_REWARD`.
