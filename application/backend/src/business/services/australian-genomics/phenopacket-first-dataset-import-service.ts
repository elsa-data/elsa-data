import { S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { DatasetService } from "../dataset-service";
import phenopackets from "../../../generated/phenopackets";
import { Logger } from "pino";
import { UserData } from "../../data/user-data";
import { readdir, readFile } from "fs/promises";
import { createHash } from "crypto";
import { resolve } from "path";

type PhenopacketIndividiual =
  phenopackets.org.phenopackets.schema.v2.IPhenopacket;
type PhenopacketFamily = phenopackets.org.phenopackets.schema.v2.IFamily;
type PhenopacketCohort = phenopackets.org.phenopackets.schema.v2.ICohort;

class PhenopacketFirstObjects {
  constructor(public readonly batches: PhenopacketFirstSubmissionBatch[]) {}
}

class PhenopacketFirstSubmissionBatch {
  constructor(
    public readonly prefix: string,
    public readonly objects: PhenopacketFirstObject[],
    public readonly md5sums: string
  ) {}
}

class PhenopacketFirstObject {
  public readonly size?: number;
  public readonly name?: string;
}

class PhenopacketFirstFileObject extends PhenopacketFirstObject {
  public readonly fileSystemPath?: string;
}

class PhenopacketFirstS3Object extends PhenopacketFirstObject {
  public readonly s3Bucket?: string;
  public readonly s3Key?: string;
}

@injectable()
export class PhenopacketFirstDatasetImportService {
  constructor(
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Logger") private readonly logger: Logger,
    @inject(DatasetService) private readonly datasetService: DatasetService,
    @inject(UserData) private readonly userData: UserData
  ) {}

  public async createObjectsFromFiles(directoryRoot: string) {
    const absoluteDirectoryRoot = resolve(directoryRoot);

    // the immediate subdirectories of the root are the submission batches
    const items = await readdir(absoluteDirectoryRoot, { withFileTypes: true });

    const batches: PhenopacketFirstSubmissionBatch[] = [];

    for (const item of items) {
      const prefix = item.name;
      const { files, sums } = await this.getFileEntriesWithContent(
        `${absoluteDirectoryRoot}/${item.name}`
      );

      // only use submission batches that have content
      if (files && files.length > 0)
        batches.push(
          new PhenopacketFirstSubmissionBatch(prefix, files, sums.toString())
        );
    }

    const o = new PhenopacketFirstObjects(batches);

    console.log(JSON.stringify(o, null, 2));
  }

  /**
   * Recursively build a return array containing the *complete*
   * content of the given directory - including file content
   * and checksums of content.
   *
   * @param dirName the root folder path (should be absolute probably)
   */
  private async getFileEntriesWithContent(
    dirName: string
  ): Promise<{ files: PhenopacketFirstFileObject[]; sums: Buffer }> {
    let files: PhenopacketFirstFileObject[] = [];
    let sums: Buffer | undefined;

    const items = await readdir(dirName, { withFileTypes: true });

    for (const item of items) {
      const fullItemPath = `${dirName}/${item.name}`;

      if (item.isDirectory()) {
        throw new Error(
          "Currently we only support one level of file content in each submission batch"
        );
        //files = [
        //  ...files,
        //  ...(await this.getFileEntriesWithContent(fullItemPath)),
        //];
      } else {
        if (item.name.toLowerCase() === "md5sums.txt") {
          if (sums)
            throw new Error(
              "Found multiple files purporting to be the submission checksum content"
            );

          sums = await readFile(fullItemPath, {});
        }

        // let hash = createHash("md5").update(content).digest("hex");

        files.push({
          name: item.name,
          size: 0, //content.length,
          fileSystemPath: `${dirName}/${item.name}`,
        });
      }
    }

    if (!sums && files.length === 0)
      return { files: [], sums: Buffer.alloc(0) };

    if (!sums) throw new Error("No MD5 sums file found in submission");

    return { files, sums };
  }
}
