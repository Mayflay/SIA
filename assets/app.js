let currentRole = "";
let currentPage = "dashboard";
let authMode = "login";
let currentCalendarMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
);

const roleLabels = {
  admin: "Dentist Admin",
  staff: "Staff",
  patient: "Patient",
};
let currentUser = null;

const navigation = {
  admin: [
    ["dashboard", "Dashboard"],
    ["appointments", "Appointments"],
    ["patients", "Patients"],
    ["settings", "Settings"],
  ],
  staff: [
    ["dashboard", "Dashboard"],
    ["appointments", "Appointments"],
    ["patients", "Patients"],
  ],
  patient: [
    ["dashboard", "Home"],
    ["book", "Book Appointment"],
    ["my-appointments", "My Visits"],
    ["profile", "Profile"],
  ],
};

function openAuth(role) {
  currentRole = role;
  document.getElementById("authRole").textContent = roleLabels[role];
  document.getElementById("authIcon").textContent = roleLabels[role].charAt(0);
  document.getElementById("authModal").classList.add("active");
  showLoginForm();
}

function closeAuth() {
  document.getElementById("authModal").classList.remove("active");
}

function showLoginForm() {
  authMode = "login";
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
  document.getElementById("nameField").classList.add("hidden");
  document.getElementById("confirmField").classList.add("hidden");
  document.getElementById("authName").required = false;
  document.getElementById("authConfirm").required = false;
  document.getElementById("authTitle").textContent = "Welcome back";
  document.getElementById("authSubtitle").textContent =
    "Login with your registered account.";
  document.getElementById("authSubmit").textContent = "Login";
}

function showRegisterForm() {
  authMode = "register";
  document.getElementById("registerTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("nameField").classList.remove("hidden");
  document.getElementById("confirmField").classList.remove("hidden");
  document.getElementById("authName").required = true;
  document.getElementById("authConfirm").required = true;
  document.getElementById("authTitle").textContent = "Create account";
  document.getElementById("authSubtitle").textContent =
    "Register before logging in.";
  document.getElementById("authSubmit").textContent = "Create Account";
}

async function submitAuth(event) {
  event.preventDefault();

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  if (authMode === "register") {
    const name = document.getElementById("authName").value.trim();
    const confirm = document.getElementById("authConfirm").value;
    if (!name || password !== confirm) {
      alert("Enter your full name and make sure the passwords match.");
      return;
    }
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    try {
      const response = await fetch("api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: currentRole }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.message || "Registration failed.");
        return;
      }

      alert("Account created. Please log in with your new account.");
      document.getElementById("authEmail").value = email;
      document.getElementById("authPassword").value = "";
      document.getElementById("authName").value = "";
      document.getElementById("authConfirm").value = "";
      showLoginForm();
    } catch (error) {
      alert(
        "Could not reach the server. Check that Apache and MySQL are running.",
      );
    }
    return;
  }

  try {
    const response = await fetch("api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: currentRole }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(
        result.message || "Login failed. Register first or check your details.",
      );
      return;
    }
    enterApp(result.user);
  } catch (error) {
    alert(
      "Could not reach the server. Check that Apache and MySQL are running.",
    );
  }
}
function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function enterApp(account) {
  currentRole = account.role;
  currentUser = {
    id: account.user_id,
    name: account.full_name,
    email: account.email,
    role: roleLabels[account.role],
    initials: getInitials(account.full_name),
  };

  closeAuth();
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  updateUser();
  renderNavigation();
  currentPage = "dashboard";
  navigate("dashboard");
  updateDate();
}

async function logout() {
  try {
    await fetch("api/logout.php", { method: "POST" });
  } catch (error) {
    // Clear the local screen even if the server is unavailable.
  }

  currentUser = null;
  currentRole = "";
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("authEmail").value = "";
  document.getElementById("authPassword").value = "";
  document.getElementById("authName").value = "";
  document.getElementById("authConfirm").value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateUser() {
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent = currentUser.role;
  document.getElementById("userAvatar").textContent = currentUser.initials;
}
function renderNavigation() {
  const nav = document.getElementById("mainNavigation");

  nav.innerHTML = navigation[currentRole]
    .map((item) => {
      return `
                <button class="nav-item" id="nav-${item[0]}" onclick="navigate('${item[0]}')">
                    ${item[1]}
                </button>
            `;
    })
    .join("");
}

function navigate(page) {
  currentPage = page;

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.remove("active");
  });

  const activeButton = document.getElementById(`nav-${page}`);

  if (activeButton) {
    activeButton.classList.add("active");
  }

  renderPage();
}

function renderPage() {
  const content = document.getElementById("pageContent");

  const pages = {
    dashboard: dashboardPage,
    appointments: appointmentsPage,
    patients: patientsPage,
    book: bookPage,
    "my-appointments": myAppointmentsPage,
    notifications: notificationsPage,
    profile: profilePage,
    settings: settingsPage,
  };

  const pageFunction = pages[currentPage];

  if (pageFunction) {
    content.innerHTML = pageFunction();
  }

  setTitle();
}

function setTitle() {
  const titles = {
    dashboard: ["Dashboard", "Welcome to your clinic dashboard."],
    appointments: ["Appointments", "View and manage clinic appointments."],
    patients: ["Patients", "Manage patient information and records."],
    book: ["Book Appointment", "Schedule your next dental visit."],
    "my-appointments": ["My Visits", "View your upcoming and previous visits."],
    notifications: ["Notifications", "View your latest clinic updates."],
    profile: ["Profile", "Manage your personal information."],
    settings: ["Settings", "Manage system settings."],
  };

  const data = titles[currentPage] || titles.dashboard;

  document.getElementById("pageTitle").textContent = data[0];
  document.getElementById("pageDescription").textContent = data[1];
}

function updateDate() {
  const date = new Date();

  document.getElementById("headerDate").textContent = date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );
}

function dashboardPage() {
  const user = currentUser;

  if (currentRole === "patient") {
    return `
            <div class="dashboard-welcome">
                <span>Patient Portal</span>
                <h2>Welcome back, ${user.name.split(" ")[0]}.</h2>
                <p>Manage your dental appointments and clinic information.</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span>Upcoming Visit</span>
                    <strong>01</strong>
                    <small>Scheduled appointment</small>
                </div>

                <div class="stat-card">
                    <span>Past Visits</span>
                    <strong>04</strong>
                    <small>Completed appointments</small>
                </div>

                
            </div>

            <div class="content-grid">
                <div class="panel">
                    <div class="panel-header">
                        <h3>Your next appointment</h3>
                        <span>CONFIRMED</span>
                    </div>

                    <div class="appointment-row">
                        <div class="appointment-time">10:30 AM</div>

                        <div class="appointment-person">
                            <strong>Dr. Maria Meija</strong>
                            <span>Dental Cleaning · October 8, 2026</span>
                        </div>

                        <div class="status">Confirmed</div>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <h3>Quick actions</h3>
                    </div>

                    <div class="action-grid">
                        <button class="action-card" onclick="navigate('book')">
                            <strong>Book Visit</strong>
                            <span>Schedule a new appointment.</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  return `
        <div class="dashboard-welcome">
            <span>${user.role}</span>
            <h2>Good day, ${user.name.split(" ")[0]}.</h2>
            <p>Here is your clinic overview for today.</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <span>Appointments</span>
                <strong>12</strong>
                <small>Scheduled today</small>
            </div>

            <div class="stat-card">
                <span>Patients</span>
                <strong>86</strong>
                <small>Registered patients</small>
            </div>

            
        </div>

        <div class="content-grid">

            <div class="panel">
                <div class="panel-header">
                    <h3>Today's appointments</h3>
                    <span>VIEW ALL</span>
                </div>

                <div class="appointment-list">

                    <div class="appointment-row">
                        <div class="appointment-time">09:00 AM</div>
                        <div class="appointment-person">
                            <strong>Juan Dela Cruz</strong>
                            <span>Dental Cleaning</span>
                        </div>
                        <div class="status">Confirmed</div>
                    </div>

                    <div class="appointment-row">
                        <div class="appointment-time">10:30 AM</div>
                        <div class="appointment-person">
                            <strong>Maria Santos</strong>
                            <span>Dental Check-up</span>
                        </div>
                        <div class="status">Pending</div>
                    </div>

                    <div class="appointment-row">
                        <div class="appointment-time">01:00 PM</div>
                        <div class="appointment-person">
                            <strong>Pedro Garcia</strong>
                            <span>Tooth Extraction</span>
                        </div>
                        <div class="status">Confirmed</div>
                    </div>

                    <div class="appointment-row">
                        <div class="appointment-time">03:30 PM</div>
                        <div class="appointment-person">
                            <strong>Sofia Reyes</strong>
                            <span>Dental Consultation</span>
                        </div>
                        <div class="status">Pending</div>
                    </div>

                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <h3>Quick actions</h3>
                </div>

                <div class="action-grid">
                    <button class="action-card" onclick="navigate('appointments')">
                        <strong>Appointments</strong>
                        <span>Review today's schedule.</span>
                    </button>

                    <button class="action-card" onclick="navigate('patients')">
                        <strong>Patients</strong>
                        <span>View patient records.</span>
                    </button>

                    <button class="action-card" onclick="navigate('notifications')">
                        <strong>Notifications</strong>
                        <span>Check recent updates.</span>
                    </button>
                </div>
            </div>

        </div>
    `;
}

function appointmentsPage() {
  const isPatient = currentRole === "patient";

  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const monthName = currentCalendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const appointmentsByDay = isPatient
    ? {
        8: [
          {
            time: "10:30 AM",
            patient: "Dr. Maria Meija",
            service: "Dental Cleaning",
            status: "Confirmed",
          },
        ],
        15: [
          {
            time: "02:00 PM",
            patient: "Dr. Maria Meija",
            service: "Check-up",
            status: "Completed",
          },
        ],
      }
    : {
        5: [
          {
            time: "09:00 AM",
            patient: "Juan Dela Cruz",
            service: "Dental Cleaning",
            status: "Confirmed",
          },
        ],
        12: [
          {
            time: "10:30 AM",
            patient: "Maria Santos",
            service: "Dental Check-up",
            status: "Pending",
          },
        ],
        18: [
          {
            time: "01:00 PM",
            patient: "Pedro Garcia",
            service: "Tooth Extraction",
            status: "Confirmed",
          },
        ],
        25: [
          {
            time: "03:30 PM",
            patient: "Sofia Reyes",
            service: "Consultation",
            status: "Pending",
          },
        ],
      };
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    let day;
    let outsideMonth = false;
    if (index < firstWeekday) {
      day = previousMonthDays - firstWeekday + index + 1;
      outsideMonth = true;
    } else if (index >= firstWeekday + daysInMonth) {
      day = index - firstWeekday - daysInMonth + 1;
      outsideMonth = true;
    } else {
      day = index - firstWeekday + 1;
    }

    const appointments = outsideMonth ? [] : appointmentsByDay[day] || [];
    const todayClass =
      !outsideMonth && isCurrentMonth && day === today.getDate()
        ? " is-today"
        : "";
    const appointmentMarkup = appointments
      .map(
        (appointment) => `
      <div class="calendar-event ${appointment.status === "Pending" ? "is-pending" : appointment.status === "Completed" ? "is-completed" : ""}">
        <strong>${appointment.time}</strong>
        <span>${appointment.patient}</span>
        <small>${appointment.service}</small>
      </div>
    `,
      )
      .join("");

    cells.push(`
      <div class="calendar-day${outsideMonth ? " is-outside" : ""}${todayClass}">
        <span class="calendar-day-number">${day}</span>
        ${appointmentMarkup}
      </div>
    `);
  }

  return `
    <div class="page-card calendar-card">
      <div class="calendar-toolbar">
        <div>
          <h3>${isPatient ? "My Visits Calendar" : "Appointment Calendar"}</h3>
          <p>${isPatient ? "View your upcoming and previous dental visits." : "View the clinic schedule by month."}</p>
        </div>
        <div class="calendar-controls">
          <button type="button" class="secondary-button" onclick="changeCalendarMonth(-1)" aria-label="Previous month">‹</button>
          <strong class="calendar-month-label">${monthName}</strong>
          <button type="button" class="secondary-button" onclick="changeCalendarMonth(1)" aria-label="Next month">›</button>
          <button type="button" class="secondary-button calendar-today" onclick="goToCalendarToday()">Today</button>
          ${isPatient ? `<button type="button" class="primary-button" onclick="navigate('book')">Book New Visit</button>` : ""}
        </div>
      </div>
      <div class="calendar-grid" role="grid" aria-label="${isPatient ? "My visits" : "Appointments"} for ${monthName}">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => `<div class="calendar-weekday" role="columnheader">${weekday}</div>`).join("")}
        ${cells.join("")}
      </div>
      ${isPatient ? `<div class="calendar-legend"><span><i></i> Confirmed</span><span class="completed-legend"><i></i> Completed</span></div>` : `<div class="calendar-legend"><span><i></i> Confirmed</span><span class="pending-legend"><i></i> Pending</span></div>`}
    </div>
  `;
}

function changeCalendarMonth(offset) {
  currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + offset);
  renderPage();
}

function goToCalendarToday() {
  const today = new Date();
  currentCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  renderPage();
}
function patientsPage() {
  return `
        <div class="page-card">
            <div class="panel-header">
                <div>
                    <h3>Patient Records</h3>
                    <p>View registered patients in the clinic.</p>
                </div>

                <button class="primary-button" onclick="demoMessage('Add patient feature is available in the prototype.')">
                    Add Patient
                </button>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Contact</th>
                        <th>Last Visit</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>Juan Dela Cruz</td>
                        <td>juan@email.com</td>
                        <td>October 1, 2026</td>
                        <td><span class="status">Active</span></td>
                    </tr>

                    <tr>
                        <td>Maria Santos</td>
                        <td>maria@email.com</td>
                        <td>September 28, 2026</td>
                        <td><span class="status">Active</span></td>
                    </tr>

                    <tr>
                        <td>Pedro Garcia</td>
                        <td>pedro@email.com</td>
                        <td>September 22, 2026</td>
                        <td><span class="status">Active</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function bookPage() {
  return `
    <div class="page-card">
      <h3>Book a Dental Appointment</h3>
      <p>Choose your preferred service and schedule.</p>
      <form onsubmit="demoSubmit(event)">
        <div class="form-grid">
          <div class="input-field">
            <label for="appointmentService">Dental Service</label>
            <select id="appointmentService" required>
              <option value="">Select service</option>
              <option>Dental Cleaning</option>
              <option>Dental Check-up</option>
              <option>Tooth Extraction</option>
              <option>Dental Consultation</option>
              <option>Oral Examination</option>
            </select>
          </div>
          <div class="input-field">
            <label for="appointmentDate">Date</label>
            <input id="appointmentDate" type="date" required>
          </div>
          <div class="input-field">
            <label for="appointmentTime">Preferred Time</label>
            <input id="appointmentTime" type="time" lang="en-US" step="900" required>
            <small class="field-hint">Use the time field arrows to adjust the time and AM/PM.</small>
          </div>
          <div class="input-field full-field">
            <label for="appointmentReason">Reason for Visit</label>
            <textarea id="appointmentReason" placeholder="Enter additional information"></textarea>
          </div>
          <div class="full-field">
            <button class="primary-button" type="submit">Submit Appointment</button>
          </div>
        </div>
      </form>
    </div>
  `;
}
function myAppointmentsPage() {
  return appointmentsPage();
}

function notificationsPage() {
  return `
        <div class="page-card">
            <h3>Notifications</h3>
            <p>Recent updates from the clinic.</p>

            <div class="info-list" style="margin-top:20px;">

                <div class="info-item">
                    <span>Today</span>
                    <strong>Your dental appointment is confirmed for October 8, 2026.</strong>
                </div>

                <div class="info-item">
                    <span>September 30</span>
                    <strong>A new clinic schedule has been posted.</strong>
                </div>

            </div>
        </div>
    `;
}

function profilePage() {
  const user = currentUser;

  return `
        <div class="profile-layout">

            <div class="profile-card">
                <div class="profile-avatar">${user.initials}</div>
                <h3>${user.name}</h3>
                <p>${user.role}</p>
            </div>

            <div class="page-card">
                <h3>Personal Information</h3>
                <p>Your account information.</p>

                <div class="info-list" style="margin-top:20px;">

                    <div class="info-item">
                        <span>Full Name</span>
                        <strong>${user.name}</strong>
                    </div>

                    <div class="info-item">
                        <span>Email Address</span>
                        <strong>${user.email}</strong>
                    </div>

                    <div class="info-item">
                        <span>Account Type</span>
                        <strong>${user.role}</strong>
                    </div>

                </div>
            </div>

        </div>
    `;
}

function settingsPage() {
  return `
        <div class="page-card">
            <h3>System Settings</h3>
            <p>Manage basic clinic system preferences.</p>

            <div class="form-grid">

                <div class="input-field">
                    <label>Clinic Name</label>
                    <input type="text" value="Meija-Domingo Dental Clinic">
                </div>

                <div class="input-field">
                    <label>Clinic Contact</label>
                    <input type="text" value="0912 345 6789">
                </div>

                <div class="input-field">
                    <label>Clinic Email</label>
                    <input type="email" value="clinic@clinick.com">
                </div>

                <div class="input-field">
                    <label>Clinic Hours</label>
                    <input type="text" value="8:00 AM - 5:00 PM">
                </div>

                <div class="full-field">
                    <button class="primary-button" onclick="demoMessage('Settings saved successfully.')">
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    `;
}

function demoSubmit(event) {
  event.preventDefault();
  alert("Appointment submitted successfully. This is a prototype.");
}

function demoMessage(message) {
  alert(message);
}

document.addEventListener("DOMContentLoaded", () => {
  updateDate();
});
