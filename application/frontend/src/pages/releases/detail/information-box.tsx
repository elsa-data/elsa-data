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
  const alertBoxClasses = "border-4 rounded-2xl p-4 text-center mb-2";

  return (
    <Box heading="Release Information">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-bold">{releaseData.applicationDacTitle}</span>
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

        <div className="flex flex-col items-end gap-2">
          {releaseData.accessEnabled && (
            <div className={classNames(alertBoxClasses, "border-green-400")}>
              <p>Data access is currently enabled.</p>
              <p>Access will automatically cease</p>
              <p title="2022-03-05">
                <b>in six months.</b>
              </p>
            </div>
          )}
          {!releaseData.accessEnabled && (
            <div className={classNames(alertBoxClasses, "border-red-400")}>
              <p>Data access is currently disabled</p>
            </div>
          )}
          <ul className="text-right">
            {Array.from(releaseData.datasetMap.entries()).map(
              ([uri, vis], index) => (
                <li
                  key={index}
                  className="flex flex-row justify-end align-middle"
                >
                  <span className="mr-6 font-mono">{uri}</span>
                  <span className="h-6 w-6">{vis}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </Box>
  );
};
