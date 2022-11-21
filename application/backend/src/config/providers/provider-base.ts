import { set } from "lodash";

export abstract class ProviderBase {
  /**
   * Convert a flat object to a nested object that is compatible with convict.
   */
  protected static nestObject<T>(o: { [p: string]: T } | ArrayLike<T>): {} {
    return Object.entries(o).reduce(
      (o, entry) => set(o, entry[0], entry[1]),
      {}
    );
  }

  /**
   * Get the config associated with the provider.
   */
  public abstract getConfig(): Promise<any>;
}
