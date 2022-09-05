# CloudTrail Lake S3 logs

This will query cloudTrailLake and S3 object api to see if object is being accessed. The resource setup is still being manually via console.

Temporarly would fill up the `CONST_PARAMETER` near the bottom of `src/main.ts` to get the parameter needed.

Parameter

```json
eventDataStoreId: string;
awsAccessKeyId: string;
s3KeyObject?: string;
startTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 22:00:00.000' */;
endTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 23:00:00.000' */;
```

To install

```
npm i
```

To run

```
npm run run_main
```

# Infrastructure

In order to run the query, CloudTrail Lake should be deployed into the AWS account to listen any get event from AWS S3. There is a cdk in the `infrastructure` folder to deploy the CloudTrail events based on the give S3 ARN. This will store S3 event at cloudTrail lake for 7 years.

At the `infrastructure/bin/infrastructure.ts` configure/replace bucketArn with the prefix to the data. (e.g. `arn:aws:s3:::example/store/`)

Deploy it by

```bash
npm run cdk-deploy
```

Take note of the ARN given out from deploy
