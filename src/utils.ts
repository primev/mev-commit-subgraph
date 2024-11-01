import { Address, BigInt } from '@graphprotocol/graph-ts';
import { EigenPod, MevCommitValidators, Restaker } from '../generated/schema';
import { EigenPodManager } from '../generated/DelegationManager/EigenPodManager';
import { EIGENPOD_MANAGER_ADDRESS } from './constants';

const MEV_COMMIT_VALIDATORS_ID = 'mevCommitValidators';

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

export function createOrLoadEigenPod(
  podOwner: Address,
  restaker: Restaker
): EigenPod {
  // Get the pod contract address given the pod owner address
  const eigenpodManager = EigenPodManager.bind(EIGENPOD_MANAGER_ADDRESS);
  const podAddress = eigenpodManager.getPod(podOwner);

  let eigenpod = EigenPod.load(podAddress.toHex());

  if (!eigenpod) {
    eigenpod = new EigenPod(podAddress.toHex());
    eigenpod.podOwner = podOwner;
    eigenpod.podContractAddress = podAddress;
    eigenpod.restaker = restaker.id;
  }

  return eigenpod;
}

export function max(a: BigInt, b: BigInt): BigInt {
  return BigInt.compare(a, b) >= 0 ? a : b;
}
