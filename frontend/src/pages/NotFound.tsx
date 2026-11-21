import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <EmptyState kicker="Error 404" title="Page not found" description="This page doesn't exist, or it has moved.">
      <Link to="/" className="btn-primary">
        Go home
      </Link>
      <Link to="/convert" className="btn-secondary">
        Convert handwriting
      </Link>
    </EmptyState>
  );
}
