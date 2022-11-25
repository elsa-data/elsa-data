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
          <span>
            <span className="font-bold">type: </span>
            {error7808.type}
          </span>
          <span>
            <span className="font-bold">title: </span>
            {error7808.title}
          </span>
          <span>
            <span className="font-bold">status: </span>
            {error7808.status}
          </span>
          {error7808.detail &&
          <span>
            <span className="font-bold">detail: </span>
            {error7808.detail}
          </span>}
          {error7808.instance &&
          <span>
            <span className="font-bold">instance: </span>
            {error7808.instance}
          </span>}
        </>;
      } else if (axios.isAxiosError(error)) {
        return <>
          <span>
            <span className="font-bold">message: </span>
            {error.message}
          </span>
          <span>
            <span className="font-bold">code: </span>
            {error.code}
          </span>
        </>;
      } else if (error instanceof Error) {
        return <span>{error.message}</span>;
      } else {
        return <span>{error}</span>
      }
    }
  }

  render() {
    if (this.props.displayEagerly || this.state.error) {
      return (
        <div className="p-4 mx-4 my-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {this.props.message ? <span>{this.props.message}</span> : <span>Something went wrong.</span>}
          {this.state.error && this.formatError()}
        </div>
      );
    } else {
      return this.props.children;
    }
  }
}