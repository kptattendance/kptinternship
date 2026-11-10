// src/components/StudentNavbar.jsx
import { UserButton } from "@clerk/clerk-react";
import AppNavbar from "./AppNavbar";
import useMyApplication from "../hooks/useMyApplication";

const APPLY_TAB = { name: "Apply", path: "/internship-application-submit" };

export default function StudentNavbar() {
  const { loading, hasApplication } = useMyApplication();

  // Once the student has applied, "Apply" is no longer needed
  const tabs = [
    { name: "Home", path: "/" },
    { name: "My Profile", path: "/dashboard" },
    ...(loading || hasApplication ? [] : [APPLY_TAB]),
    { name: "Application Status", path: "/internship-application-status" },
  ];

  return <AppNavbar tabs={tabs} actions={<UserButton afterSignOutUrl="/" />} />;
}
