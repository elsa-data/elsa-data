import React, { useState } from "react";
import { FileRecordHeaderType } from "@umccr/elsa-types";
import { MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
type Props = {
  releaseId: string;
  releaseData: any;
};

const FILE_RECORD_HEADER: FileRecordHeaderType[] = [
  "md5",
  "patientId",
  "s3Signed",
  "caseId",
  "fileType",
  "specimenId",
  "size",
  "s3Url",
  "s3Bucket",
  "s3Key",
];
/**
 * A form that is used to ask for AWS S3
 * presigned URLS.
 *
 * @param releaseId
 * @constructor
 */
export const AwsS3PresignedForm: React.FC<Props> = ({
  releaseId,
  releaseData,
}) => {
  const displayPassword = releaseData.downloadPassword ?? "(ask PI)";

  const [isHeaderSelectionOpen, setIsHeaderSelectionOpen] =
    useState<boolean>(false);

  const [haederSelected, setHaederSelected] = useState<string[]>([
    "md5",
    "patientId",
    "s3Signed",
  ]);

  const updateText = () => {
    const checkedValueElementList: NodeListOf<HTMLInputElement> =
      document.querySelectorAll("#chx:checked");

    const currentTextSelection = Array.from(checkedValueElementList).map(
      (elem: HTMLInputElement) => elem.value
    );
    setHaederSelected(currentTextSelection);
  };
  return (
    <>
      {/* we use a POST form action here (rather than a onSubmit handler) because
            form POSTS can be converted natively into a browser file save dialog
             i.e. if the POST returned a Content-Disposition header */}
      <form
        // onSubmit={handleSubmit}
        action={`http://localhost:3000/api/releases/${releaseId}/aws-s3-presigned`}
        method="POST"
      >
        <div className="flex flex-col gap-6">
          <article className="prose">
            <p>
              Data files can be accessed through the use of AWS S3 presigned
              URLs. A TSV file containing file identifiers, URLs and other data
              will be prepared and available for download as a password
              protected zip file.
            </p>
            <p>
              The password for the zip file is controlled by the PI of this
              release. Given the presigned URLs can be used by anyone -
              possession of the zip file *and* password is equivalent to
              possession of the data itself.
            </p>
            <p>
              Presigned URLs are only useable for seven (7) days from the time
              of download.
            </p>
            <p>
              FOR DEMO:{" "}
              <a
                href="https://products.aspose.app/cells/viewer"
                target="_blank"
              >
                TSV Viewer
              </a>
            </p>
          </article>

          <div
            onClick={() => setIsHeaderSelectionOpen((prev) => !prev)}
            className="flex rounded -my-3 w-full items-center justify-between bg-white py-3 text-sm cursor-pointer hover:bg-gray-100"
          >
            <span>
              <span className="font-medium text-gray-900">
                {`TSV Header: `}
              </span>
              <span className="uppercase font-normal text-gray-900">
                {`${haederSelected.join(", ")}`}
              </span>
            </span>

            <span className="ml-6 flex items-center">
              {isHeaderSelectionOpen ? (
                <MinusIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
          </div>
          <div className={`${isHeaderSelectionOpen ? "" : "hidden"}`}>
            <div className="space-y-4">
              {FILE_RECORD_HEADER.map((field: string, fieldIdx: number) => (
                <div key={field} className="flex items-center">
                  <input
                    defaultChecked={haederSelected.includes(field)}
                    onChange={updateText}
                    name={"presignHeader"}
                    id={`chx`}
                    type="checkbox"
                    value={field}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`filter-${fieldIdx}`}
                    className="uppercase ml-3 text-sm text-gray-600"
                  >
                    {field}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <label className="prose">
            <span className="text-xs font-bold text-gray-700 uppercase">
              Current Password
            </span>
            <input
              type="text"
              disabled={true}
              required={false}
              defaultValue={displayPassword}
              className="chx mt-1 block w-full rounded-md bg-gray-50 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0"
            />
          </label>
          <div className="prose">
            <input type="submit" className="btn-normal" value="Download Zip" />
          </div>
        </div>
      </form>
    </>
  );
};
