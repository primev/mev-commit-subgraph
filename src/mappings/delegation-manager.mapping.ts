import {
  StakerDelegated,
  StakerUndelegated,
} from '../../generated/DelegationManager/DelegationManager';
import { Operator, Restaker } from '../../generated/schema';
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

  let restaker = Restaker.load(event.params.staker.toHex());
  if (restaker == null) {
    restaker = new Restaker(event.params.staker.toHex());
    restaker.created = event.block.timestamp;
    restaker.save();
  }

  // Get the eigen pod address given the staker aka the pod owner
  const eigenpod = createOrLoadEigenPod(event.params.staker, restaker);

  // Set the operator for the eigenpod
  eigenpod.operator = operator.id;
  eigenpod.save();
}

export function handleStakerUndelegated(event: StakerUndelegated): void {
  let operatorAddress = event.params.operator.toHex();

  let operator = Operator.load(operatorAddress);
  if (operator == null) {
    operator = new Operator(operatorAddress);
    operator.operatorAddress = event.params.operator;
    operator.created = event.block.timestamp;
  }
  operator.save();

  let restaker = Restaker.load(event.params.staker.toHex());
  if (restaker == null) {
    restaker = new Restaker(event.params.staker.toHex());
    restaker.created = event.block.timestamp;
    restaker.save();
  }

  // Get the eigen pod address given the staker aka the pod owner
  const eigenpod = createOrLoadEigenPod(event.params.staker, restaker);

  // Set the operator for the eigenpod
  eigenpod.operator = null;
  eigenpod.save();
}
