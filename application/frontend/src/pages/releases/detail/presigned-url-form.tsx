import React, { useState } from "react";
import { FileRecordHeaderType } from "@umccr/elsa-types";
import { MinusIcon, PlusIcon } from "@heroicons/react/20/solid";

type Props = {
  releaseKey: string;
  releaseData: any;
};

const FILE_RECORD_HEADER: FileRecordHeaderType[] = [
  "md5",
  "patientId",
  "caseId",
  "fileType",
  "specimenId",
  "size",
  "objectStoreUrl",
  "objectStoreBucket",
  "objectStoreKey",
  "objectStoreSigned",
];

/**
 * A form that is used to ask for presigned URLS from an object store like AWS
 * S3 or GCP CS.
 *
 * @param releaseKey the id of the release
 * @param releaseData the backend release information
 * @constructor
 */
export const PresignedUrlForm: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const displayPassword = releaseData.downloadPassword ?? "(ask PI)";

  const [isHeaderSelectionOpen, setIsHeaderSelectionOpen] =
    useState<boolean>(false);

  const [headerSelected, setHeaderSelected] = useState<string[]>([
    "md5",
    "patientId",
    "objectStoreSigned",
  ]);

  const updateText = () => {
    const checkedValueElementList: NodeListOf<HTMLInputElement> =
      document.querySelectorAll("#chx:checked");

    const currentTextSelection = Array.from(checkedValueElementList).map(
      (elem: HTMLInputElement) => elem.value
    );
    setHeaderSelected(currentTextSelection);
  };
  return (
    <>
      {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
      <form
        action={`/api/releases/${releaseKey}/presigned`}
        method="POST"
        className="p-6"
      >
        <div className="flex flex-col gap-6">
          <article className="prose">
            <p>
              Data files can be accessed through the use of presigned URLs. A
              TSV file containing file identifiers, URLs and other data will be
              prepared and available for download as a password protected zip
              file.
            </p>
            <p>
              The password for the zip file is controlled by the PI of this
              release. Given the presigned URLs can be used by anyone -
              possession of the zip file <i>and</i> password is equivalent to
              possession of the data itself.
            </p>
            <p>
              Presigned URLs are only usable for seven (7) days from the time of
              download.
            </p>
          </article>
          <div id="tsv-header-selector">
            <div className="text-xs font-bold uppercase text-gray-700">
              {`TSV Header: `}
            </div>
            <div
              onClick={() => setIsHeaderSelectionOpen((prev) => !prev)}
              className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-lg	bg-gray-100 p-3 text-sm hover:bg-gray-200 "
            >
              <span className="font-normal uppercase text-gray-900">
                {`${headerSelected.join(", ")}`}
              </span>

              <span className="ml-6 flex items-center">
                {isHeaderSelectionOpen ? (
                  <MinusIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
            </div>
            <div className={`${isHeaderSelectionOpen ? "" : "hidden"} mt-3`}>
              <div className="space-y-4">
                {FILE_RECORD_HEADER.map((field: string, fieldIdx: number) => (
                  <div key={field} className="flex items-center px-3">
                    <input
                      className="checkbox"
                      id={`chx`}
                      defaultChecked={headerSelected.includes(field)}
                      value={field}
                      onChange={updateText}
                      name={"presignHeader"}
                    />
                    <label
                      htmlFor={`filter-${fieldIdx}`}
                      className="ml-3 text-sm uppercase text-gray-600"
                    >
                      {field}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div id="current-password">
            <span className="text-xs font-bold uppercase text-gray-700">
              Current Password
            </span>
            <input
              type="text"
              disabled={true}
              required={false}
              defaultValue={displayPassword}
              className="chx mt-1 block w-full rounded-md border-transparent bg-gray-100 focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </div>
          <div className="prose">
            <input type="submit" className="btn-normal" value="Download Zip" />
          </div>
        </div>
      </form>
    </>
  );
};
