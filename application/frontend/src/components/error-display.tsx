import React, { ReactNode } from "react";

export type ErrorDisplayProps = {
  children? : React.ReactNode
  message?: ReactNode;
  // Should this component be displayed even if no error has been thrown.
  displayEagerly?: boolean;
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
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: any) {
    return { error: error };
  }

  render() {
    if (this.props.displayEagerly || this.state.error !== undefined) {
      return this.props.message ? (
        <div className="p-4 mx-4 my-3 text-sm text-red-700 bg-red-100 rounded-lg">
          <span>{this.props.message}</span>
        </div>
      ) : null;
    } else {
      return this.props.children;
    }
  }
}