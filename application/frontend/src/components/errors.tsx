import React, { Component, isValidElement, ReactNode } from "react";
import {
  Base7807Error,
  Base7807Response,
  isBase7807Response,
} from "@umccr/elsa-types/error-types";
import axios from "axios";
import { TRPCClientError } from "@trpc/client";
import { Alert, CircleExclamationIcon } from "./alert";

export type ErrorDisplayProps = {
  children?: ReactNode;

  // Whether this component should render common errors, e.g. offline or authentication errors
  renderCommonErrors?: boolean;
};

export type EagerErrorDisplayProps = ErrorFormatterDetailProps &
  ErrorDisplayProps;

export type ErrorFormatterProps = {
  errorCondition: boolean;
} & EagerErrorDisplayProps;

export type ErrorFormatterDetailProps = {
  error?: unknown;
};

export type Format7807ErrorProps = {
  error: Base7807Response;
};

export type ErrorDisplayState = {
  displayError: boolean;
  isOnline: boolean;
} & ErrorFormatterDetailProps;

export type ErrorBoxProps = {
  children?: ReactNode;
};

/**
 * A general red error box.
 */
export const ErrorBox = ({ children }: ErrorBoxProps): JSX.Element => {
  return (
    <Alert
      icon={<CircleExclamationIcon />}
      description={children}
      additionalAlertClassName="alert-error"
    />
  );
};

/**
 * Check whether the error is an authentication error.
 */
export const isAuthenticationError = (error: any): boolean => {
  return (
    (error instanceof Base7807Error && error.status == 403) ||
    (axios.isAxiosError(error) && error.code === "403") ||
    (error instanceof TRPCClientError &&
      error?.shape?.data?.httpStatus === "403")
  );
};

/**
 * Format a 7807 Error.
 */
export const Format7807Error = ({
  error,
}: Format7807ErrorProps): JSX.Element => {
  return (
    <div>
      <h3 className="font-bold">{error.title}</h3>
      <div className="text-xs">
        {error.status}: {error.detail}
      </div>
    </div>
  );
};

/**
 * Format an error using its details. This component should be fairly safe to
 * not cause any of its own errors.
 */
export const ErrorFormatterDetail = ({
  error,
}: ErrorFormatterDetailProps): JSX.Element => {
  if (error !== undefined) {
    if (error instanceof Base7807Error) {
      return <Format7807Error error={error.toResponse()} />;
    }

    if (isBase7807Response(error)) {
      return <Format7807Error error={error} />;
    }

    if (error instanceof TRPCClientError) {
      const base7807ErrorRes = error?.shape?.data?.base7807ErrorRes;
      if (base7807ErrorRes) {
        return <Format7807Error error={base7807ErrorRes} />;
      }

      // Some anticipation if 7807 error res does not exist
      const code = error?.shape?.data?.httpStatus;
      return (
        <span>{code ? `${code}: ${error.message}` : `${error.message}`}</span>
      );
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.data instanceof Base7807Error) {
        return <ErrorFormatterDetail error={error.response.data} />;
      }

      return (
        <span>
          {error.code ? `${error.code}: ${error.message}` : `${error.message}`}
        </span>
      );
    }

    if (error instanceof Error) {
      return <span>{error.message}</span>;
    }

    if (isValidElement(error)) {
      return error;
    }

    if (typeof error === "object" && error !== null && "toString" in error) {
      return <span>{error.toString()}</span>;
    }

    if (typeof error === "string" || error instanceof String) {
      return <span>{error}</span>;
    }
  }

  return <></>;
};

/**
 * An alert when there is no connection.
 */
export const OfflineAlert = ({
  errorCondition,
  children,
  renderCommonErrors = false,
}: ErrorFormatterProps): JSX.Element => {
  return (
    <>
      {renderCommonErrors && (
        <div className="py-2">
          <ErrorBox>You are offline, check your connection.</ErrorBox>
        </div>
      )}
      {!errorCondition && children}
    </>
  );
};

/**
 * Format an error using a condition.
 */
export const ErrorFormatter = ({
  errorCondition,
  error,
  children,
  renderCommonErrors = false,
}: ErrorFormatterProps): JSX.Element => {
  // If there is no error, proceed with normal rendering.
  if (!errorCondition) {
    return <>{children}</>;
  }

  // Only render common errors if the error formatter also enabled the renderCommonErrors property.
  if (renderCommonErrors && isAuthenticationError(error)) {
    return (
      <div className="py-2">
        <ErrorBox>
          <span>Failed to authenticate, check your credentials.</span>
        </ErrorBox>
      </div>
    );
  }

  // If this error is not a common error, render it as a detailed error.
  if (!isAuthenticationError(error)) {
    return (
      <div className="py-2">
        <ErrorBox>
          {error ? (
            <ErrorFormatterDetail error={error} />
          ) : (
            <span>An error has occurred.</span>
          )}
        </ErrorBox>
      </div>
    );
  }

  return <></>;
};

/**
 * Display an error passed through props.
 */
export const EagerErrorBoundary = ({
  error,
  children,
  renderCommonErrors = false,
}: EagerErrorDisplayProps): JSX.Element => {
  return (
    <ErrorFormatter
      errorCondition={true}
      error={error}
      renderCommonErrors={renderCommonErrors}
    >
      {children}
    </ErrorFormatter>
  );
};

/**
 * Display an error on throw.
 */
export class ErrorBoundary extends Component<
  ErrorDisplayProps,
  ErrorDisplayState
> {
  static defaultProps = {
    renderCommonErrors: false,
    isOnline: navigator.onLine,
  };

  static getDerivedStateFromError(error: any): ErrorDisplayState {
    return { error: error, displayError: true, isOnline: navigator.onLine };
  }

  componentDidMount() {
    window.addEventListener("offline", this.handleNetworkChange);
    window.addEventListener("online", this.handleNetworkChange);
  }

  componentWillUnmount() {
    window.removeEventListener("offline", this.handleNetworkChange);
    window.removeEventListener("online", this.handleNetworkChange);
  }

  handleNetworkChange = () => {
    this.setState({ isOnline: navigator.onLine });
  };

  constructor(props: ErrorDisplayProps) {
    super(props);
    this.state = {
      error: undefined,
      displayError: false,
      isOnline: navigator.onLine,
    };
  }

  render() {
    // If not online, show an alert if also rendering common errors.
    if (!this.state.isOnline && this.props.renderCommonErrors) {
      return (
        <OfflineAlert
          renderCommonErrors={this.props.renderCommonErrors}
          errorCondition={this.state.displayError}
        >
          {this.props.children}
        </OfflineAlert>
      );
    }

    return (
      <ErrorFormatter
        errorCondition={this.state.displayError}
        error={this.state.error}
        renderCommonErrors={this.props.renderCommonErrors}
      >
        {this.props.children}
      </ErrorFormatter>
    );
  }
}

/**
 * State that handles an error.
 */
export type ErrorState = {
  error: any;
  isSuccess: boolean;
};
