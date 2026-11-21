import { FileQuestionMark } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <EmptyState icon={FileQuestionMark} title="Page not found" description="The page you're looking for doesn't exist or has moved.">
      <Link to="/" className="btn-primary">
        Go home
      </Link>
      <Link to="/convert" className="btn-secondary">
        Convert handwriting
      </Link>
    </EmptyState>
  );
}
