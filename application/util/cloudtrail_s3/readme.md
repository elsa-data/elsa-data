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