import type { Metadata } from "next";
import FamilyOfficeHome from "@/components/home/FamilyOfficeHome";

export const metadata: Metadata = {
  title: "MDC Capital Holdings | Family Office & Operating Holdings",
  description:
    "MDC Capital Holdings is a private holding company and family office–style platform focused on long-term stewardship of operating businesses.",
};

export default function HomePage() {
  return <FamilyOfficeHome />;
}
