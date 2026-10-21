import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    const payload = {
      error: error.message,
      stack: isDev ? error.stack : undefined,
      componentStack: isDev ? errorInfo.componentStack : undefined,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      source: "react-error-boundary",
    };

    console.error("[ErrorBoundary]", error.message);
    if (isDev) {
      console.error(error.stack);
      console.error("Component stack:", errorInfo.componentStack);
    }

    fetch("/api/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      const isDev =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#f9fafb",
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            padding: "2.5rem",
            maxWidth: "42rem",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}>
            <div style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="#dc2626"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", color: "#111827" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>

            {isDev && this.state.error && (
              <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                <div style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#991b1b", marginBottom: "0.25rem" }}>
                    Error
                  </p>
                  <p style={{ color: "#b91c1c", fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {this.state.error.message}
                  </p>
                </div>
                {this.state.error.stack && (
                  <div style={{
                    borderRadius: "0.5rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                  }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                      Stack Trace
                    </p>
                    <pre style={{
                      color: "#4b5563",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      maxHeight: "12rem",
                      overflowY: "auto",
                      margin: 0,
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                {this.state.errorInfo && (
                  <div style={{
                    borderRadius: "0.5rem",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "0.75rem",
                  }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                      Component Stack
                    </p>
                    <pre style={{
                      color: "#4b5563",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      maxHeight: "12rem",
                      overflowY: "auto",
                      margin: 0,
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
