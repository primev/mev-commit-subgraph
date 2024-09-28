import { BigInt } from '@graphprotocol/graph-ts';
import { MevCommitValidators, Staker } from '../generated/schema';
import {
  StakeAdded,
  Staked,
  StakeWithdrawn,
  Unstaked,
} from '../generated/VanillaRegistry/VanillaRegistry';

const MEV_COMMIT_VALIDATORS_ID = 'mevCommitValidators';

export function handleStaked(event: Staked): void {
  let staker = Staker.load(event.params.valBLSPubKey.toHex());
  if (staker == null) {
    staker = new Staker(event.params.valBLSPubKey.toHex());
    staker.validatorBLSKey = event.params.valBLSPubKey.toHex();
    staker.created = event.block.timestamp;
    staker.status = 'Staked';
    staker.stakedAmount = event.params.amount;
    staker.stakedAt = event.block.number;
  }
  staker.save();

  // Load the entity with a static ID
  let mevCommitValidators = MevCommitValidators.load(MEV_COMMIT_VALIDATORS_ID);

  // If it doesn't exist, create it with the predefined ID
  if (mevCommitValidators == null) {
    mevCommitValidators = new MevCommitValidators(MEV_COMMIT_VALIDATORS_ID);
    mevCommitValidators.totalOptedIn = BigInt.fromI32(0);
    mevCommitValidators.totalStaked = BigInt.fromI32(0);
    mevCommitValidators.totalRestaked = BigInt.fromI32(0);
  }

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

  // Load the entity with a static ID
  let mevCommitValidators = MevCommitValidators.load(MEV_COMMIT_VALIDATORS_ID);

  // If it doesn't exist, create it with the predefined ID
  if (mevCommitValidators == null) {
    mevCommitValidators = new MevCommitValidators(MEV_COMMIT_VALIDATORS_ID);
    mevCommitValidators.totalOptedIn = BigInt.fromI32(0);
    mevCommitValidators.totalStaked = BigInt.fromI32(0);
    mevCommitValidators.totalRestaked = BigInt.fromI32(0);
  }

  mevCommitValidators.totalStaked = mevCommitValidators.totalStaked.plus(
    event.params.amount
  );

  // Save the updated entity
  mevCommitValidators.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  let staker = Staker.load(event.params.valBLSPubKey.toHex());
  if (staker != null) {
    staker.status = 'Withdrawn';
    staker.stakedAmount = BigInt.fromI32(0);
    staker.save();
  }
}

export function handleUnstaked(event: Unstaked): void {
  let staker = Staker.load(event.params.valBLSPubKey.toHex());
  if (staker != null) {
    staker.status = 'Unstaked';
    staker.save();
  }

  // Load the entity with a static ID
  let mevCommitValidators = MevCommitValidators.load(MEV_COMMIT_VALIDATORS_ID);

  // If it doesn't exist, create it with the predefined ID
  if (mevCommitValidators == null) {
    mevCommitValidators = new MevCommitValidators(MEV_COMMIT_VALIDATORS_ID);
    mevCommitValidators.totalOptedIn = BigInt.fromI32(0);
    mevCommitValidators.totalStaked = BigInt.fromI32(0);
    mevCommitValidators.totalRestaked = BigInt.fromI32(0);
  } else {
    // Remove the validator from the totalOptedIn count
    mevCommitValidators.totalOptedIn = mevCommitValidators.totalOptedIn.minus(
      BigInt.fromI32(1)
    );

    // Remove the validator's staked amount from the totalStaked
    mevCommitValidators.totalStaked = mevCommitValidators.totalStaked.minus(
      event.params.amount
    );
  }

  // Save the updated entity
  mevCommitValidators.save();
}
