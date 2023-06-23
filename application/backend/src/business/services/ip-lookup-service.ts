import { ElsaSettings } from "../../config/elsa-settings";
import { inject, injectable } from "tsyringe";
import { Logger } from "pino";
import maxmind, { CityResponse, Reader } from "maxmind";

export type LocationType = {
  country?: string;
  city?: string;
  region?: string;
};

@injectable()
export class IPLookupService {
  private maxMindReader: Reader<CityResponse> | undefined = undefined;
  constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Logger") private readonly logger: Logger
  ) {}

  /**
   * Setup (Load) the MaxMind City Database.
   */
  public async setup() {
    const maxMindDbPath = this.settings.ipLookup?.maxMindDbPath;
    if (maxMindDbPath) {
      try {
        this.maxMindReader = await maxmind.open<CityResponse>(maxMindDbPath);
      } catch (error) {
        this.logger.warn(
          `The configured MaxMind Database (${maxMindDbPath}) does not contain a readable MaxMind Database, therefore, it will not perform IP lookup.`
        );
      }
    }
  }

  public getLocationByIp(ipAddress: string): LocationType | undefined {
    if (this.maxMindReader) {
      const ipInfo = this.maxMindReader.get(ipAddress);

      const city = ipInfo?.city?.names.en;
      const country = ipInfo?.country?.names.en;
      const region = ipInfo?.country?.iso_code;

      if (city || country) {
        return { country, city, region };
      }
    }
  }
}
