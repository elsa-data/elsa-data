import e from "../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import { Client } from "edgedb";
import { org } from "../../generated/phenopackets";
import { AuthenticatedUser } from "../authenticated-user";
import Phenopacket = org.phenopackets.schema.v2.Phenopacket;
import Sex = org.phenopackets.schema.v2.core.Sex;
import KaryotypicSex = org.phenopackets.schema.v2.core.KaryotypicSex;

@injectable()
export class PhenopacketsService {
  constructor(@inject("Database") private readonly edgeDbClient: Client) {}

  public async getPhenopacket(
    user: AuthenticatedUser,
    individualId: string,
  ): Promise<Uint8Array> {
    throw new Error("Not implemented");

    const patient = await e
      .select(e.dataset.DatasetPatient, (dp) => ({
        ...e.dataset.DatasetPatient["*"],
        specimens: {
          ...e.dataset.DatasetSpecimen["*"],
        },
        filter: e.op(dp.id, "=", e.uuid(individualId)),
      }))
      .run(this.edgeDbClient);

    let message = Phenopacket.create({
      id: "Hello",
      subject: { sex: Sex.MALE, karyotypicSex: KaryotypicSex.XY },
      biosamples: [
        {
          id: "XYZ",
          files: [
            {
              uri: "s3://foo/bar",
              fileAttributes: {
                genomeAssembly: "HG38",
              },
            },
          ],
        },
      ],
    });

    return Phenopacket.encode(message).finish();
    // let decoded = Phenopacket.decode(buffer);
  }
}
