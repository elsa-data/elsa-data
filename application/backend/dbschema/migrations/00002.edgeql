CREATE MIGRATION m1bizzba2fn6sie6eym2jep54a67lumiezkhsbpq4wg5gvh6lnjrwa
    ONTO m1h7stuitcbnttllrpusnxes2yqxk3jinfelrcunilohbfvb2usbva
{
  ALTER TYPE release::DataEgressRecord {
      ALTER PROPERTY sourceLocation {
          SET TYPE std::json USING (SELECT
              <std::json>{}
          );
      };
  };
};
