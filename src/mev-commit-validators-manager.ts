import { BigInt } from '@graphprotocol/graph-ts';
import { MevCommitValidators } from '../generated/schema';

const MEV_COMMIT_VALIDATORS_ID = 'mevCommitValidators';
// This is the default amount of ETH that a validator is restaked with
// TODO: This should be looked up from the contract in the future
const DEFAULT_RESTAKED_AMOUNT = BigInt.fromI32(32).times(
  BigInt.fromI32(10).pow(18)
); // 32 ETH

export function loadOrCreateMevCommitValidators(): MevCommitValidators {
  let mevCommitValidators = MevCommitValidators.load(MEV_COMMIT_VALIDATORS_ID);
  if (mevCommitValidators == null) {
    mevCommitValidators = new MevCommitValidators(MEV_COMMIT_VALIDATORS_ID);
    mevCommitValidators.totalOptedIn = BigInt.fromI32(0);
    mevCommitValidators.totalStaked = BigInt.fromI32(0);
    mevCommitValidators.totalRestaked = BigInt.fromI32(0);
  }
  return mevCommitValidators;
}

class MevCommitValidatorsManager {
  private mevCommitValidators: MevCommitValidators;

  constructor() {
    this.mevCommitValidators = loadOrCreateMevCommitValidators();
  }

  // If the type is restaker, we add the default amount of ETH that a validator is restaked with
  addValidator(type: 'restaker'): void;
  // If the type is staker, we add the amount of ETH that the validator staked with
  addValidator(type: 'staker', amount: BigInt): void;

  /**
   * Adds a validator to the MEV Commit Validators and updates the total restaked or staked amounts
   * @param type - The type of validator to add
   * @param amount - The amount of ETH to add
   */
  addValidator(type: 'restaker' | 'staker', amount?: BigInt): void {
    if (type === 'restaker') {
      this.mevCommitValidators.totalRestaked = this.mevCommitValidators.totalRestaked.plus(
        DEFAULT_RESTAKED_AMOUNT
      );
    } else if (type === 'staker' && amount) {
      this.mevCommitValidators.totalStaked = this.mevCommitValidators.totalStaked.plus(
        amount
      );
    } else {
      throw new Error('Amount must be provided for staker type');
    }
    this.mevCommitValidators.totalOptedIn = this.mevCommitValidators.totalOptedIn.plus(
      BigInt.fromI32(1)
    );
    this.mevCommitValidators.save();
  }

  // If the type is restaker, we remove the default amount of ETH that a validator is restaked with
  removeValidator(type: 'restaker'): void;
  // If the type is staker, we remove the amount of ETH that the validator is staked with
  removeValidator(type: 'staker', amount: BigInt): void;

  /**
   * Removes a validator from the MEV Commit Validators and updates the total restaked or staked amounts
   * @param type - The type of validator to remove
   * @param amount - The amount of ETH to remove
   */
  removeValidator(type: 'restaker' | 'staker', amount?: BigInt): void {
    if (type === 'restaker') {
      this.mevCommitValidators.totalRestaked = this.mevCommitValidators.totalRestaked.minus(
        DEFAULT_RESTAKED_AMOUNT
      );
    } else if (type === 'staker' && amount) {
      this.mevCommitValidators.totalStaked = this.mevCommitValidators.totalStaked.minus(
        amount
      );
    } else {
      throw new Error('Amount must be provided for staker type');
    }
    this.mevCommitValidators.totalOptedIn = this.mevCommitValidators.totalOptedIn.minus(
      BigInt.fromI32(1)
    );
    this.mevCommitValidators.save();
  }
}
