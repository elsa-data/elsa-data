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
  <div className="flex items-center gap-2">
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

export const ObjectSigningForm: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  return (
    <form action={`/api/releases/${releaseKey}/tsv-manifest`} method="POST">
      <CSRFInputToken />
      <div className="flex flex-col gap-6">
        <article className="prose">
          <p>
            This allows you to download an encrypted zip file containing a TSV
            file. The TSV file contains one column holding signed object URLS -
            URLs that allow you to directly download the given genomic file.
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
