import { Component, ReactNode } from "react";
import {
  Base7807Error,
  Base7807Response,
  isBase7807Response,
} from "@umccr/elsa-types/error-types";
import classNames from "classnames";
import axios from "axios";

export type ErrorDisplayProps = {
  children?: ReactNode;
  message?: ReactNode;
  styling?: string;
  // Whether this error should be rethrown to a higher up component.
  rethrowError?: (error: any) => boolean;
};

export type EagerErrorDisplayProps = ErrorFormatterDetailProps &
  ErrorDisplayProps;

export type ErrorFormatterProps = {
  errorCondition: boolean;
} & EagerErrorDisplayProps;

export type ErrorFormatterDetailProps = {
  error?: any;
};

export type Format7807ErrorProps = {
  error: Base7807Response;
};

export type ErrorDisplayState = {
  displayError: boolean;
} & ErrorFormatterDetailProps;

export type ErrorBoxProps = {
  children?: ReactNode;
  styling?: string;
};

/**
 * A general red error box.
 */
export const ErrorBox = ({ children, styling }: ErrorBoxProps): JSX.Element => {
  return (
    <div
      className={classNames(
        "p-4 flex place-content-center justify-center items-center",
        styling
      )}
    >
      <div
        className={classNames("p-4 text-sm text-red-700 bg-red-100 rounded-lg")}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Check whether the error is an authentication error.
 */
export const isAuthenticationError = (error: any): boolean => {
  return (
    (error instanceof Base7807Error && error.status == 403) ||
    (axios.isAxiosError(error) && error.code === "403")
  );
};

/**
 * Format a 7807 Error.
 */
export const Format7807Error = ({
  error,
}: Format7807ErrorProps): JSX.Element => {
  return (
    <div className="pl-4 pt-4">
      <div>
        <span className="font-bold">type: </span>
        {error.type}
      </div>
      <div>
        <span className="font-bold">title: </span>
        {error.title}
      </div>
      <div>
        <span className="font-bold">status: </span>
        {error.status}
      </div>
      {error.detail && (
        <div>
          <span className="font-bold">detail: </span>
          {error.detail}
        </div>
      )}
      {error.instance && (
        <div>
          <span className="font-bold">instance: </span>
          {error.instance}
        </div>
      )}
    </div>
  );
};

/**
 * Format an error using its details.
 */
export const ErrorFormatterDetail = ({
  error,
}: ErrorFormatterDetailProps): JSX.Element => {
  if (error !== undefined) {
    if (error instanceof Base7807Error) {
      return <Format7807Error error={error.toResponse()} />;
    } else if (isBase7807Response(error)) {
      return <Format7807Error error={error} />;
    } else if (axios.isAxiosError(error)) {
      if (error.response?.data instanceof Base7807Error) {
        return <ErrorFormatterDetail error={error.response.data} />;
      } else {
        return (
          <div className="pl-4 pt-4">
            <div>
              <span className="font-bold">message: </span>
              {error.message}
            </div>
            <div>
              <span className="font-bold">code: </span>
              {error.code}
            </div>
          </div>
        );
      }
    } else if (error instanceof Error) {
      return <div className="pl-4 pt-4">{error.message}</div>;
    }

    return <div className="pl-4 pt-4">{error}</div>;
  }

  return <></>;
};

/**
 * Format an error with a details message.
 */
export const ErrorFormatterWithMessage = ({
  error,
}: ErrorFormatterDetailProps): JSX.Element => {
  return (
    <>
      Here are some details:
      <ErrorFormatterDetail error={error} />
    </>
  );
};

/**
 * Format an error using a condition.
 */
export const ErrorFormatter = ({
  errorCondition,
  message,
  error,
  styling,
  children,
  rethrowError = rethrowErrorFn,
}: ErrorFormatterProps): JSX.Element => {
  if (!navigator.onLine) {
    return (
      <ErrorBox styling={styling}>
        You are offline, check your connection.
      </ErrorBox>
    );
  } else if (errorCondition) {
    if (rethrowError(error)) {
      throw error;
    }

    if (isAuthenticationError(error)) {
      return (
        <ErrorBox styling={styling}>
          Failed to authenticate, check your crendentials.
          {error && <ErrorFormatterWithMessage error={error} />}
        </ErrorBox>
      );
    } else {
      return (
        <ErrorBox styling={styling}>
          {message ? <div>{message}</div> : <div>Something went wrong.</div>}
          {error && <ErrorFormatterWithMessage error={error} />}
        </ErrorBox>
      );
    }
  } else {
    return <>{children}</>;
  }
};

/**
 * Default check for whether an error is rethrown.
 */
export const rethrowErrorFn = (error: any): boolean => {
  return !navigator.onLine || isAuthenticationError(error);
};

/**
 * Display an error passed through props.
 */
export const EagerErrorBoundary = ({
  message,
  error,
  styling,
  children,
  rethrowError = rethrowErrorFn,
}: EagerErrorDisplayProps): JSX.Element => {
  return (
    <ErrorFormatter
      errorCondition={true}
      message={message}
      error={error}
      styling={styling}
      rethrowError={rethrowError}
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
    rethrowError: rethrowErrorFn,
  };

  static getDerivedStateFromError(error: any): ErrorDisplayState {
    return { error: error, displayError: true };
  }

  constructor(props: ErrorDisplayProps) {
    super(props);
    this.state = { error: undefined, displayError: false };
  }

  render() {
    return (
      <ErrorFormatter
        errorCondition={this.state.displayError}
        message={this.props.message}
        error={this.state.error}
        styling={this.props.styling}
        rethrowError={this.props.rethrowError}
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
}