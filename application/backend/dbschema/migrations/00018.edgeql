CREATE MIGRATION m1yrv6po5y2ojpm3npcnbqf6ody3nsrs6wtvxusc7b5q3kjmjidypq
    ONTO m1fdmb7aesr3wsko2bzjt74vd735exx3asniauaiye7tl6a6mak2wa
{
  ALTER TYPE permission::User {
      CREATE REQUIRED PROPERTY isAllowedViewAllReleases -> std::bool {
          SET default := false;
      };
  };
};
