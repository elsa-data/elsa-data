CREATE MIGRATION m1kam4c6otwvcv4io5ye3x3hf7hknqwdbv7tnrp2b2ienujrc6pj5a
    ONTO m17u5wr5453fimt7vkqsiekedfwybejyj3syjyjhqygvukrhaduw6a
{
  ALTER TYPE release::Release {
      CREATE PROPERTY lastDateTimeDataAccessLogQuery -> std::datetime;
  };
};
