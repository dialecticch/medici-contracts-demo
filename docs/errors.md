# Errors

### `AuthContext` errors

- `AC1`: `User not authorized.`

### `AuthRegistry` errors

- `AR1`: `Caller is not the authorized Safe.`
- `AR2`: `Caller is not authorized to disable the desired role for the user.`

### `ExtRegistry` errors

- `ER1`: `Caller is not the authorized Safe.`
- `ER2`: `Caller is not authorized to disable the desired address.`

### `AbstractStrategy` errors

_(These errors refers to generic errors in strategies)_

- `S01`: `Address zero.`
- `S02`: `User not authorized.`
- `S03`: `Router not trusted.`
- `S04`: `Spender not trusted.`
- `S05`: `Error during deposit.`
- `S06`: `Error during withdrawal.`
- `S07`: `Error during harvest.`
- `S08`: `Address not trusted.`
- `S09`: `Error during transfer.`

### `SwapHelper` errors

- `SH01`: `Swap failed.`
- `SH02`: `Insufficient amount out.`

### `ConvexFraxStrategy` errors

- `CFS01`: `Nothing to withdraw.`
- `CFS02`: `Error while creating vault.`

### `PerpHelper` errors

- `PH01`: `Failed to deposit.`
- `PH02`: `Failed to withdraw.`
- `PH03`: `Failed to increase short.`
- `PH04`: `Failed to increase long.`
- `PH05`: `Failed to close position.`

### `AbstractBridge` errors

_(These errors refer to generic errors in bridges adapters)_

- `B01`: `User not authorized.`
- `B02`: `Error during deposit into bridge.`
- `B03`: `Bridge contract not set for chain ids.`
- `B04`: `Receiver address not allowed.`
