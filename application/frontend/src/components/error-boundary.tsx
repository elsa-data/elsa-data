import React, { ReactNode } from "react";
import { Base7807Error } from "@umccr/elsa-types/error-types";
import axios from "axios";


export type ErrorDisplayProps = {
  children? : React.ReactNode
  message?: ReactNode;
  // Should this component be displayed even if no error has been thrown.
  displayEagerly?: boolean;
  error?: any;
};

export type ErrorDisplayState = {
  error?: any;
};

/**
 * Display an error message on throw.
 */
export class ErrorBoundary extends React.Component<ErrorDisplayProps, ErrorDisplayState> {
  constructor(props: ErrorDisplayProps) {
    super(props);
    this.state = { error: props.error };
  }

  static getDerivedStateFromError(error: any): ErrorDisplayState {
    return { error: error };
  }

  formatError(): JSX.Element | undefined {
    const error = this.state.error;
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
      } else if (error instanceof Error) {
        return <div>{error.message}</div>;
      } else {
        return <div>{error}</div>
      }
    }
  }

  render() {
    if (this.props.displayEagerly || this.state.error) {
      return (
        <div className="p-4 mx-4 my-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {this.props.message ? <div>{this.props.message}</div> : <div>Something went wrong.</div>}
          <br></br>
          {this.state.error && this.formatError()}
        </div>
      );
    } else {
      return this.props.children;
    }
  }
}