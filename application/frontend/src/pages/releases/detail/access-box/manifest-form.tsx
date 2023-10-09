import React from "react";
import { ReleaseTypeLocal } from "../../shared-types";
import { TsvDownloadDiv } from "./tsv-download-div";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const ManifestForm: React.FC<Props> = ({ releaseKey, releaseData }) => {
  return (
    <>
      <article className="prose-sm">
        <p>
          This manifest contains basic details of all cases, patients and
          specimens accessible in this release. This manifest does not provide
          any access to actual genomic data.
        </p>
      </article>

      <div className="divider"></div>

      <TsvDownloadDiv
        actionUrl={`/api/releases/${releaseKey}/tsv-manifest-plaintext`}
        releaseActivated={!!releaseData.activation}
        fieldsToExclude={[
          "objectStoreSigned",
          "objectStoreBucket",
          "objectStoreKey",
          "objectStoreUrl",
        ]}
      />
    </>
  );
};
