import React from "react";
import { TsvDownloadDiv } from "./tsv-download-div";
import { ReleaseTypeLocal } from "../../shared-types";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
  htsgetUrl: string;
};

/**
 * A form that displays details of accessing the data via htsget, assuming
 * that has been enabled.
 *
 * @param releaseKey
 * @param releaseData
 * @param htsgetUrl
 * @constructor
 */
export const HtsgetForm: React.FC<Props> = ({
  releaseKey,
  releaseData,
  htsgetUrl,
}) => {
  return (
    <>
      <article className="prose-sm">
        <p>
          Genomic data can be accessed through the use of the{" "}
          <code>htsget</code> protocol.
        </p>
        <p>
          The <code>htsget</code> endpoint below will need to be presented with
          a valid authentication corresponding to this release.
        </p>
        <p>
          <code>{htsgetUrl}</code>
        </p>
      </article>

      <div className="divider"></div>

      <TsvDownloadDiv
        actionUrl={`/api/releases/${releaseKey}/tsv-manifest-htsget`}
        releaseActivated={!!releaseData.activation}
        fieldsToExclude={[]}
      />
    </>
  );
};
