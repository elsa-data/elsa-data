import { Component, ReactNode } from "react";
import { Base7807Error, Base7807Response } from "@umccr/elsa-types/error-types";
import classNames from "classnames";
import axios from "axios";

export type ErrorDisplayProps = {
  children?: ReactNode;
  message?: ReactNode;
  styling?: string;
  // Whether this error should be rethrown to a higher up component.
  rethrowError: (error: any) => boolean;
};

export type EagerErrorDisplayProps = {
  error?: any;
} & ErrorDisplayProps;

export type ErrorDisplayState = {
  error?: any;
  displayError: boolean;
};

export type ErrorBoxProps = {
  children?: ReactNode;
  styling?: string;
};

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

export const getDerivedStateFromError = (error: any): ErrorDisplayState => {
  return { error: error, displayError: true };
};

export const isAuthenticationError = (error: any): boolean => {
  return (
    (error instanceof Base7807Error && error.status == 403) ||
    (axios.isAxiosError(error) && error.code === "403")
  );
};

export const format7807Error = (
  error: Base7807Response
): JSX.Element | undefined => {
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

export const formatErrorDetail = (error: any): JSX.Element | undefined => {
  if (error !== undefined) {
    if (error instanceof Base7807Error) {
      return format7807Error(error.toResponse());
    } else if (Base7807Error.isBase7807Error(error)) {
      return format7807Error(error.toResponse());
    } else if (axios.isAxiosError(error)) {
      if (error.response?.data instanceof Base7807Error) {
        return formatErrorDetail(error.response.data);
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
    } else {
      return <div className="pl-4 pt-4">{error}</div>;
    }
  }
};

export const formatErrorDetailWithMessage = (
  error: any
): JSX.Element | undefined => {
  return (
    <>
      Here are some details:
      {formatErrorDetail(error)}
    </>
  );
};

export const formatError = (
  errorCondition: boolean,
  rethrowError: (error: any) => boolean,
  message?: ReactNode,
  error?: any,
  styling?: string,
  children?: ReactNode
): ReactNode | undefined => {
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
          {error && formatErrorDetailWithMessage(error)}
        </ErrorBox>
      );
    } else {
      return (
        <ErrorBox styling={styling}>
          {message ? <div>{message}</div> : <div>Something went wrong.</div>}
          {error && formatErrorDetailWithMessage(error)}
        </ErrorBox>
      );
    }
  } else {
    return children;
  }
};

export const rethrowError = (error: any): boolean => {
  return !navigator.onLine || isAuthenticationError(error);
};

/**
 * Display an error message passed through props
 */
export class EagerErrorBoundary extends Component<EagerErrorDisplayProps> {
  static defaultProps = {
    rethrowError: rethrowError,
  };

  constructor(props: ErrorDisplayProps) {
    super(props);
  }

  render() {
    return formatError(
      true,
      this.props.rethrowError,
      this.props.message,
      this.props.error,
      this.props.styling,
      this.props.children
    );
  }
}

/**
 * Display an error message on throw.
 */
export class ErrorBoundary extends Component<
  ErrorDisplayProps,
  ErrorDisplayState
> {
  static defaultProps = {
    rethrowError: rethrowError,
  };

  constructor(props: ErrorDisplayProps) {
    super(props);
    this.state = { error: undefined, displayError: false };
  }

  render() {
    return formatError(
      this.state.displayError,
      this.props.rethrowError,
      this.props.message,
      this.state.error,
      this.props.styling,
      this.props.children
    );
  }
}
