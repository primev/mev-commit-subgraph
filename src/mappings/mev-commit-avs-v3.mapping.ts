import { BigInt } from '@graphprotocol/graph-ts';
import { Operator, Restaker } from '../../generated/schema';
import {
  ValidatorRegistered,
  ValidatorDeregistered,
  ValidatorDeregistrationRequested,
  OperatorRegistered,
  OperatorDeregistered,
  OperatorDeregistrationRequested,
} from '../../generated/MevCommitAVSV3/MevCommitAVSV3';
import {
  createOrLoadEigenPod,
  loadOrCreateMevCommitValidators,
} from '../utils';

// This is the default amount of ETH that a validator is restaked with
// TODO: This should be looked up from the contract in the future
const DEFAULT_RESTAKED_AMOUNT = BigInt.fromI32(32).times(
  BigInt.fromI32(10).pow(18)
); // 32 ETH

// Helper function to load or create Restaker entity
function loadOrCreateRestaker(
  validatorPubKey: string,
  event: ValidatorRegistered
): Restaker {
  let restaker = Restaker.load(validatorPubKey);

  if (restaker == null) {
    // Create a new eigenpod at the time of restaking
    const eigenpod = createOrLoadEigenPod(event.params.podOwner);
    eigenpod.save();

    restaker = new Restaker(validatorPubKey);
    restaker.validatorBLSKey = validatorPubKey;
    restaker.created = event.block.timestamp;
    restaker.status = 'Registered';
    restaker.restakedAmount = DEFAULT_RESTAKED_AMOUNT;
    restaker.restakedAt = event.block.number;
    restaker.eigenPod = eigenpod.id;
  }
  return restaker;
}

/**
 * Handler for ValidatorRegistered event
 * when a validator is registered, we update the total restaked amount and the total opted in count
 * since the validator is now opted in to the MEV Commit network
 * @param event
 */
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

/**
 * Handler for ValidatorDeregistered event
 */
export function handleValidatorDeregistered(
  event: ValidatorDeregistered
): void {
  let restaker = Restaker.load(event.params.validatorPubKey.toHex());
  if (restaker != null) {
    restaker.status = 'Deregistered';
    restaker.save();
  }
}

/**
 * Handler for ValidatorDeregistrationRequested event
 * when a validator requests to be deregistered, we update the total restaked amount and the total opted in count
 * since the validator is considered no longer opted in to the MEV Commit network
 */
export function handleValidatorDeregistrationRequested(
  event: ValidatorDeregistrationRequested
): void {
  let restaker = Restaker.load(event.params.validatorPubKey.toHex());
  if (restaker != null) {
    restaker.status = 'DeregistrationRequested';
    restaker.save();
  }

  let mevCommitValidators = loadOrCreateMevCommitValidators();

  // subtract 1 from the total opted in count since the validator is no longer opted in to the MEV Commit network
  mevCommitValidators.totalOptedIn = mevCommitValidators.totalOptedIn.minus(
    BigInt.fromI32(1)
  );

  // subtract the restaked amount from the total restaked amount
  mevCommitValidators.totalRestaked = mevCommitValidators.totalRestaked.minus(
    DEFAULT_RESTAKED_AMOUNT
  );
  mevCommitValidators.save();
}

export function handleOperatorRegistered(event: OperatorRegistered): void {
  let operator = Operator.load(event.params.operator.toHex());
  if (operator == null) {
    operator = new Operator(event.params.operator.toHex());
    operator.operatorAddress = event.params.operator;
    operator.created = event.block.timestamp;
    operator.status = 'Registered';
  }
}

export function handleOperatorDeregistered(event: OperatorDeregistered): void {
  let operator = Operator.load(event.params.operator.toHex());
  if (operator != null) {
    operator.status = 'Deregistered';
    operator.save();
  }
}

export function handleOperatorDeregistrationRequested(
  event: OperatorDeregistrationRequested
): void {
  let operator = Operator.load(event.params.operator.toHex());
  if (operator != null) {
    operator.status = 'DeregistrationRequested';
    operator.save();
  }
}
