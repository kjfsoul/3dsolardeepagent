'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ThreeJSErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ThreeJSErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  webglError: boolean;
}

/**
 * Specialized Error Boundary for Three.js Components
 * Handles WebGL errors, memory issues, and rendering failures
 */
export class ThreeJSErrorBoundary extends Component<ThreeJSErrorBoundaryProps, ThreeJSErrorBoundaryState> {
  constructor(props: ThreeJSErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      webglError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ThreeJSErrorBoundaryState> {
    const isWebGLError = error.message.includes('WebGL') || 
                         error.message.includes('canvas') ||
                         error.message.includes('context') ||
                         error.message.includes('renderer');

    return {
      hasError: true,
      error,
      webglError: isWebGLError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThreeJSErrorBoundary] Three.js error caught:', error);
    console.error('[ThreeJSErrorBoundary] Error info:', errorInfo);

    // Check for specific Three.js error patterns
    if (error.message.includes('BufferGeometry') || error.message.includes('NaN')) {
      console.error('[ThreeJSErrorBoundary] Geometry error detected - likely invalid position data');
    }

    if (error.message.includes('WebGL')) {
      console.error('[ThreeJSErrorBoundary] WebGL error detected - hardware/context issue');
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      webglError: false,
    });
  };

  private handleFallbackMode = () => {
    // Switch to 2D fallback mode
    console.log('[ThreeJSErrorBoundary] Switching to 2D fallback mode');
    this.handleRetry();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-gray-800 rounded-lg p-6 border border-orange-500">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-orange-400">3D Rendering Error</h1>
                <p className="text-gray-300">The 3D visualization encountered an issue</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="bg-gray-900 rounded p-3 text-sm">
                <div className="text-orange-400 mb-1">
                  <strong>Error:</strong> {this.state.error?.message}
                </div>
                {this.state.webglError && (
                  <div className="text-yellow-400 text-xs mt-2">
                    This appears to be a WebGL/hardware issue. Try refreshing the page or using a different browser.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Retry 3D View
              </button>
              <button
                onClick={this.handleFallbackMode}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Use 2D Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ThreeJSErrorBoundary;
