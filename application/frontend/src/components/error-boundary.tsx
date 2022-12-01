import { Component, ReactNode } from "react";
import { Base7807Error } from "@umccr/elsa-types/error-types";
import classNames from "classnames";
import axios from "axios";

export type ErrorDisplayProps = {
  children? : ReactNode
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
};

export type ErrorBoxProps = {
  children?: ReactNode;
  styling?: string;
}

export const ErrorBox = ({ children, styling }: ErrorBoxProps): JSX.Element => {
  return <div className={classNames("p-4 flex place-content-center text-sm text-red-700 bg-red-100", styling)}>
    {children}
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
    this.state = { error: props.error };
  }

  static getDerivedStateFromError(error: any): ErrorDisplayState {
    return { error: error };
  }

  static isAuthenticationError(error: any): boolean {
    return (error instanceof Base7807Error && error.status == 403) ||
      (axios.isAxiosError(error) && error.code === "403");
  }

  static formatErrorDetail(error: any): JSX.Element | undefined {
    if (error !== undefined) {
      if (error instanceof Base7807Error) {
        const error7808 = error.toResponse();
        return <>
          <div>
            <span className="font-bold">type: </span>
            {error7808.type}
          </div>
          <div>
            <span className="font-bold">title: </span>
            {error7808.title}
          </div>
          <div>
            <span className="font-bold">status: </span>
            {error7808.status}
          </div>
          {error7808.detail &&
          <div>
            <span className="font-bold">detail: </span>
            {error7808.detail}
          </div>}
          {error7808.instance &&
          <div>
            <span className="font-bold">instance: </span>
            {error7808.instance}
          </div>}
        </>;
      } else if (axios.isAxiosError(error)) {
        if (error.response?.data instanceof Base7807Error) {
          return this.formatErrorDetail(error.response.data);
        } else {
          return <>
            <div>
              <span className="font-bold">message: </span>
              {error.message}
            </div>
            <div>
              <span className="font-bold">code: </span>
              {error.code}
            </div>
          </>;
        }
      } else if (error instanceof Error) {
        return <div>{error.message}</div>;
      } else {
        return <div>{error}</div>
      }
    }
  }

  formatError() : JSX.Element | undefined {
    if (ErrorBoundary.isAuthenticationError(this.state.error)) {
      return <ErrorBox styling={this.props.styling}>
        Failed to authenticate, check your crendentials.
        <br></br>
        Here are some details:
        {this.state.error && ErrorBoundary.formatErrorDetail(this.state.error)}
      </ErrorBox>;
    } else {
      return <ErrorBox styling={this.props.styling}>
        {this.props.message ? <div>{this.props.message}</div> : <div>Something went wrong.</div>}
        <br></br>
        Here are some details:
        {this.state.error && ErrorBoundary.formatErrorDetail(this.state.error)}
      </ErrorBox>;
    }
  }

  render() {
    if (!navigator.onLine) {
      return <ErrorBox styling={this.props.styling}>
        You are offline, check your connection.
      </ErrorBox>;
    } else if (this.props.displayEagerly || (this.state.error !== undefined && this.state.error !== null)) {
      if (this.props.rethrowError(this.state.error)) {
        throw this.state.error;
      }
      return this.formatError();
    } else {
      return this.props.children;
    }
  }
}