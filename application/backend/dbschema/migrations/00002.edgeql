CREATE MIGRATION m1zj4fxy6zhqlqa3hpl7kipzliwagsuuayubzyrr5pwn5hwcpksmvq
    ONTO m1h7stuitcbnttllrpusnxes2yqxk3jinfelrcunilohbfvb2usbva
{
  ALTER TYPE dataset::DatasetPatient {
      ALTER LINK specimens {
          DROP CONSTRAINT std::exclusive;
      };
  };
};
