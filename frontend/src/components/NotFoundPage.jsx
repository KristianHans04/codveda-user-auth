import { Link } from "react-router-dom";

export function NotFoundPage() {
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
        maxWidth: "28rem",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      }}>
        <h1 style={{ fontSize: "4rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.5rem" }}>
          404
        </h1>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/login"
          style={{
            display: "inline-block",
            padding: "0.625rem 1.5rem",
            borderRadius: "0.5rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
