import { StakerDelegated } from '../../generated/DelegationManager/DelegationManager';
import { EigenPodManager } from '../../generated/DelegationManager/EigenPodManager';
import { EigenPod, Operator } from '../../generated/schema';
import { EIGENPOD_MANAGER_ADDRESS } from '../constants';
import { createOrLoadEigenPod } from '../utils';

export function handleStakerDelegated(event: StakerDelegated): void {
  let operator = Operator.load(event.params.operator.toHex());

  // If the operator exists, then we can get the pod contract address and create or load the eigenpod
  // The operator will exist if it has been registered with the mev-commit-avs-v3 contract
  if (operator) {
    // Get the eigen pod address given the staker aka the pod owner
    const eigenpod = createOrLoadEigenPod(event.params.staker);

    // Set the operator for the eigenpod
    eigenpod.operator = operator.id;
    eigenpod.save();
  }
}
