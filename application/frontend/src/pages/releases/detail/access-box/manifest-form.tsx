import { CSRFInputToken } from "../../../../components/csrf-token";
import { TsvColumnCheck } from "../../../../components/access-box";
import { ReleaseTypeLocal } from "../../shared-types";
import { ObjectStoreRecordKey } from "@umccr/elsa-types/schemas";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const ManifestForm: React.FC<Props> = ({ releaseKey, releaseData }) => {
  return (
    <form
      action={`/api/releases/${releaseKey}/tsv-manifest-plaintext`}
      method="POST"
    >
      <CSRFInputToken />
      <div className="flex flex-col gap-6">
        <article className="prose">
          <p>
            The manifest contains all the files accessible within this release.
            It's provided as a TSV file.
          </p>
          <p>
            Downloading the manifest does not automatically provide access to
            files in this release. Access must be provided by by an
            administrator.
          </p>
        </article>

        {ObjectStoreRecordKey.filter(
          (field) => field != "objectStoreSigned"
        ).map((field, i) => (
          <TsvColumnCheck key={i} field={field} />
        ))}

        <div className="prose">
          <input
            type="submit"
            disabled={!releaseData.activation}
            className="btn-normal mt-4"
            value={
              "Download TSV" +
              (!releaseData.activation ? " (Release Must Be Active)" : "")
            }
          />
        </div>
      </div>
    </form>
  );
};
