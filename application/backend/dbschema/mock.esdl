module mock {

    # The mock tables help out with storing mock state when we emulate cloud services.
    # For instance - it might store a boolean state of "cloudformation stack installed".
    # The mock AWS clients will then change their behaviour based
    # the presence of this state

    type AwsCloudFormationStack {
        required property stackName -> str {
           constraint exclusive;
       }
        required property stackId -> str {
             constraint exclusive;
         }
        required property installedDateTime -> datetime;
    }

}
