CREATE MIGRATION m1k2lbbf5wm2doned3xkdtnbapq3st6rnfoobmbfotgmvihcsjduiq
    ONTO m1erthlyhfyzfhzvwkvycpcuopgwpbbpwyzxwydhvfhuigo7nnszpa
{
  ALTER TYPE release::Release {
      ALTER LINK activated {
          RENAME TO activation;
      };
  };
};
