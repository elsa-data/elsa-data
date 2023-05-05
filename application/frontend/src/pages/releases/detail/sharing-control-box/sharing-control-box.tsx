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
import { useEnvRelay } from "../../../../providers/env-relay-provider";
import {
  FEATURE_DATA_SHARING_AWS_ACCESS_POINT,
  FEATURE_DATA_SHARING_COPY_OUT,
  FEATURE_DATA_SHARING_GCP_IAM,
  FEATURE_DATA_SHARING_HTSGET,
} from "@umccr/elsa-constants";

type Props = {
  releaseKey: string;
  releaseData: ReleaseTypeLocal;
};

export const SharingControlBox: React.FC<Props> = ({
  releaseKey,
  releaseData,
}) => {
  const { features } = useEnvRelay();
  const utils = trpc.useContext();

  // a mutator that can alter any field set up using our REST PATCH mechanism
  // the argument to the mutator needs to be a single ReleasePatchOperationType operation
  const releasePatchMutate = useMutation(
    axiosPatchOperationMutationFn(`/api/releases/${releaseKey}`),
    {
      // this is not as efficient as our PATCH operation actually returns the new release data
      // BUT we currently have BOTH trpc and react query so lets decide on one first
      onSuccess: async (result: ReleaseTypeLocal) =>
        utils.releaseRouter.getSpecificRelease.invalidate({
          releaseKey: releaseKey,
        }),
    }
  );

  const copyOutMutate = trpc.releaseJob.startCopyOut.useMutation({
    onSettled: async () =>
      utils.releaseRouter.getSpecificRelease.invalidate({
        releaseKey: releaseKey,
      }),
  });

  type SharingConfigurationAccordionProps = {
    label: ReactNode;
    path:
      | "/dataSharingConfiguration/objectSigningEnabled"
      | "/dataSharingConfiguration/copyOutEnabled"
      | "/dataSharingConfiguration/htsgetEnabled"
      | "/dataSharingConfiguration/awsAccessPointEnabled"
      | "/dataSharingConfiguration/gcpStorageIamEnabled";
    current: boolean;
  };
  const SharingConfigurationAccordion: React.FC<
    PropsWithChildren<SharingConfigurationAccordionProps>
  > = (props) => (
    <div
      tabIndex={0}
      className={classNames(
        "rounded-box collapse border border-base-300 bg-base-100",
        {
          "collapse-open": props.current,
          "collapse-close": !props.current,
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

  // NOTE the "enabled" fields are whether the custodian has checked the checkbox..
  // but there is also underlying "feature" fields that mean we should not show the UI at all
  const objectSigningEnabled = !!releaseData.dataSharingObjectSigning;
  const copyOutEnabled = !!releaseData.dataSharingCopyOut;
  const htsgetEnabled = !!releaseData.dataSharingHtsget;
  const awsAccessPointEnabled = !!releaseData.dataSharingAwsAccessPoint;
  const gcpStorageIamEnabled = !!releaseData.dataSharingGcpStorageIam;

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
            <SharingConfigurationAccordion
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
            </SharingConfigurationAccordion>

            {features.has(FEATURE_DATA_SHARING_COPY_OUT) && (
              <SharingConfigurationAccordion
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
              </SharingConfigurationAccordion>
            )}

            {features.has(FEATURE_DATA_SHARING_HTSGET) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/htsgetEnabled"
                label="Htsget"
                current={htsgetEnabled}
              >
                <p>Some text about htsget</p>
                <pre>{releaseData.dataSharingHtsget?.url}</pre>
              </SharingConfigurationAccordion>
            )}

            {features.has(FEATURE_DATA_SHARING_AWS_ACCESS_POINT) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/awsAccessPointEnabled"
                label="AWS Access Point"
                current={awsAccessPointEnabled}
              >
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Account Id</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={
                      releaseData.dataSharingAwsAccessPoint?.accountId
                    }
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">VPC Id</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={releaseData.dataSharingAwsAccessPoint?.vpcId}
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Install Cloud Formation</span>
                  </label>
                  <button type="button" className="btn-normal" disabled={true}>
                    Install
                  </button>
                </div>
              </SharingConfigurationAccordion>
            )}

            {features.has(FEATURE_DATA_SHARING_GCP_IAM) && (
              <SharingConfigurationAccordion
                path="/dataSharingConfiguration/gcpStorageIamEnabled"
                label="GCP Storage IAM"
                current={gcpStorageIamEnabled}
              >
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Users</span>
                  </label>
                  <input
                    type="text"
                    className="input-bordered input input-disabled w-full"
                    defaultValue={releaseData.dataSharingGcpStorageIam?.users.join(
                      " "
                    )}
                  />
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="form-control flex-grow self-end">
                  <label className="label">
                    <span className="label-text">Apply</span>
                    <span className="label-text-alt">
                      (running time can be minutes)
                    </span>
                  </label>
                  <button type="button" className="btn-normal" disabled={true}>
                    Apply
                  </button>
                </div>
              </SharingConfigurationAccordion>
            )}
          </RhChecks>
        </RightDiv>
      </RhSection>
    </Box>
  );
};
