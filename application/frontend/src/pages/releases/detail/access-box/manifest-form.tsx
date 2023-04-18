import { CSRFInputToken } from "../../../../components/csrf-token";
import { ReleaseTypeLocal } from "../../shared-types";
import { ObjectStoreRecordKey } from "@umccr/elsa-types/schemas";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

type TsvColumnCheckProps = {
  field: string;
};

const TsvColumnCheck: React.FC<TsvColumnCheckProps> = ({ field }) => (
  <div key={field} className="flex items-center gap-2">
    <input
      type="checkbox"
      className="checkbox"
      defaultChecked={true}
      name="presignHeader"
      id={`chx-${field}`}
      value={field}
    />
    <label className="uppercase" htmlFor={`chx-${field}`}>
      {field}
    </label>
  </div>
);

export const ManifestForm: React.FC<Props> = ({ releaseKey, releaseData }) => {
  return (
    <form
      action={`/api/releases/${releaseKey}/tsv-manifest`}
      method="POST"
      className="p-6"
    >
      <CSRFInputToken />
      <div className="flex flex-col gap-6">
        <article className="prose">
          <p>
            The manifest contains all the files accessible within this release.
            It's provided as a TSV file within a password-protected zip file.
          </p>
          <p>
            Downloading the manifest does not automatically provide access to
            files in this release. Access must be provided by activating the
            release and, if desired, by also using the tabs to the left.
          </p>
        </article>

        {ObjectStoreRecordKey.map((field, i) => (
          <TsvColumnCheck key={i} field={field} />
        ))}

        <div className="prose">
          <input
            type="submit"
            disabled={!releaseData.activation}
            className="btn-normal mt-4"
            value={
              "Download Zip" +
              (!releaseData.activation ? " (Release Must Be Active)" : "")
            }
          />
        </div>
      </div>
    </form>
  );
};
