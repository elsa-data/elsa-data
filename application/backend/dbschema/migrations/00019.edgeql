CREATE MIGRATION m1v4abs537ah5gus3ndpa3usluni455mxyk7qxjypvu5j6ett5iypq
    ONTO m1hy4gruokr3efblcplbldmrst7islgfx5sfloatuw27p3my32ce4a
{
  CREATE TYPE job::CopyOutJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsExecutionArn -> std::str;
  };
};
