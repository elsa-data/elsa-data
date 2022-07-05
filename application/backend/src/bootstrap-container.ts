import * as edgedb from "edgedb";
import { container } from "tsyringe";

export function registerTypes() {
  container.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });
}
