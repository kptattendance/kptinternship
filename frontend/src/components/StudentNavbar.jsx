// src/components/StudentNavbar.jsx
import { UserButton } from "@clerk/clerk-react";
import AppNavbar from "./AppNavbar";

const TABS = [
  { name: "Home", path: "/" },
  { name: "My Profile", path: "/dashboard" },
  { name: "Apply", path: "/internship-application-submit" },
  { name: "Application Status", path: "/internship-application-status" },
];

export default function StudentNavbar() {
  return <AppNavbar tabs={TABS} actions={<UserButton afterSignOutUrl="/" />} />;
}
