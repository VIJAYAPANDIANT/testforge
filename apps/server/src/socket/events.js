/**
 * Centralized Socket.IO Event Name Constants
 */
export const SOCKET_EVENTS = {
  RUN_QUEUED: 'run:queued',
  RUN_STARTED: 'run:started',
  STEP_STARTED: 'step:started',
  STEP_PASSED: 'step:passed',
  STEP_FAILED: 'step:failed',
  RUN_COMPLETED: 'run:completed',
  RUN_FAILED: 'run:failed',
  JOIN_RUN: 'join:run',
  LEAVE_RUN: 'leave:run',
};
