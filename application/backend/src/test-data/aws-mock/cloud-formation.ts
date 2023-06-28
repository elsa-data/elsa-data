import { mockClient } from "aws-sdk-client-mock";
import * as edgedb from "edgedb";
import {
  CloudFormationClient,
  CreateStackCommand,
  CreateStackCommandInput,
  CreateStackCommandOutput,
  DeleteStackCommand,
  DeleteStackCommandInput,
  DescribeStacksCommand,
  DescribeStacksCommandInput,
  DescribeStacksCommandOutput,
  StackStatus,
} from "@aws-sdk/client-cloudformation";
import {
  deleteCloudFormationStack,
  describeCloudFormationStacks,
  installCloudFormationStack,
} from "../../../dbschema/queries";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "pino";

/**
 * A mock client for cloud formation stacks.
 *
 * This goes beyond most mocks and actually records state in a database table.
 *
 * This is because CloudFormation calls are coming from different NodeJs workers
 * that cannot otherwise share state.
 *
 * @param dbClient
 * @param logger
 */
export function createMockCloudFormation(
  dbClient: edgedb.Client,
  logger: Logger
) {
  const cloudFormationClientMock = mockClient(CloudFormationClient);

  // when install is called we want to put us into the installed state - but with a count
  // of X until the stack is "ready"
  cloudFormationClientMock
    .on(CreateStackCommand)
    .callsFake(async (input: CreateStackCommandInput) => {
      logger.debug(input, "mock:CreateStackCommand");

      const stackId = `arn:aws:cloudformation:ap-southeast-2:123456789012:stack/blah/${uuidv4()}`;

      await installCloudFormationStack(dbClient, {
        stackName: input.StackName!,
        stackId: stackId,
      });

      const output: CreateStackCommandOutput = {
        $metadata: {
          httpStatusCode: 200,
        },
        StackId: stackId,
      };

      logger.debug(output, "mock:CreateStackCommand");

      return output;
    });

  cloudFormationClientMock
    .on(DeleteStackCommand)
    .callsFake(async (input: DeleteStackCommandInput) => {
      logger.debug(input, "mock:DeleteStackCommand");

      const deleted = await deleteCloudFormationStack(dbClient, {
        stackName: input.StackName!,
      });

      return {
        StackId: deleted?.stackId!,
      };
    });

  cloudFormationClientMock
    .on(DescribeStacksCommand)
    .callsFake(async (input: DescribeStacksCommandInput) => {
      logger.debug(input, "mock:DescribeStacksCommand");

      const stacks = await describeCloudFormationStacks(dbClient);

      const output: DescribeStacksCommandOutput = {
        $metadata: {
          httpStatusCode: 200,
        },
        Stacks: stacks
          .filter((s) =>
            // if they asked for a specific stackname return just it - otherwise return all
            input.StackName ? s.stackName === input.StackName : true
          )
          .map((s) => ({
            StackId: s.stackId,
            StackStatus: StackStatus.CREATE_COMPLETE,
            StackName: s.stackName,
            CreationTime: new Date(),
            //  : StackStatus.CREATE_IN_PROGRESS,
          })),
      };

      logger.debug(output, "mock:DescribeStacksCommand");

      return output;
    });

  return cloudFormationClientMock;
}
