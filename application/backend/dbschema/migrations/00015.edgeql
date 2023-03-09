CREATE MIGRATION m1w772xacqordjlwm3bj6yozqfveh2wzxu4aqfys2d6ed6tf54ouqq
    ONTO m1aghgd364dy5j2vhjlsddmaqhvszdwsfzbcxnwuvwsikszbn4x34q
{
  ALTER TYPE release::Release {
      ALTER PROPERTY releaseIdentifier {
          RENAME TO releaseKey;
      };
  };
};
