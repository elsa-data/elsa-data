export abstract class ProviderBase {
  /**
   * Get the config associated with the provider.
   */
  public abstract getConfig(): Promise<any>;
}
