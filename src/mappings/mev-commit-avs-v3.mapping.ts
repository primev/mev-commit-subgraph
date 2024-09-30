import { BigInt } from '@graphprotocol/graph-ts';
import { Operator, Restaker, RestakerValidator } from '../../generated/schema';
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
  max,
} from '../utils';

// This is the default amount of ETH that a validator is restaked with
// TODO: This should be looked up from the contract in the future
const DEFAULT_RESTAKED_AMOUNT = BigInt.fromI32(32).times(
  BigInt.fromI32(10).pow(18)
); // 32 ETH

// Helper function to load or create Restaker entity
function loadOrCreateRestakerValidator(
  event: ValidatorRegistered
): RestakerValidator {
  let validatorBLSKey = event.params.validatorPubKey.toHex();
  let restakerValidator = RestakerValidator.load(validatorBLSKey);

  if (restakerValidator == null) {
    restakerValidator = new RestakerValidator(validatorBLSKey);
    restakerValidator.validatorBLSKey = validatorBLSKey;
    restakerValidator.status = 'Registered';
    restakerValidator.stakeAmount = DEFAULT_RESTAKED_AMOUNT;
    restakerValidator.stakedAt = event.block.timestamp;
    restakerValidator.restaker = event.params.podOwner.toHex();
  }
  return restakerValidator;
}

/**
 * Handler for ValidatorRegistered event
 * when a validator is registered, we update the total restaked amount and the total opted in count
 * since the validator is now opted in to the MEV Commit network
 * @param event
 */
export function handleValidatorRegistered(event: ValidatorRegistered): void {
  let restakerAddress = event.params.podOwner.toHex();

  let restaker = Restaker.load(restakerAddress);
  if (restaker == null) {
    restaker = new Restaker(restakerAddress);
    restaker.created = event.block.timestamp;
    restaker.save();
  }

  const eigenpod = createOrLoadEigenPod(event.params.podOwner);
  eigenpod.save();

  let restakerValidator = loadOrCreateRestakerValidator(event);
  restakerValidator.save();

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
  let restakerValidator = RestakerValidator.load(
    event.params.validatorPubKey.toHex()
  );
  if (restakerValidator != null) {
    restakerValidator.status = 'Deregistered';
    restakerValidator.save();
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
  let restakerValidator = RestakerValidator.load(
    event.params.validatorPubKey.toHex()
  );
  if (restakerValidator != null) {
    restakerValidator.status = 'DeregistrationRequested';
    restakerValidator.save();
  }

  let mevCommitValidators = loadOrCreateMevCommitValidators();

  // Use max function to ensure totalOptedIn and totalRestaked don't go below 0
  mevCommitValidators.totalOptedIn = max(
    mevCommitValidators.totalOptedIn.minus(BigInt.fromI32(1)),
    BigInt.fromI32(0)
  );

  mevCommitValidators.totalRestaked = max(
    mevCommitValidators.totalRestaked.minus(DEFAULT_RESTAKED_AMOUNT),
    BigInt.fromI32(0)
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
  operator.save();
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
