import React, { PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Box } from "../../../../components/boxes";
import { ReleaseTypeLocal } from "../../shared-types";
import {
  LeftDiv,
  RhSection,
  RightDiv,
} from "../../../../components/rh/rh-structural";
import {
  RhCheckItem,
  RhChecks,
  RhChecksDetail,
} from "../../../../components/rh/rh-checks";
import {
  axiosPatchOperationMutationFn,
  REACT_QUERY_RELEASE_KEYS,
} from "../../queries";
import { trpc } from "../../../../helpers/trpc";
import ReactMarkdown from "react-markdown";
import children = ReactMarkdown.propTypes.children;

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const SharingControlBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const queryClient = useQueryClient();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      // whenever we do a mutation of application coded data - our API returns the complete updated
      // state of the *whole* release - and we can use that data to replace the stored react-query state
      onSuccess: (result: ReleaseTypeLocal) => {
        queryClient.setQueryData(
          REACT_QUERY_RELEASE_KEYS.detail(releaseKey),
          result
        );
      },
    }
  );

  const copyOutMutate = trpc.releaseJob.startCopyOut.useMutation({
    onSettled: async () =>
      queryClient.invalidateQueries(
        REACT_QUERY_RELEASE_KEYS.detail(releaseKey)
      ),
  });

  type SharingConfigurationAccordianProps = {
    label: ReactNode;
    path:
      | "/dataSharingConfiguration/objectSigningEnabled"
      | "/dataSharingConfiguration/copyOutEnabled";
    current: boolean;
  };
  const SharingConfigurationAccordian: React.FC<
    PropsWithChildren<SharingConfigurationAccordianProps>
  > = (props) => (
    <div
      tabIndex={0}
      className={classNames(
        "rounded-box collapse border border-base-300 bg-base-100",
        {
          "collapse-open": objectSigningEnabled,
          "collapse-close": !objectSigningEnabled,
        }
      )}
    >
      <div className="collapse-title text-xl font-medium">
        <div className={classNames("form-control", "items-start", "space-x-2")}>
          <label className="label cursor-pointer">
            <input
              type="checkbox"
              className={classNames(
                "checkbox-accent checkbox checkbox-sm mr-2",
                { "opacity-50": releasePatchMutate.isLoading }
              )}
              checked={props.current}
              onChange={(e) => {
                releasePatchMutate.mutate({
                  op: "replace",
                  path: props.path,
                  value: !props.current,
                });
              }}
            />
            <span className="label-text">{props.label}</span>
          </label>
        </div>
      </div>
      <div className="collapse-content flex flex-row">{props.children}</div>
    </div>
  );

  const objectSigningEnabled = !!releaseData.dataSharingObjectSigning;
  const copyOutEnabled = !!releaseData.dataSharingCopyOut;

  return (
    <Box heading="Data Sharing Control">
      <RhSection>
        <LeftDiv
          heading={"Mechanism"}
          extra={
            "The technical mechanisms by which data will be shared must be enabled " +
            "according to data transfer agreements and organisation policy"
          }
        />
        <RightDiv>
          <RhChecks label="Researcher Access Via">
            <SharingConfigurationAccordian
              path="/dataSharingConfiguration/objectSigningEnabled"
              label="Object Signing"
              current={objectSigningEnabled}
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Signing Expiry in Hours</span>
                </label>
                <input
                  type="text"
                  className="input-bordered input w-full"
                  defaultValue={releaseData.dataSharingObjectSigning?.expiryHours.toString()}
                  onBlur={(e) =>
                    releasePatchMutate.mutate({
                      op: "replace",
                      path: "/dataSharingConfiguration/objectSigningExpiryHours",
                      value: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </SharingConfigurationAccordian>

            <SharingConfigurationAccordian
              path="/dataSharingConfiguration/copyOutEnabled"
              label="Copy Out"
              current={copyOutEnabled}
            >
              <div className="form-control flex-grow self-end">
                <label className="label">
                  <span className="label-text">Destination for Copy Out</span>
                </label>
                <input
                  type="text"
                  className="input-bordered input input-disabled w-full"
                  defaultValue={
                    releaseData.dataSharingCopyOut?.destinationLocation
                  }
                />
              </div>
              <div className="divider divider-horizontal"></div>
              <div className="form-control flex-grow self-end">
                <label className="label">
                  <span className="label-text">Start a Background Copy</span>
                  <span className="label-text-alt">
                    (running time can be hours)
                  </span>
                </label>
                <button
                  type="button"
                  className="btn-normal"
                  onClick={() => {
                    copyOutMutate.mutate({
                      releaseKey: releaseKey,
                      destinationBucket:
                        releaseData.dataSharingCopyOut?.destinationLocation ||
                        "",
                    });
                  }}
                  disabled={copyOutMutate.isLoading}
                >
                  Copy Out
                </button>
              </div>
            </SharingConfigurationAccordian>
          </RhChecks>
        </RightDiv>
      </RhSection>
    </Box>
  );
};
