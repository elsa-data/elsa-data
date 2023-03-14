CREATE MIGRATION m1mrhqsxx3xhzyo22ypmtawrm6dhpevma6slc2zlvghlt5xxsa6z2a
    ONTO m1yrv6po5y2ojpm3npcnbqf6ody3nsrs6wtvxusc7b5q3kjmjidypq
{
  ALTER TYPE permission::User {
      DROP PROPERTY isAllowedChangeReleaseDataOwner;
  };
};
