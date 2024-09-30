import { BigInt } from '@graphprotocol/graph-ts';
import { Staker, StakerValidator } from '../../generated/schema';
import {
  StakeAdded,
  Staked,
  StakeWithdrawn,
  Unstaked,
} from '../../generated/VanillaRegistry/VanillaRegistry';
import { loadOrCreateMevCommitValidators, max } from '../utils';

export function loadOrCreateStakerValidator(
  stakerId: string,
  event: Staked
): StakerValidator {
  let stakerValidator = StakerValidator.load(event.params.valBLSPubKey.toHex());
  if (stakerValidator == null) {
    stakerValidator = new StakerValidator(event.params.valBLSPubKey.toHex());
    stakerValidator.staker = stakerId;
    stakerValidator.validatorBLSKey = event.params.valBLSPubKey.toHex();
    stakerValidator.stakeAmount = event.params.amount;
    stakerValidator.stakedAt = event.block.number;
    stakerValidator.status = 'Staked';
  }
  return stakerValidator;
}

export function handleStaked(event: Staked): void {
  const stakerAddress = event.params.msgSender.toHex();
  let staker = Staker.load(stakerAddress);

  // Create a new staker if it doesn't exist
  if (staker == null) {
    staker = new Staker(stakerAddress);
    staker.created = event.block.timestamp;
    staker.save();
  }

  let stakerValidator = loadOrCreateStakerValidator(stakerAddress, event);
  stakerValidator.status = 'Staked';
  stakerValidator.save();

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
  let stakerValidator = StakerValidator.load(event.params.valBLSPubKey.toHex());

  if (stakerValidator != null) {
    stakerValidator.stakeAmount = stakerValidator.stakeAmount.plus(
      event.params.amount
    );
    stakerValidator.save();
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
  let stakerValidator = StakerValidator.load(event.params.valBLSPubKey.toHex());

  // a staker must already be defined in the registry to be withdrawn
  if (stakerValidator != null) {
    stakerValidator.status = 'Withdrawn';
    // Use max function to ensure stakeAmount doesn't go below 0
    stakerValidator.stakeAmount = max(
      stakerValidator.stakeAmount.minus(event.params.amount),
      BigInt.fromI32(0)
    );
    stakerValidator.save();
  }
}

export function handleUnstaked(event: Unstaked): void {
  let stakerValidator = StakerValidator.load(event.params.valBLSPubKey.toHex());

  // A staker must already be defined in the registry to be unstaked
  if (stakerValidator != null) {
    stakerValidator.status = 'Unstaked';
    stakerValidator.save();
  }

  // Load or create the MevCommitValidators entity
  let mevCommitValidators = loadOrCreateMevCommitValidators();

  // Remove the validator from the totalOptedIn count
  mevCommitValidators.totalOptedIn = max(
    mevCommitValidators.totalOptedIn.minus(BigInt.fromI32(1)),
    BigInt.fromI32(0)
  );

  // Remove the validator's staked amount from the totalStaked
  // Ensure totalStaked doesn't go below 0 using max()
  mevCommitValidators.totalStaked = max(
    mevCommitValidators.totalStaked.minus(event.params.amount),
    BigInt.fromI32(0)
  );

  // Save the updated entity
  mevCommitValidators.save();
}
