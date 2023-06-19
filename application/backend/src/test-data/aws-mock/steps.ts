import { mockClient } from "aws-sdk-client-mock";
import {
  DescribeExecutionCommand,
  DescribeMapRunCommand,
  ExecutionStatus,
  ListMapRunsCommand,
  SFNClient,
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";

export const MOCK_COPY_OUT_STEPS_ARN =
  "arn:aws:states:ap-southeast-2:000000000000:stateMachine:CopyOutStateMachineAABBCCDD-qUZhBYCuZY8X";
export const MOCK_COPY_OUT_STEPS_EXECUTION_ARN =
  "arn:aws:states:ap-southeast-2:000000000000:execution:CopyOutStateMachineAABBCCDD-qUZhBYCuZY8X:ABCD";

export const MOCK_COPY_OUT_STEPS_MAP_RUN_ARN =
  "arn:aws:states:ap-southeast-2:000000000000:mapRun:CopyOutStateMachineAABBCCDD-qUZhBYCuZY8X/31ff75de-705d-3d78-9cbb-7fdf11d77b7f:bc47d878-fba6-3125-9eef-c0a897c09309";

const TIMES_TO_FAKE = 3;

let currentCount = 0;

export function createMockSteps() {
  const stepsClientMock = mockClient(SFNClient);

  stepsClientMock
    .on(StartExecutionCommand, {
      stateMachineArn: MOCK_COPY_OUT_STEPS_ARN,
    })
    .callsFake(() => {
      currentCount = 0;
      return {
        executionArn: MOCK_COPY_OUT_STEPS_EXECUTION_ARN,
      };
    });

  stepsClientMock
    .on(DescribeExecutionCommand, {
      executionArn: MOCK_COPY_OUT_STEPS_EXECUTION_ARN,
    })
    .callsFake(() => {
      console.log(currentCount);
      currentCount++;
      return {
        executionArn: MOCK_COPY_OUT_STEPS_EXECUTION_ARN,
        stateMachineArn: MOCK_COPY_OUT_STEPS_ARN,
        status:
          currentCount >= TIMES_TO_FAKE
            ? ExecutionStatus.SUCCEEDED
            : ExecutionStatus.RUNNING,
      };
    });

  stepsClientMock
    .on(ListMapRunsCommand, {
      executionArn: MOCK_COPY_OUT_STEPS_EXECUTION_ARN,
    })
    .resolves({
      mapRuns: [
        {
          mapRunArn: MOCK_COPY_OUT_STEPS_MAP_RUN_ARN,
          executionArn: MOCK_COPY_OUT_STEPS_EXECUTION_ARN,
          stateMachineArn: MOCK_COPY_OUT_STEPS_ARN,
          startDate: new Date(),
          stopDate: new Date(),
        },
      ],
    });

  stepsClientMock
    .on(DescribeMapRunCommand, {
      mapRunArn: MOCK_COPY_OUT_STEPS_MAP_RUN_ARN,
    })
    .callsFake(() => {
      return {
        itemCounts: {
          failed: 0,
          succeeded: currentCount * 10,
          aborted: 0,
          timedOut: 0,
          total: TIMES_TO_FAKE * 10,
        },
      };
    });

  return stepsClientMock;
}
