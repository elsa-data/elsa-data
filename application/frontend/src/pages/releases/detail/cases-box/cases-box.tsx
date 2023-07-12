import React, { ReactNode, useState } from "react";
import { ReleaseCaseType } from "@umccr/elsa-types";
import { IndeterminateCheckbox } from "../../../../components/indeterminate-checkbox";
import { PatientsFlexRow } from "./patients-flex-row";
import classNames from "classnames";
import { Box } from "../../../../components/boxes";
import { BoxPaginator } from "../../../../components/box-paginator";
import { isEmpty, trim } from "lodash";
import { ConsentPopup } from "./consent-popup";
import { EagerErrorBoundary } from "../../../../components/errors";
import { Table } from "../../../../components/tables";
import { DisabledInputWrapper } from "../../../../components/disable-input-wrapper";
import { trpc } from "../../../../helpers/trpc";
import { IsLoadingDivIcon } from "../../../../components/is-loading-div";

type Props = {
  releaseKey: string;

  // when the release is activated we want the UI to look approximately
  // as per normal - but with no ability for anyone to edit
  releaseIsActivated: boolean;

  // a map of every dataset uri we will encounter mapped to a single letter
  datasetMap: Map<string, ReactNode>;

  // the (max) number of case items shown on any single page
  pageSize: number;

  // whether the table is being viewed by someone with permissions to edit it
  isAllowEdit: boolean;

  // whether the table is being viewed by someone with permissions to view it despite being inactive
  isAllowAdminView: boolean;

  // whether to show any consent iconography/popups
  showConsent: boolean;
};

const checkUseableSearchText = (t: string | undefined) =>
  !isEmpty(t) && !isEmpty(trim(t));

/**
 * From an array of cases - this returns of rowSpan values for each row - if
 * we want to rowspan across common dataset values. i.e where multiple rows
 * have the same datasetUri - we want them merged.
 *
 * @param cases
 */
function calculateRowSpans(cases: ReleaseCaseType[]) {
  const rowSpans: number[] = [];

  // this horrible little piece of logic is used to make rowspans where we have a common
  // dataset shared by rows
  // our cases are always ordered by dataset - so that is why this will generally work
  let currentDataset = "not a dataset";
  let currentSpanRow = -1;

  for (let r = 0; r < cases.length; r++) {
    if (cases[r].fromDatasetUri !== currentDataset) {
      // if we have changed from the previous - then it's a new span...
      currentSpanRow = r;
      currentDataset = cases[r].fromDatasetUri;

      rowSpans.push(1);
    } else {
      // if it's the same as the previous - we want to increase the 'current' and put in a marker to the rowspans
      rowSpans[currentSpanRow] += 1;
      rowSpans.push(-1);
    }
  }

  return rowSpans;
}

/**
 * The cases box is the primary display/editor for which cases/patients and specimens are
 * contained in a release.
 *
 * It has multiple levels of functionality depending on the user and other factors
 * - editing selections
 * - viewing cases
 * - searching for cases
 *
 * All in all - it's a bit complex!
 *
 * @param releaseKey the release key
 * @param releaseIsActivated whether the release is activated (i.e. locked)
 * @param datasetMap a map of datasets URIs to icons
 * @param pageSize the page size of the table
 * @param isAllowEdit if the user is allowed to edit the specimens included
 * @param isAllowAdminView if the user is allowed an administrator read-only view of these cases
 * @param showConsent whether consent feature is enabled at all - if not enabled don't do _any_ consent UI
 * @constructor
 */
export const CasesBox: React.FC<Props> = ({
  releaseKey,
  releaseIsActivated,
  datasetMap,
  pageSize,
  isAllowEdit,
  isAllowAdminView,
  showConsent,
}) => {
  // a quasi state for just the UI that tracks if we think the entire set is checked or unchecked
  // (basically we are guessing it is indeterminate after any selection activity - unless
  // we get a strong signal via button press that everything is cleared or set)
  const [isSelectAllIndeterminate, setIsSelectAllIndeterminate] =
    useState<boolean>(true);

  // our internal state for which page we are on
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentTotalCases, setCurrentTotalCases] = useState<number>(1);

  // just a helper for the UI which we get from our cases query as a bonus
  // TODO get from the backend the currentTotalSpecimens - and then use
  //      that to derive real select all/unselect all state rather than the pseudo SelectAllIndeterminate
  const [currentSelectedSpecimens, setCurrentSelectedSpecimens] =
    useState<number>(0);

  // a text input which changes the behaviour of the control to being a search result
  const [searchText, setSearchText] = useState("");

  // we are going to get the UI to behave quite differently if we are in the process of searching v not searching
  const isUseableSearchText = checkUseableSearchText(searchText);

  const onSearchTextChange = (text: string) => {
    setCurrentPage(1);
    setSearchText(text);
  };

  const casesQuery = trpc.release.getReleaseCases.useQuery(
    {
      releaseKey: releaseKey,
      page: currentPage,
      q: searchText,
    },
    {
      onSuccess: (res) => {
        setCurrentTotalCases(res.total);
        setCurrentSelectedSpecimens(res.totalSelectedSpecimens);
      },
    }
  );

  const casesQueryData = casesQuery.data?.data;

  const trpcUtils = trpc.useContext();

  const specimenMutate = trpc.release.updateReleaseSpecimens.useMutation({
    onSuccess: async () =>
      // once we've altered the selection set we want to invalidate the cases queries *just* of this release
      await trpcUtils.release.getReleaseCases.invalidate({
        releaseKey: releaseKey,
      }),
  });

  const onSelectAllChange = async (ce: React.ChangeEvent<HTMLInputElement>) => {
    setIsSelectAllIndeterminate(false);

    if (ce.target.checked) {
      await specimenMutate.mutate({
        releaseKey: releaseKey,
        op: "add",
        // note that this empty array is a special marker to indicate to "select all"
        value: [],
      });
    } else {
      await specimenMutate.mutate({
        releaseKey: releaseKey,
        op: "remove",
        // note that this empty array is a special marker to indicate to "unselect all"
        value: [],
      });
    }
  };

  // row spans help us with our UI column that displays the 'dataset' icon for each case
  const rowSpans = casesQueryData ? calculateRowSpans(casesQueryData) : [];

  const baseColumnClasses = "py-4 font-medium text-gray-900 whitespace-nowrap";

  const baseMessageDivClasses =
    "min-h-[10em] w-full flex items-center justify-center";

  // if they cannot edit/admin view cases AND the release is not activated then effectively there is nothing
  // they can do yet... so we give them some instructions informing them of that
  if (!releaseIsActivated && !isAllowEdit && !isAllowAdminView)
    return (
      <Box heading="Cases">
        <div className="prose max-w-none text-sm">
          <p>
            Once a release is created - the data owners and stewards must go
            through a process of setting up the exact set of data which will be
            shared with you.
          </p>
          <p>
            That process is currently not completed - you will receive an email
            informing you when the process is completed at which point you will
            be able to access the data.
          </p>
        </div>
      </Box>
    );

  return (
    <Box
      heading="Cases"
      applyIsActivatedLockedStyle={isAllowEdit && releaseIsActivated}
      applyIsDisabledStyle={!isAllowEdit && isAllowAdminView}
    >
      <div className={classNames("flex flex-col")}>
        {casesQuery.isError && <EagerErrorBoundary error={casesQuery.error} />}

        <BoxPaginator
          currentPage={currentPage}
          setPage={(n) => setCurrentPage(n)}
          rowCount={currentTotalCases}
          rowsPerPage={pageSize}
          rowWord="cases"
          currentSearchText={searchText}
          onSearchTextChange={onSearchTextChange}
          isLoading={casesQuery.isFetching}
        />

        <DisabledInputWrapper
          isInputDisabled={!isAllowEdit || releaseIsActivated}
        >
          <>
            {casesQuery.isLoading && (
              <div className={classNames(baseMessageDivClasses)}>
                <p>{isUseableSearchText ? "Searching..." : "Loading..."}</p>
              </div>
            )}
            {casesQueryData &&
              casesQueryData.length === 0 &&
              !isUseableSearchText && (
                <div className={classNames(baseMessageDivClasses)}>
                  <p>
                    There are no cases visible in the dataset(s) of this release
                  </p>
                </div>
              )}
            {casesQueryData &&
              casesQueryData.length === 0 &&
              isUseableSearchText && (
                <div className={classNames(baseMessageDivClasses)}>
                  <p>
                    Searching for the identifier <b>{searchText}</b> returned no
                    results
                  </p>
                </div>
              )}
            {casesQueryData && casesQueryData.length > 0 && (
              <div className={specimenMutate.isLoading ? "opacity-50" : ""}>
                <Table
                  additionalTableClassName="text-left text-sm text-gray-500"
                  tableBody={casesQueryData.map((row, rowIndex) => {
                    return (
                      <tr key={row.id} className="border-b">
                        <td
                          className={classNames(
                            baseColumnClasses,
                            "w-12",
                            "text-center"
                          )}
                        >
                          <IndeterminateCheckbox
                            disabled={true}
                            checked={row.nodeStatus === "selected"}
                            indeterminate={row.nodeStatus === "indeterminate"}
                          />
                        </td>
                        <td
                          className={classNames(
                            baseColumnClasses,
                            "text-left",
                            "w-40"
                          )}
                        >
                          <div className="flex space-x-1">
                            <span>{row.externalId}</span>
                            {showConsent && row.customConsent && (
                              <ConsentPopup
                                releaseKey={releaseKey}
                                nodeId={row.id}
                              />
                            )}
                          </div>
                        </td>
                        <td
                          className={classNames(
                            baseColumnClasses,
                            "text-left",
                            "pr-4"
                          )}
                        >
                          <PatientsFlexRow
                            releaseKey={releaseKey}
                            releaseIsActivated={releaseIsActivated}
                            patients={row.patients}
                            showCheckboxes={isAllowEdit || isAllowAdminView}
                            onCheckboxClicked={() =>
                              setIsSelectAllIndeterminate(true)
                            }
                            showConsent={showConsent}
                          />
                        </td>
                        {/* if we only have one dataset - then we don't show this column at all */}
                        {/* if this row is part of a rowspan then we also skip it (to make row spans work) */}
                        {datasetMap.size > 1 && rowSpans[rowIndex] >= 1 && (
                          <td
                            className={classNames(
                              baseColumnClasses,
                              "w-10",
                              "px-2",
                              "border-l",
                              "border-l-red-500"
                            )}
                            rowSpan={
                              rowSpans[rowIndex] === 1
                                ? undefined
                                : rowSpans[rowIndex]
                            }
                          >
                            <div className="w-6">
                              {datasetMap.get(row.fromDatasetUri)}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                />
                {/* a status line here provides some select all/none + a status line
                      - this does not apply during a text search as all/none/stats
                        don't have the same meaning when the result is filtered by a text box
                      - if you are just a member/manager then there is no distinction between "selected"
                        and what you can see - so the status line is not helpful - so we don't show at all  
                      */}
                {!isUseableSearchText && (isAllowEdit || isAllowAdminView) && (
                  <div className="flex flex-row justify-between border-t-2 py-4">
                    {
                      <label className="flex items-center">
                        <div className="flex w-12 items-center justify-center">
                          <IndeterminateCheckbox
                            className="checkbox-accent"
                            // we _can_ be showing this just with admin view permissions
                            // so we need to disable unless we are allowed to edit
                            disabled={
                              specimenMutate.isLoading ||
                              releaseIsActivated ||
                              !isAllowEdit
                            }
                            indeterminate={isSelectAllIndeterminate}
                            onChange={onSelectAllChange}
                          />
                        </div>
                        Select All
                      </label>
                    }
                    {/* experimental fetching loader - only enable if still hunting load bugs
                    <span>
                      {casesQuery.isFetching && <IsLoadingDivIcon size="xs" />}
                    </span>
                    */}
                    {/* status span */}
                    <span>
                      {currentSelectedSpecimens} specimen
                      {currentSelectedSpecimens !== 1 && "s"} in total selected
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        </DisabledInputWrapper>
      </div>
      <div id="popup-root" />
    </Box>
  );
};
