import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useClassroom } from "./context/ClassroomContext";
import { AmpChrome } from "./layouts/AmpChrome";
import { DefenderLayout } from "./layouts/DefenderLayout";
import { AmpFloatingButton } from "./components/AmpFloatingButton";
import { NotepadFloatingButton } from "./components/NotepadFloatingButton";
import { XdrLayout } from "./layouts/XdrLayout";
import { DefenderFloatingButton } from "./components/defender/DefenderFloatingButton";
import { XdrFloatingButton } from "./components/xdr/XdrFloatingButton";
import { AnalysisPage } from "./pages/AnalysisPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { InboxPage } from "./pages/InboxPage";
import { ManagementPage } from "./pages/ManagementPage";
import { OutbreakPage } from "./pages/OutbreakPage";
import { OverviewPage } from "./pages/OverviewPage";
import { TrainingHqPage } from "./pages/TrainingHqPage";
import { DefenderHomePage } from "./pages/defender/DefenderHomePage";
import { DefenderAlertsPage } from "./pages/defender/DefenderAlertsPage";
import { DefenderActionsSubmissionsPage } from "./pages/defender/DefenderActionsSubmissionsPage";
import { DefenderAssetsPage } from "./pages/defender/DefenderAssetsPage";
import { DefenderAttackSimulationPage } from "./pages/defender/DefenderAttackSimulationPage";
import { DefenderCloudDiscoveryPage } from "./pages/defender/DefenderCloudDiscoveryPage";
import { DefenderCloudPoliciesPage } from "./pages/defender/DefenderCloudPoliciesPage";
import { DefenderCustomDetectionRulesPage } from "./pages/defender/DefenderCustomDetectionRulesPage";
import { DefenderEmailExplorerPage } from "./pages/defender/DefenderEmailExplorerPage";
import { DefenderHuntingPage } from "./pages/defender/DefenderHuntingPage";
import { DefenderIdentitiesUsersPage } from "./pages/defender/DefenderIdentitiesUsersPage";
import { DefenderIncidentDetailPage } from "./pages/defender/DefenderIncidentDetailPage";
import { DefenderIncidentsPage } from "./pages/defender/DefenderIncidentsPage";
import { DefenderInvestigationsPage } from "./pages/defender/DefenderInvestigationsPage";
import { DefenderReportsPage } from "./pages/defender/DefenderReportsPage";
import { DefenderSettingsPage } from "./pages/defender/DefenderSettingsPage";
import { DefenderThreatIntelPage } from "./pages/defender/DefenderThreatIntelPage";
import { DefenderVulnerabilityPage } from "./pages/defender/DefenderVulnerabilityPage";
import { LandingLoginPage } from "./pages/LandingLoginPage";
import { NotepadPage } from "./pages/NotepadPage";
import { StudentAccessPage } from "./pages/StudentAccessPage";
import { StudentDeskPage } from "./pages/StudentDeskPage";
import { XdrControlCenterPage } from "./pages/xdr/XdrControlCenterPage";
import { XdrIncidentsPage } from "./pages/xdr/XdrIncidentsPage";
import { XdrInvestigatePage } from "./pages/xdr/XdrInvestigatePage";

type Role = "admin" | "student";

export default function App() {
  const { setSession } = useClassroom();
  const [role, setRole] = useState<Role | null>(null);
  const [studentPending, setStudentPending] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("socRole");
    if (saved === "admin") {
      setRole("admin");
      setSession({ role: "admin", name: "FahimAdmin" });
    }
    if (saved === "student") {
      const studentId = sessionStorage.getItem("socStudentId");
      const studentName = sessionStorage.getItem("socStudentName");
      if (studentId && studentName) {
        setRole("student");
        setSession({ role: "student", studentId, name: studentName });
      } else {
        setStudentPending(true);
      }
    }
  }, []);

  function login(username: string, password: string) {
    if (username === "FahimAdmin" && password === "F123456f@%%") {
      sessionStorage.setItem("socRole", "admin");
      setRole("admin");
      setSession({ role: "admin", name: "FahimAdmin" });
      return true;
    }
    if (username === "FahimStudent" && password === "F123456f@%") {
      setStudentPending(true);
      return true;
    }
    return false;
  }

  function completeStudentLogin(studentId: string, name: string) {
    sessionStorage.setItem("socRole", "student");
    sessionStorage.setItem("socStudentId", studentId);
    sessionStorage.setItem("socStudentName", name);
    setRole("student");
    setStudentPending(false);
    setSession({ role: "student", studentId, name });
  }

  function logout() {
    sessionStorage.removeItem("socRole");
    sessionStorage.removeItem("socStudentId");
    sessionStorage.removeItem("socStudentName");
    setRole(null);
    setStudentPending(false);
    setSession(null);
  }

  if (studentPending && !role) return <StudentAccessPage onProceed={completeStudentLogin} />;
  if (!role) return <LandingLoginPage onLogin={login} />;

  return (
    <>
      <Routes>
        <Route path="/xdr/*" element={<XdrLayout />}>
          <Route index element={<Navigate to="control-center" replace />} />
          <Route path="control-center" element={<XdrControlCenterPage />} />
          <Route path="incidents" element={<XdrIncidentsPage />} />
          <Route path="investigate" element={<XdrInvestigatePage />} />
          <Route path="*" element={<Navigate to="control-center" replace />} />
        </Route>
        <Route path="/defender/*" element={<DefenderLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DefenderHomePage />} />
          <Route path="incidents" element={<DefenderIncidentsPage />} />
          <Route path="incidents/:incidentId" element={<DefenderIncidentDetailPage />} />
          <Route path="alerts" element={<DefenderAlertsPage />} />
          <Route path="email-collab/explorer" element={<DefenderEmailExplorerPage />} />
          <Route path="email-collab/attack-simulation-training" element={<DefenderAttackSimulationPage />} />
          <Route path="cloud-apps/discovery" element={<DefenderCloudDiscoveryPage />} />
          <Route path="cloud-apps/policies" element={<DefenderCloudPoliciesPage />} />
          <Route path="investigations" element={<DefenderInvestigationsPage />} />
          <Route path="hunting" element={<DefenderHuntingPage />} />
          <Route path="hunting/custom-detection-rules" element={<DefenderCustomDetectionRulesPage />} />
          <Route path="actions-submissions" element={<DefenderActionsSubmissionsPage />} />
          <Route path="threat-intelligence" element={<DefenderThreatIntelPage />} />
          <Route path="assets" element={<DefenderAssetsPage />} />
          <Route path="identities/users" element={<DefenderIdentitiesUsersPage />} />
          <Route path="vulnerability-management" element={<DefenderVulnerabilityPage />} />
          <Route path="reports" element={<DefenderReportsPage />} />
          <Route path="settings/endpoints" element={<DefenderSettingsPage />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
        <Route path="/notepad" element={role === "admin" ? <NotepadPage /> : <Navigate to="/inbox" replace />} />
        <Route element={<AmpChrome role={role} onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/training-hq" element={role === "admin" ? <TrainingHqPage /> : <Navigate to="/student-desk" replace />} />
          <Route path="/student-desk" element={role === "student" ? <StudentDeskPage /> : <Navigate to="/training-hq" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/outbreak" element={<OutbreakPage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
      <AmpFloatingButton />
      <DefenderFloatingButton />
      <XdrFloatingButton />
      {role === "admin" ? <NotepadFloatingButton /> : null}
    </>
  );
}
