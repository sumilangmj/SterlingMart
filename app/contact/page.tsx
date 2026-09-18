import type { Metadata } from "next";
import { ContactPage } from "@/components/storefront/contact-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactRoute() {
  return <ContactPage />;
}
