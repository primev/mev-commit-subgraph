import { BigInt } from '@graphprotocol/graph-ts';
import { Staker } from '../../generated/schema';
import {
  StakeAdded,
  Staked,
  StakeWithdrawn,
  Unstaked,
} from '../../generated/VanillaRegistry/VanillaRegistry';
import { loadOrCreateMevCommitValidators } from '../utils';

export function loadOrCreateStaker(
  valBLSPubKey: string,
  timestamp: BigInt,
  blockNumber: BigInt
): Staker {
  let staker = Staker.load(valBLSPubKey);
  if (staker == null) {
    staker = new Staker(valBLSPubKey);
    staker.validatorBLSKey = valBLSPubKey;
    staker.created = timestamp;
    staker.status = 'Staked';
    staker.stakedAmount = BigInt.fromI32(0);
    staker.stakedAt = blockNumber;
  }
  return staker;
}

export function handleStaked(event: Staked): void {
  let staker = loadOrCreateStaker(
    event.params.valBLSPubKey.toHex(),
    event.block.timestamp,
    event.block.number
  );
  staker.stakedAmount = event.params.amount;
  staker.save();

  // Load or create the MevCommitValidators entity
  let mevCommitValidators = loadOrCreateMevCommitValidators();

  mevCommitValidators.totalStaked = mevCommitValidators.totalStaked.plus(
    event.params.amount
  );

  mevCommitValidators.totalOptedIn = mevCommitValidators.totalOptedIn.plus(
    BigInt.fromI32(1)
  );

  // Save the updated entity
  mevCommitValidators.save();
}

export function handleStakeAdded(event: StakeAdded): void {
  let staker = Staker.load(event.params.valBLSPubKey.toHex());
  if (staker != null) {
    staker.stakedAmount = staker.stakedAmount.plus(event.params.amount);
    staker.save();
  }

  let mevCommitValidators = loadOrCreateMevCommitValidators();

  // Update the total staked amount
  mevCommitValidators.totalStaked = mevCommitValidators.totalStaked.plus(
    event.params.amount
  );

  // Save the updated entity
  mevCommitValidators.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  let staker = Staker.load(event.params.valBLSPubKey.toHex());

  // a staker must already be defined in the registry to be withdrawn
  if (staker != null) {
    staker.status = 'Withdrawn';
    staker.stakedAmount = staker.stakedAmount.minus(event.params.amount);
    staker.save();
  }
}

export function handleUnstaked(event: Unstaked): void {
  let staker = Staker.load(event.params.valBLSPubKey.toHex());

  // A staker must already be defined in the registry to be unstaked
  if (staker != null) {
    staker.status = 'Unstaked';
    staker.save();
  }

  // Load or create the MevCommitValidators entity
  let mevCommitValidators = loadOrCreateMevCommitValidators();

  // Remove the validator from the totalOptedIn count
  mevCommitValidators.totalOptedIn = mevCommitValidators.totalOptedIn.minus(
    BigInt.fromI32(1)
  );

  // Remove the validator's staked amount from the totalStaked
  mevCommitValidators.totalStaked = mevCommitValidators.totalStaked.minus(
    event.params.amount
  );

  // Save the updated entity
  mevCommitValidators.save();
}
