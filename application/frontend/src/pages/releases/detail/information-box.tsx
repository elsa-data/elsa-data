import React from "react";
import { Box } from "../../../components/boxes";
import { ReleaseTypeLocal } from "./shared-types";
import ReactMarkdown from "react-markdown";
import classNames from "classnames";
import remarkGfm from "remark-gfm";

type Props = {
  releaseId: string;
  releaseData: ReleaseTypeLocal;
};

/*
Sample usage of Linugi for restoring at some point.
import { Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
  const { i18n } = useLingui();
    <Box heading={<Trans>Release Information</Trans>}>
    <Trans>
      <p>Data access is currently enabled.</p>
      <p>Access will automatically cease</p>
      <p title={i18n.date("2022-03-05")}>
        <b>in six months.</b>
      </p>
    </Trans>
 */

/**
 * Displays summary/important information about a release.
 *
 * @param releaseData
 * @param releaseId
 * @constructor
 */
export const InformationBox: React.FC<Props> = ({ releaseData, releaseId }) => {
  // a right aligned list of all our datasets and their visualisation colour/box
  const DatasetList = () => (
    <ul className="text-right">
      {Array.from(releaseData.datasetMap.entries()).map(([uri, vis], index) => (
        <li key={index} className="flex flex-row justify-end align-middle">
          <span className="mr-6 font-mono">{uri}</span>
          <span className="h-6 w-6">{vis}</span>
        </li>
      ))}
    </ul>
  );

  const ActivateDeactivateButtonRow = () => (
    <div className="flex flex-row space-x-4">
      <button
        className="btn-success btn-lg btn"
        disabled={!!releaseData.activation}
      >
        Activate Release
      </button>
      <button
        className="btn-warning btn-lg btn"
        disabled={!!!releaseData.activation}
      >
        Deactivate Release
      </button>
    </div>
  );

  return (
    <Box heading={`${releaseData.applicationDacTitle}`}>
      <div className="grid grid-cols-2 gap-4">
        {!!releaseData.activation && (
          <div className="alert alert-success col-span-2 shadow-lg">
            <div>
              <span>Data sharing is activated for this release</span>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <ActivateDeactivateButtonRow />
        </div>

        <div className="flex flex-col space-y-2">
          <DatasetList />
        </div>

        <div className="collapse-arrow rounded-box collapse col-span-2 border border-base-300 bg-base-100">
          <input type="checkbox" />

          <div className="collapse-compact collapse-title">
            See details of application
          </div>
          <div className="collapse-content">
            {releaseData.applicationDacDetails && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={
                  {
                    // Map `h1` (`# heading`) to use `h2`s.
                    //h1: ({node, ...props}) => <h1 className="" {...props} />,
                    // Rewrite `em`s (`*like so*`) to `i` with a red foreground color.
                    //em: ({node, ...props}) => <i style={{color: 'red'}} {...props} />
                  }
                }
                className="prose"
                children={releaseData.applicationDacDetails}
              />
            )}
          </div>
        </div>
      </div>
    </Box>
  );
};
