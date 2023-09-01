import { S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { DatasetService } from "../dataset-service";
import { org } from "../../../generated/phenopackets";
import { Logger } from "pino";
import { UserData } from "../../data/user-data";
import { readdir, readFile, stat } from "fs/promises";
import { resolve } from "path";
import { resolveContentToPhenopacket } from "./phenopacket-load-helper";
import { isUndefined } from "lodash";
import { ElsaSettings } from "../../../config/elsa-settings";

type IPhenopacketIndividiual = org.phenopackets.schema.v2.IPhenopacket;
type PhenopacketIndividiual = org.phenopackets.schema.v2.Phenopacket;

type IPhenopacketFamily = org.phenopackets.schema.v2.IFamily;
type PhenopacketFamily = org.phenopackets.schema.v2.Family;

// type PhenopacketCohort = phenopackets.org.phenopackets.schema.v2.ICohort;

class PhenopacketFirstObjects {
  constructor(public readonly batches: PhenopacketFirstSubmissionBatch[]) {}
}

/**
 * The phenopacket first Case represents all data we can derive from a phenopacket itself,
 * but also with accessors that will help us map/compare it to our Elsa Data records.
 */
class PhenopacketFirstCase {
  private readonly _caseId: string;
  private readonly _patientId: string;

  constructor(
    packet: PhenopacketIndividiual | PhenopacketFamily,
    resolved: { [name: string]: PhenopacketFirstObject }
  ) {
    // we search the phenopackets for files and record them here for validity checking
    const foundFiles: org.phenopackets.schema.v2.core.IFile[] = [];
    let foundCaseId: string | undefined;
    let foundPatientId: string | undefined;

    // all the files in a single phenopacket add to our found list
    const packetGatherFiles = (p: IPhenopacketIndividiual) => {
      // gather the files
      for (const f of p.files ?? []) foundFiles.push(f);

      for (const b of p.biosamples ?? []) {
        for (const f of b.files ?? []) foundFiles.push(f);
      }
    };

    if (packet instanceof org.phenopackets.schema.v2.Phenopacket) {
      packetGatherFiles(packet);

      // standard phenopackets become a singleton case - that is a patient id of the patient and an empty case
      if (!packet.subject)
        throw new Error(
          `Subject must be present in Phenopacket - content was ${JSON.stringify(
            packet.toJSON()
          )}`
        );
      if (!packet.subject.id)
        throw new Error("Subject::id must be present in Phenopacket");

      foundCaseId = "";
      foundPatientId = packet.subject.id;
    }

    if (packet instanceof org.phenopackets.schema.v2.Family) {
      // family phenopackets directly become a case of the whole family

      if (!packet.id)
        throw new Error("Id must be present in Family Phenopacket");

      foundCaseId = packet.id;
      foundPatientId = "";

      // gather the family files
      for (const f of packet.files ?? []) foundFiles.push(f);

      for (const p of packet.relatives ?? []) {
        packetGatherFiles(p);
      }
    }

    if (isUndefined(foundCaseId) || isUndefined(foundPatientId))
      throw new Error("Packet was not a Phenopacket or Family instance");

    this._caseId = foundCaseId;
    this._patientId = foundPatientId;

    for (const ff of foundFiles) {
      if (!ff.uri)
        throw new Error(
          `Phenopacket File with content ${JSON.stringify(ff)} had no URI field`
        );

      let fileName;
      if (ff.uri.startsWith("file://")) {
        fileName = ff.uri.slice(7);
      }
      if (ff.uri.startsWith("file:/")) {
        fileName = ff.uri.slice(6);
      }
      if (!fileName) fileName = ff.uri;

      if (!(fileName in resolved))
        throw new Error(`Could not resolve file ${fileName}`);
    }
  }

  public get caseId(): string {
    return this._caseId;
  }

  public get patientId(): string {
    return this._patientId;
  }
}

class PhenopacketFirstData {
  public readonly resolved: { [name: string]: PhenopacketFirstObject };
  public readonly deleted: { [name: string]: PhenopacketFirstObject };

  constructor(objs: PhenopacketFirstObjects) {
    this.resolved = {};
    this.deleted = {};

    const batchesOrdered = objs.batches.sort((a, b) =>
      a.prefix.localeCompare(b.prefix)
    );

    for (const batch of batchesOrdered) {
      const objectsOrdered = batch.objects.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      for (const object of objectsOrdered) {
        this.addToResolved(object);
      }
    }
  }

  private addToResolved(object: PhenopacketFirstObject) {
    // files can be deleted by adding a file of zero size
    if (object.size === 0) {
      if (object.name in this.resolved) {
        this.deleted[object.name] = object;
      } else {
        throw Error(
          `Attempt to delete file ${object.name} that has not been encountered previously`
        );
      }
    } else {
      if (object.name in this.deleted) {
        throw Error(
          `Attempt to reintroduce file ${object.name} that has previously been deleted - this is not currently allowed`
        );
      }

      this.resolved[object.name] = object;
    }
  }

  public async cases() {
    const cases: PhenopacketFirstCase[] = [];

    for (const [_, r] of Object.entries(this.resolved)) {
      if (r.content) {
        const packet = await resolveContentToPhenopacket(r.content);

        if (packet instanceof org.phenopackets.schema.v2.Cohort)
          throw new Error("Cohort phenopackets not supported");

        if (packet) {
          cases.push(new PhenopacketFirstCase(packet, this.resolved));
        }
      }
    }

    return cases;
  }
}

class PhenopacketFirstSubmissionBatch {
  constructor(
    public readonly prefix: string,
    public readonly objects: PhenopacketFirstObject[]
  ) {}
}

class PhenopacketFirstObject {
  public content?: Buffer;

  constructor(
    public readonly name: string,
    public readonly size: number,
    public readonly md5Checksum: string
  ) {}
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
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Logger") private readonly logger: Logger,
    @inject(DatasetService) private readonly datasetService: DatasetService,
    @inject(UserData) private readonly userData: UserData
  ) {}

  /**
   * Inspect a directory tree on local disk and return it as a set of
   * objects useful for our dataset loader.
   *
   * @param directoryRoot
   */
  public async createObjectsFromFiles(directoryRoot: string) {
    const absoluteDirectoryRoot = resolve(directoryRoot);

    // our model is that each set of files comes in via an immutable directory of objects
    const batches: PhenopacketFirstSubmissionBatch[] = [];

    // the immediate subdirectories of the root are the submission batches
    const items = await readdir(absoluteDirectoryRoot, { withFileTypes: true });

    for (const item of items) {
      const prefix = item.name;
      const files = await this.getFileEntriesWithContent(
        `${absoluteDirectoryRoot}/${item.name}`
      );

      // only use submission batches that have content
      if (files && files.length > 0)
        batches.push(new PhenopacketFirstSubmissionBatch(prefix, files));
    }

    return new PhenopacketFirstObjects(batches);
  }

  public async synchroniseIntoDataset(
    datasetUri: string,
    objects: PhenopacketFirstObjects
  ) {
    const o = new PhenopacketFirstData(objects);

    const cases = await o.cases();

    // console.log(JSON.stringify(cases));
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
  ): Promise<PhenopacketFirstFileObject[]> {
    const MD5SUMS = "md5sums.txt";

    const items = await readdir(dirName, { withFileTypes: true });

    // if there are no files then abort early - we obviously don't need to require a checksums file to be present
    // and the rest of this routine does lots of md5Checksum stuff
    if (items.length === 0) return [];

    let sums: { [fileName: string]: string } | undefined = undefined;

    // find and decode the checksums file first
    for (const item of items) {
      const fullItemPath = `${dirName}/${item.name}`;

      // TODO extend this entire mechanism to support SHA sums as well
      if (item.name.toLowerCase() === MD5SUMS) {
        if (sums)
          throw new Error(
            "Found multiple files purporting to be the submission md5Checksum content"
          );

        // TODO check how md5sum works on filenames with extended character sets (does it UTF8 them?)
        const sumsContent = await readFile(fullItemPath, { encoding: "ascii" });

        sums = this.md5SumsToObject(sumsContent);
      }
    }

    if (!sums)
      throw new Error(`No MD5 sums file found in submission folder ${dirName}`);

    let files: PhenopacketFirstFileObject[] = [];

    for (const item of items) {
      const fullItemPath = `${dirName}/${item.name}`;

      if (item.isDirectory()) {
        throw new Error(
          "Currently we only support one level of file content in each submission folder"
        );
        //files = [
        //  ...files,
        //  ...(await this.getFileEntriesWithContent(fullItemPath)),
        //];
      } else {
        // whilst the md5 itself *can* appear in its own file - it cannot by definition be correct
        // anyhow - we are happy either way - so we skip it here
        if (item.name.toLowerCase() === MD5SUMS) {
          continue;
        }

        if (!(item.name in sums))
          throw new Error(
            `File ${item.name} was not present in the ${MD5SUMS}`
          );

        // we can calculate hashes I guess - but we really can't do it for a 100GB BAM file.. maybe we
        // should be loading *small* content - and checksumming that?
        // let hash = createHash("md5").update(content).digest("hex");
        // TODO sort this out
        const stats = await stat(fullItemPath);

        const f: PhenopacketFirstFileObject = {
          name: item.name,
          size: stats.size,
          md5Checksum: sums[item.name],
          fileSystemPath: `${dirName}/${item.name}`,
        };

        if (stats.size < 128 * 1024) f.content = await readFile(fullItemPath);

        files.push(f);
      }
    }

    return files;
  }

  private md5SumsToObject(content: string) {
    // For each file, ‘md5sum’ outputs by default, the MD5 md5Checksum,
    // a space, a flag indicating binary or text input mode, and the
    // file name. Binary mode is indicated with ‘*’, text mode
    // with ‘ ’ (space). Binary mode is the default on systems where
    // it’s significant, otherwise text mode is the default.
    let sums: { [file: string]: string } = {};

    for (const line of content.split("\n")) {
      if (line.startsWith("\\")) {
        // TODO we could support this but no need unless this is actually encountered (which is doubtful)
        // Without --zero, if file contains a backslash, newline,
        // or carriage return, the line is started with a backslash, and
        // each problematic character in the file name is escaped
        // with a backslash, making the output unambiguous
        // even in the presence of arbitrary file names.
        throw new Error("We do not support md5sums with escaped file names");
      }

      const checksum = line.slice(0, 32);

      // TODO check the md5Checksum is valid - NOT that the content matches - just literally does it match the
      // definition for an md5 sum?

      const file = line.slice(34);

      // we ignore the type - should we?? (will be either space or *)
      const t = line.slice(33, 34);

      sums[file] = checksum;
    }

    return sums;
  }
}
