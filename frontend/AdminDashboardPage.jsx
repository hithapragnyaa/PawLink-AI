
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Cloud,
  AlertCircle,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api, clearSession, getErrorMessage } from "./api.js";
import "./AdminDashboard.css";
import AnimalManagement from "./AnimalManagement.jsx";
import RescueReportManagement from "./RescueReportManagement.jsx";

const getList = (response, key) =>
  response?.data?.data?.[key] ??
  (Array.isArray(response?.data?.data) ? response.data.data : []);

const formatStatus = (value) =>
  String(value || "UNKNOWN").replaceAll("_", " ");

const dateLabel = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

function StatCard({ title, value, detail, icon: Icon, tone }) {
  return (
    <article className={`admin-stat ${tone}`}>
      <div className="admin-stat-top">
        <span>{title}</span>
        <span className="admin-stat-icon">
          <Icon size={21} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function StatusPill({ value }) {
  const status = String(value || "UNKNOWN").toLowerCase();

  return (
    <span
      className={`admin-status status-${status.replaceAll("_", "-")}`}
    >
      {formatStatus(value)}
    </span>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [activeSection, setActiveSection] = useState("Overview");

  const loadDashboard = useCallback(
    async (initial = false) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const results = await Promise.allSettled([
          api.get("/auth/me"),
          api.get("/animals"),
          api.get("/rescue-reports"),
          api.get("/users"),
        ]);

        const messages = [];

        // Verify the current session and administrator role.
        if (results[0].status === "fulfilled") {
          const currentUser = results[0].value.data?.data?.user;

          setUser(currentUser || null);

          if (currentUser?.role !== "ADMINISTRATOR") {
            clearSession();
            navigate("/login", { replace: true });
            setErrors([
              "This workspace is only available to administrators.",
            ]);
            return;
          }
        } else {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        // Load animals.
        if (results[1].status === "fulfilled") {
          setAnimals(getList(results[1].value, "animals"));
        } else {
          messages.push(
            `Animals: ${getErrorMessage(results[1].reason)}`
          );
        }

        // Load rescue reports.
        if (results[2].status === "fulfilled") {
          setReports(getList(results[2].value, "reports"));
        } else {
          messages.push(
            `Rescue reports: ${getErrorMessage(results[2].reason)}`
          );
        }

        // Load organization users.
        if (results[3].status === "fulfilled") {
          setUsers(getList(results[3].value, "users"));
        } else {
          messages.push(
            `Users: ${getErrorMessage(results[3].reason)}`
          );
        }

        setErrors(messages);
      } catch (error) {
        setErrors([getErrorMessage(error)]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear the local session even if the request fails.
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  const openSection = (section) => {
    setActiveSection(section);

    document.getElementById("admin-data-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <PawPrint size={30} />
        <p>Preparing your PawLink workspace...</p>
      </div>
    );
  }

  const activeAnimals = animals.filter(
    (animal) =>
      !["ADOPTED", "DECEASED", "RELEASED"].includes(
        String(animal.status || "").toUpperCase()
      )
  ).length;

  const openReports = reports.filter(
    (report) =>
      !["CLOSED", "RESOLVED", "REJECTED"].includes(
        String(report.status || "").toUpperCase()
      )
  ).length;

  const firstName =
    user?.firstName || user?.first_name || "Administrator";

  const recentReports = [...reports]
    .sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt || 0) -
        new Date(a.created_at || a.createdAt || 0)
    )
    .slice(0, 6);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-logo">
          <span className="admin-logo-mark">
            <PawPrint size={23} />
          </span>
          <span>
            PawLink <b>AI</b>
            <small>WELFARE WORKSPACE</small>
          </span>
        </a>

        <div className="admin-nav-label">WORKSPACE</div>

        <nav className="admin-nav">
          <button
            className={activeSection === "Overview" ? "selected" : ""}
            onClick={() => {
              setActiveSection("Overview");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>

          <button
            className={activeSection === "Animals" ? "selected" : ""}
            onClick={() => openSection("Animals")}
          >
            <PawPrint size={18} />
            Animals
          </button>

          <button
            className={
              activeSection === "Rescue reports" ? "selected" : ""
            }
            onClick={() => openSection("Rescue reports")}
          >
            <ClipboardList size={18} />
            Rescue reports
            {openReports > 0 && (
              <span className="admin-nav-count">{openReports}</span>
            )}
          </button>

          <button
            className={activeSection === "Team" ? "selected" : ""}
            onClick={() => openSection("Team")}
          >
            <Users size={18} />
            Team members
          </button>
          
          
<button
  className=""
  onClick={() => navigate("/aws-rescue-events")}
>
  <Cloud size={18} />
  AWS Rescue Events
</button>

<button
  className=""
  onClick={() => navigate("/aws-response-teams")}
>
  <Users size={18} />
  AWS Response Teams
</button>


        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-org-card">
            <ShieldCheck size={19} />
            <div>
              <strong>Organization workspace</strong>
              <small>Access is organization-scoped</small>
            </div>
          </div>

          <button className="admin-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-breadcrumb">
              Workspace / Administration
            </div>
            <h1>
              Overview <span>✳</span>
            </h1>
          </div>

          <div className="admin-top-actions">
            <button
              className="admin-icon-button"
              aria-label="Refresh dashboard"
              onClick={() => loadDashboard(false)}
              disabled={refreshing}
            >
              <RefreshCw
                size={18}
                className={refreshing ? "admin-spinning" : ""}
              />
            </button>

            <div className="admin-profile">
              <div className="admin-avatar">
                {(
                  user?.firstName?.[0] ||
                  user?.first_name?.[0] ||
                  "A"
                ).toUpperCase()}
              </div>
              <div>
                <strong>
                  {[
                    user?.firstName || user?.first_name,
                    user?.lastName || user?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Administrator"}
                </strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-welcome">
          <div>
            <span className="admin-eyebrow">
              YOUR IMPACT, AT A GLANCE
            </span>
            <h2>
              Hello, {firstName}! <span>🐾</span>
            </h2>
            <p>
              Here's what's happening across{" "}
              {user?.organizationName ||
                user?.organization_name ||
                "your organization"}
              .
            </p>
          </div>

          <div className="admin-welcome-art">
            <Heart size={44} />
          </div>
        </section>

        {errors.length > 0 && (
          <div className="admin-error" role="alert">
            <AlertCircle size={19} />
            <div>
              <strong>
                Some dashboard data could not be loaded.
              </strong>
              {errors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
            <button
              onClick={() => loadDashboard(false)}
              aria-label="Retry"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        )}

        <section className="admin-stats-grid">
          <StatCard
            title="Animals registered"
            value={animals.length}
            detail={`${activeAnimals} not marked adopted, deceased or released`}
            icon={PawPrint}
            tone="lavender"
          />

          <StatCard
            title="Rescue reports"
            value={reports.length}
            detail={`${openReports} not marked closed, resolved or rejected`}
            icon={ClipboardList}
            tone="peach"
          />

          <StatCard
            title="Team members"
            value={users.length}
            detail="Accounts in your organization"
            icon={Users}
            tone="mint"
          />

          <StatCard
            title="Workspace status"
            value="Active"
            detail="Authenticated administrator session"
            icon={Activity}
            tone="blue"
          />
        </section>

        <section
          id="admin-data-section"
          className="admin-data-section"
        >
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">
                LIVE ORGANIZATION DATA
              </span>
              <h2>
                {activeSection === "Overview"
                  ? "Recent rescue reports"
                  : activeSection}
              </h2>
              <p>
                Information returned by your PawLink AI backend.
              </p>
            </div>

            <button
              className="admin-refresh-button"
              onClick={() => loadDashboard(false)}
              disabled={refreshing}
            >
              <RefreshCw size={15} />
              Refresh data
            </button>
          </div>

          {activeSection === "Team" ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Team member</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>
                          {[
                            member.first_name || member.firstName,
                            member.last_name || member.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Unnamed user"}
                        </strong>
                      </td>
                      <td>{formatStatus(member.role)}</td>
                      <td>{member.email || "—"}</td>
                      <td>
                        <StatusPill value={member.status} />
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="admin-empty">
                        No users returned by the API.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSection === "Animals" ? (
            <AnimalManagement
              onChanged={() => loadDashboard(false)}
            />
          ) : activeSection === "Rescue reports" ? (
            <RescueReportManagement
              onChanged={() => loadDashboard(false)}
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Animal</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reported on</th>
                  </tr>
                </thead>

                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>
                          {formatStatus(
                            report.animal_type || report.animalType
                          )}
                        </strong>
                      </td>
                      <td>
                        {report.address ||
                          report.location ||
                          "Location not provided"}
                      </td>
                      <td>
                        <StatusPill
  value={
    report.predicted_priority ||
    report.priority ||
    report.priority_level ||
    "PENDING"
  }
/>
                      </td>
                      <td>
                        <StatusPill
                          value={report.status || "REPORTED"}
                        />
                      </td>
                      <td>
                        {dateLabel(
                          report.created_at || report.createdAt
                        )}
                      </td>
                    </tr>
                  ))}

                  {recentReports.length === 0 && (
                    <tr>
                      <td colSpan="5" className="admin-empty">
                        No rescue reports have been submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-table-footer">
            <span>
              {activeSection === "Team"
                ? `Showing ${users.length} team member(s)`
                : activeSection === "Animals"
                  ? `Showing ${animals.length} animal(s)`
                  : activeSection === "Rescue reports"
                    ? "Rescue report management"
                    : `Showing ${recentReports.length} recent report(s)`}
            </span>

            <span>
              <span className="admin-live-dot" />
              API connected when requests succeed
            </span>
          </div>
        </section>

        <footer className="admin-footer">
          <span>
            Made with <Heart size={13} /> for every paw.
          </span>
          <span>PawLink AI · Administrator workspace</span>
        </footer>
      </main>
    </div>
  );
}
