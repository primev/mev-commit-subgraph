import { StakerDelegated } from '../../generated/DelegationManager/DelegationManager';
import { Operator } from '../../generated/schema';
import { createOrLoadEigenPod } from '../utils';

export function handleStakerDelegated(event: StakerDelegated): void {
  let operatorAddress = event.params.operator.toHex();

  let operator = Operator.load(operatorAddress);
  if (operator == null) {
    operator = new Operator(operatorAddress);
    operator.operatorAddress = event.params.operator;
    operator.created = event.block.timestamp;
    operator.status = 'Unregistered';
  }
  operator.save();

  // If the operator exists, then we can get the pod contract address and create or load the eigenpod
  // The operator will exist if it has been registered with the mev-commit-avs-v3 contract
  if (operator) {
    // Get the eigen pod address given the staker aka the pod owner
    const eigenpod = createOrLoadEigenPod(event.params.staker);

    // Set the operator for the eigenpod
    eigenpod.operator = operatorAddress;
    eigenpod.save();
  }
}
