import { BigInt } from '@graphprotocol/graph-ts';
import { MevCommitValidators, Restaker } from '../generated/schema';
import {
  ValidatorRegistered,
  ValidatorDeregistered,
  ValidatorDeregistrationRequested,
} from '../generated/MevCommitAVSV3/MevCommitAVSV3';

// Constants
const MEV_COMMIT_VALIDATORS_ID = 'mevCommitValidators';
const DEFAULT_RESTAKED_AMOUNT = BigInt.fromI32(32).times(
  BigInt.fromI32(10).pow(18)
); // 32 ETH

// Helper function to load or create MevCommitValidators entity
function loadOrCreateMevCommitValidators(): MevCommitValidators {
  let mevCommitValidators = MevCommitValidators.load(MEV_COMMIT_VALIDATORS_ID);
  if (mevCommitValidators == null) {
    mevCommitValidators = new MevCommitValidators(MEV_COMMIT_VALIDATORS_ID);
    mevCommitValidators.totalOptedIn = BigInt.fromI32(0);
    mevCommitValidators.totalStaked = BigInt.fromI32(0);
    mevCommitValidators.totalRestaked = BigInt.fromI32(0);
  }
  return mevCommitValidators;
}

// Helper function to load or create Restaker entity
function loadOrCreateRestaker(
  validatorPubKey: string,
  event: ValidatorRegistered
): Restaker {
  let restaker = Restaker.load(validatorPubKey);
  if (restaker == null) {
    restaker = new Restaker(validatorPubKey);
    restaker.validatorBLSKey = validatorPubKey;
    restaker.created = event.block.timestamp;
    restaker.status = 'Registered';
    restaker.restakedAmount = DEFAULT_RESTAKED_AMOUNT;
    restaker.restakedAt = event.block.number;
    restaker.podOwner = event.params.podOwner.toHex();
  }
  return restaker;
}

// Handler for ValidatorRegistered event
export function handleValidatorRegistered(event: ValidatorRegistered): void {
  let validatorPubKey = event.params.validatorPubKey.toHex();
  let restaker = loadOrCreateRestaker(validatorPubKey, event);
  restaker.save();

  let mevCommitValidators = loadOrCreateMevCommitValidators();
  mevCommitValidators.totalRestaked = mevCommitValidators.totalRestaked.plus(
    DEFAULT_RESTAKED_AMOUNT
  );
  mevCommitValidators.totalOptedIn = mevCommitValidators.totalOptedIn.plus(
    BigInt.fromI32(1)
  );
  mevCommitValidators.save();
}

// Handler for ValidatorDeregistered event
export function handleValidatorDeregistered(
  event: ValidatorDeregistered
): void {
  let restaker = Restaker.load(event.params.validatorPubKey.toHex());
  if (restaker != null) {
    restaker.status = 'Deregistered';
    restaker.save();
  }
}

// Handler for ValidatorDeregistrationRequested event
export function handleValidatorDeregistrationRequested(
  event: ValidatorDeregistrationRequested
): void {
  let restaker = Restaker.load(event.params.validatorPubKey.toHex());
  if (restaker != null) {
    restaker.status = 'DeregistrationRequested';
    restaker.save();
  }

  let mevCommitValidators = loadOrCreateMevCommitValidators();
  mevCommitValidators.totalOptedIn = mevCommitValidators.totalOptedIn.minus(
    BigInt.fromI32(1)
  );
  mevCommitValidators.totalRestaked = mevCommitValidators.totalRestaked.minus(
    DEFAULT_RESTAKED_AMOUNT
  );
  mevCommitValidators.save();
}
