import {Component, Key, ReactNode} from "react";
import {Base7807Error, Base7807Response} from "@umccr/elsa-types/error-types";
import classNames from "classnames";
import axios from "axios";

export type ErrorDisplayProps = {
  children? : ReactNode;
  key?: Key;
  message?: ReactNode;
  // Should this component be displayed even if no error has been thrown.
  displayEagerly?: boolean;
  error?: any;
  styling?: string;
  // Whether this error should be rethrown to a higher up component.
  rethrowError: (error: any) => boolean;
};

export type ErrorDisplayState = {
  error?: any;
  displayError: boolean;
};

export type ErrorBoxProps = {
  children?: ReactNode;
  styling?: string;
}

export const ErrorBox = ({ children, styling }: ErrorBoxProps): JSX.Element => {
  return <div className={classNames("p-4 flex place-content-center justify-center items-center", styling)}>
    <div className={classNames("p-4 text-sm text-red-700 bg-red-100 rounded-lg")}>
      {children}
    </div>
  </div>;
}

/**
 * Display an error message on throw.
 */
export class ErrorBoundary extends Component<ErrorDisplayProps, ErrorDisplayState> {
  static defaultProps = {
    rethrowError: (error: any) => !navigator.onLine || ErrorBoundary.isAuthenticationError(error)
  }

  constructor(props: ErrorDisplayProps) {
    super(props);
    this.state = { error: props.error, displayError: props.error !== undefined && props.error !== null };
  }

  static getDerivedStateFromError(error: any): ErrorDisplayState {
    return { error: error, displayError: true };
  }

  static isAuthenticationError(error: any): boolean {
    return (error instanceof Base7807Error && error.status == 403) ||
      (axios.isAxiosError(error) && error.code === "403");
  }

  static format7807Error(error: Base7807Response): JSX.Element | undefined {
    return <div className="pl-4 pt-4">
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
      {error.detail &&
        <div>
          <span className="font-bold">detail: </span>
          {error.detail}
        </div>
      }
      {error.instance &&
        <div>
          <span className="font-bold">instance: </span>
          {error.instance}
        </div>
      }
    </div>;
  }

  static formatErrorDetail(error: any): JSX.Element | undefined {
    if (error !== undefined) {
      if (error instanceof Base7807Error) {
        return ErrorBoundary.format7807Error(error.toResponse());
      } else if (Base7807Error.isBase7807Error(error)) {
        return ErrorBoundary.format7807Error(error.toResponse());
      } else if (axios.isAxiosError(error)) {
        if (error.response?.data instanceof Base7807Error) {
          return this.formatErrorDetail(error.response.data);
        } else {
          return <div className="pl-4 pt-4">
            <div>
              <span className="font-bold">message: </span>
              {error.message}
            </div>
            <div>
              <span className="font-bold">code: </span>
              {error.code}
            </div>
          </div>;
        }
      } else if (error instanceof Error) {
        return <div className="pl-4 pt-4">{error.message}</div>;
      } else {
        return <div className="pl-4 pt-4">{error}</div>
      }
    }
  }

  static formatErrorDetailWithMessage(error: any): JSX.Element | undefined {
    return <>
      Here are some details:
      {ErrorBoundary.formatErrorDetail(error)}
    </>;
  }

  formatError() : JSX.Element | undefined {
    if (ErrorBoundary.isAuthenticationError(this.state.error)) {
      return <ErrorBox styling={this.props.styling}>
        Failed to authenticate, check your crendentials.
        {this.state.error && ErrorBoundary.formatErrorDetailWithMessage(this.state.error)}
      </ErrorBox>;
    } else {
      return <ErrorBox styling={this.props.styling}>
        {this.props.message ? <div>{this.props.message}</div> : <div>Something went wrong.</div>}
        {this.state.error && ErrorBoundary.formatErrorDetailWithMessage(this.state.error)}
      </ErrorBox>;
    }
  }

  render() {
    console.log("HERE3");
    console.log(this.props);
    console.log(this.state);
    if (!navigator.onLine) {
      return <ErrorBox styling={this.props.styling}>
        You are offline, check your connection.
      </ErrorBox>;
    } else if (this.props.displayEagerly || this.state.displayError) {
      if (this.props.rethrowError(this.state.error)) {
        throw this.state.error;
      }
      return this.formatError();
    } else {
      return this.props.children;
    }
  }
}