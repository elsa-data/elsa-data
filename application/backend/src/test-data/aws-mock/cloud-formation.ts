import { mockClient } from "aws-sdk-client-mock";
import {
  CloudFormationClient,
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
  DescribeStacksOutput,
  StackStatus,
} from "@aws-sdk/client-cloudformation";
import { util } from "protobufjs";

export const MOCK_INSTALLED_STACK_ID = "423906456904604";

let isInstalled = false;

const TIMES_TO_FAKE = 3;

let currentCount = 0;

export function createMockCloudFormation() {
  const cloudFormationClientMock = mockClient(CloudFormationClient);

  // when install is called we want to put us into the installed state - but with a count
  // of X until the stack is "ready"
  cloudFormationClientMock.on(CreateStackCommand).callsFake(() => {
    currentCount = 0;
    isInstalled = true;

    return {
      StackId: MOCK_INSTALLED_STACK_ID,
    };
  });

  cloudFormationClientMock.on(DeleteStackCommand).callsFake(() => {
    currentCount = 0;
    isInstalled = false;

    return {
      StackId: MOCK_INSTALLED_STACK_ID,
    };
  });

  cloudFormationClientMock.on(DescribeStacksCommand).callsFake(() => {
    console.log("mock:DescribeStacksCommand");
    if (isInstalled) {
      // we want to allow some fake attempts to simulate the time it takes to install
      currentCount++;

      return {
        Stacks: [
          {
            StackId: MOCK_INSTALLED_STACK_ID,
            StackStatus:
              currentCount >= TIMES_TO_FAKE
                ? StackStatus.CREATE_COMPLETE
                : StackStatus.CREATE_IN_PROGRESS,
          },
        ],
      } as DescribeStacksOutput;
    } else throw new Error("No stack of that name");
  });

  return cloudFormationClientMock;
}
