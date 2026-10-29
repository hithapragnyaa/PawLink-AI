
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import LoginPage from "./LoginPage.jsx";
import RegisterPage from "./RegisterPage.jsx";
import DashboardPage from "./DashboardPage.jsx";
import AdminDashboardPage from "./AdminDashboardPage.jsx";
import VolunteerAssignmentsPage from "./VolunteerAssignmentsPage.jsx";
import AdoptionPage from "./AdoptionPage.jsx";
import ShelterManagementPage from "./ShelterManagementPage.jsx";
import MedicalRecordsPage from "./MedicalRecordsPage.jsx";
import VeterinarianDashboardPage from "./VeterinarianDashboardPage.jsx";
import AwsRescueEventsPage from "./AwsRescueEventsPage.jsx";
import ReporterDashboardPage from "./ReporterDashboardPage";
import AwsResponseTeamsPage from "./AwsResponseTeamsPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route
          path="/volunteer/assignments"
          element={<VolunteerAssignmentsPage />}
        />
        <Route path="/adoptions" element={<AdoptionPage />} />
        <Route path="/shelters" element={<ShelterManagementPage />} />
        <Route path="/medical-records" element={<MedicalRecordsPage />} />
        <Route
  path="/veterinarian"
  element={<VeterinarianDashboardPage />}
/>
<Route
  path="/aws-rescue-events"
  element={<AwsRescueEventsPage />}
/>
<Route
  path="/aws-response-teams"
  element={<AwsResponseTeamsPage />}
/>
<Route
  path="/reporter"
  element={<ReporterDashboardPage />}
/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
