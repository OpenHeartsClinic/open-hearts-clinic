const DEFAULT_ADMIN_EMAIL = "admin@openhearts.com";
const DEFAULT_ADMIN_PASSWORD = "OpenHearts123!";
const STORAGE_KEY = "open-hearts-bookings";
const ADMIN_SESSION_KEY = "open-hearts-admin-session";
const STORAGE_RESET_KEY = "open-hearts-storage-reset-v1";

const config = window.OPEN_HEARTS_CONFIG || {};
const firebaseConfig = config.firebase || {};
const emailConfig = config.emailjs || {};
const brandingConfig = config.branding || {};
const runtimeMode = config.mode || "demo";
const adminEmail = config.adminEmail || DEFAULT_ADMIN_EMAIL;

const bookingForm = document.getElementById("booking-form");
const formResponse = document.getElementById("form-response");
const openAdminButton = document.getElementById("open-admin");
const closeAdminButton = document.getElementById("close-admin");
const adminModal = document.getElementById("admin-modal");
const adminLoginForm = document.getElementById("admin-login-form");
const adminResponse = document.getElementById("admin-response");
const adminLoginView = document.getElementById("admin-login-view");
const adminDashboardView = document.getElementById("admin-dashboard-view");
const bookingsList = document.getElementById("bookings-list");
const bookingCount = document.getElementById("booking-count");
const pendingCount = document.getElementById("pending-count");
const acceptedCount = document.getElementById("accepted-count");
const declinedCount = document.getElementById("declined-count");
const adminLogout = document.getElementById("admin-logout");
const bookingFilters = document.getElementById("booking-filters");
const detailsModal = document.getElementById("details-modal");
const closeDetailsButton = document.getElementById("close-details");
const detailsContent = document.getElementById("details-content");
const emailModal = document.getElementById("email-modal");
const closeEmailButton = document.getElementById("close-email");
const emailSummary = document.getElementById("email-summary");
const emailMessage = document.getElementById("email-message");
const sendEmailButton = document.getElementById("send-email");
const emailNote = document.getElementById("email-note");
const emailModalTitle = document.getElementById("email-modal-title");
const emailLogoImage = document.querySelector(".email-logo");
const emailPreviewLogo = document.querySelector(".email-preview-logo");
const emailPreviewBody = document.getElementById("email-preview-body");

let currentFilter = "all";
let selectedBookingId = null;
let selectedEmailMode = "accepted";
let lastLoadedBookings = [];
let services = {
  mode: "demo",
  firebaseReady: false,
  emailReady: false,
  auth: null,
  db: null,
};


function applyBranding() {
  if (!emailLogoImage) {
    return;
  }

  const logoSrc = brandingConfig.logoUrl || "./assets/hero-support.svg";
  emailLogoImage.src = logoSrc;
  emailLogoImage.alt = "Open Hearts logo";

  if (emailPreviewLogo) {
    emailPreviewLogo.src = logoSrc;
    emailPreviewLogo.alt = "Open Hearts logo";
  }
}

function renderEmailPreview() {
  if (!emailPreviewBody) {
    return;
  }

  emailPreviewBody.textContent = emailMessage.value.trim() || "Your message preview will appear here.";
}
function normalizeBooking(booking, index) {
  return {
    id: booking.id || `booking-${Date.now()}-${index}`,
    name: booking.name || "",
    email: booking.email || "",
    phone: booking.phone || "",
    date: booking.date || "",
    time: booking.time || "",
    message: booking.message || "",
    status: booking.status || "pending",
    createdAt: booking.createdAt || "",
    statusUpdatedAt: booking.statusUpdatedAt || "",
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTime(time) {
  if (!time) {
    return "Not provided";
  }

  return time;
}
}

function formatDateTimeLabel(value) {
  return value || "";
}

function buildStatusMeta(booking) {
  if (booking.status === "accepted" && booking.statusUpdatedAt) {
    return `Accepted ${booking.statusUpdatedAt}`;
  }

  if (booking.status === "declined" && booking.statusUpdatedAt) {
    return `Declined ${booking.statusUpdatedAt}`;
  }

  return "Awaiting review";
}

function buildTemplateMessage(booking, mode) {
  if (mode === "declined") {
    return `Open Hearts\nFriendly therapy and support\n\nHello ${booking.name},\n\nThank you for reaching out to Open Hearts. After reviewing your request, we are sorry to let you know that we cannot confirm this session as requested.`n`nDate: ${booking.date}`nTime: ${formatTime(booking.time)}`n`nPlease reply to this email if you would like us to suggest another time or help you with the next step.`n`nPlease note that sessions are scheduled for 30 minutes. If you are more than 10 minutes late, we may need to rearrange the appointment.\n\nKind regards,\nOpen Hearts Team`;
  }

  return `Open Hearts\nFriendly therapy and support\n\nHello ${booking.name},\n\nWelcome to Open Hearts. You have been accepted for your appointment.`n`nDate: ${booking.date}`nTime: ${formatTime(booking.time)}`n`nWe are looking forward to supporting you. If you need to change the time or ask a question before the session, please reply to this email and we will be happy to help.`n`nPlease note that sessions are scheduled for 30 minutes. If you are more than 10 minutes late, we may need to rearrange the appointment.\n\nKind regards,\nOpen Hearts Team`;
}

function buildMailtoLink(booking, mode, message) {
  const subject = encodeURIComponent(
    mode === "declined"
      ? "Open Hearts update on your appointment request"
      : "Your Open Hearts appointment has been accepted"
  );
  const body = encodeURIComponent(message);
  return `mailto:${booking.email}?subject=${subject}&body=${body}`;
}

function hasFirebaseKeys() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function hasEmailJsKeys() {
  return Boolean(emailConfig.publicKey && emailConfig.serviceId);
}

async function initializeServices() {
  if (runtimeMode === "live" && hasFirebaseKeys() && window.firebase) {
    const existingApp = window.firebase.apps && window.firebase.apps.length ? window.firebase.apps[0] : null;
    const app = existingApp || window.firebase.initializeApp(firebaseConfig);
    services.auth = window.firebase.auth(app);
    services.db = window.firebase.firestore(app);
    services.firebaseReady = true;
    services.mode = "live";
  }

  if (hasEmailJsKeys() && window.emailjs) {
    window.emailjs.init({ publicKey: emailConfig.publicKey });
    services.emailReady = true;
  }

  if (!services.firebaseReady) {
    resetDemoStorageOnce();
    services.mode = "demo";
  }
}

function resetDemoStorageOnce() {
  if (!localStorage.getItem(STORAGE_RESET_KEY)) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.setItem(STORAGE_RESET_KEY, "true");
  }
}

function saveAdminSession(isLoggedIn) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(isLoggedIn));
}

function loadAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "false");
  } catch (error) {
    return false;
  }
}

async function getBookings() {
  if (services.firebaseReady) {
    const snapshot = await services.db.collection("bookings").get();
    return snapshot.docs
      .map((doc) => normalizeBooking({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(normalizeBooking);
  } catch (error) {
    return [];
  }
}

async function saveBooking(booking) {
  if (services.firebaseReady) {
    const { id, ...payload } = booking;
    const docRef = await services.db.collection("bookings").add(payload);
    return { ...booking, id: docRef.id };
  }

  const bookings = await getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  return booking;
}

async function persistBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

async function findBookingById(id) {
  if (!id) {
    return null;
  }

  const cached = lastLoadedBookings.find((booking) => booking.id === id);
  if (cached) {
    return cached;
  }

  const bookings = await getBookings();
  return bookings.find((booking) => booking.id === id) || null;
}

async function updateBookingStatus(id, status) {
  const nextUpdatedAt = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  if (services.firebaseReady) {
    await services.db.collection("bookings").doc(id).update({ status, statusUpdatedAt: nextUpdatedAt });
  } else {
    const bookings = await getBookings();
    const target = bookings.find((booking) => booking.id === id);
    if (!target) {
      return null;
    }
    target.status = status;
    target.statusUpdatedAt = nextUpdatedAt;
    await persistBookings(bookings);
  }

  await renderBookings();
  return findBookingById(id);
}

function syncFilterButtons() {
  bookingFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-filter") === currentFilter);
  });
}

function renderBookingActions(booking) {
  if (booking.status === "accepted") {
    return `
      <div class="booking-action-row">
        <button class="action-button accept is-current" type="button" disabled>Accepted</button>
        <button class="action-button decline" type="button" data-compose-email="${booking.id}" data-email-mode="declined">Send decline message</button>
      </div>
    `;
  }

  if (booking.status === "declined") {
    return `
      <div class="booking-action-row">
        <button class="action-button accept" type="button" data-compose-email="${booking.id}" data-email-mode="accepted">Send acceptance message</button>
        <button class="action-button decline is-current" type="button" disabled>Declined</button>
      </div>
    `;
  }

  return `
    <div class="booking-action-row">
      <button class="action-button accept" type="button" data-compose-email="${booking.id}" data-email-mode="accepted">Accept appointment</button>
      <button class="action-button decline" type="button" data-compose-email="${booking.id}" data-email-mode="declined">Decline appointment</button>
    </div>
  `;
}

async function renderBookings() {
  const bookings = await getBookings();
  lastLoadedBookings = bookings.slice();
  const visibleBookings = currentFilter === "all" ? bookings : bookings.filter((booking) => booking.status === currentFilter);

  bookingCount.textContent = String(bookings.length);
  pendingCount.textContent = String(bookings.filter((booking) => booking.status === "pending").length);
  acceptedCount.textContent = String(bookings.filter((booking) => booking.status === "accepted").length);
  declinedCount.textContent = String(bookings.filter((booking) => booking.status === "declined").length);

  if (!bookings.length) {
    bookingsList.innerHTML = '<div class="booking-item"><h3>No bookings yet</h3><p class="booking-message">When people submit the booking form, their requests will appear here.</p></div>';
    return;
  }

  if (!visibleBookings.length) {
    bookingsList.innerHTML = '<div class="booking-item"><h3>No matching bookings</h3><p class="booking-message">Try another filter to view the rest of your appointment requests.</p></div>';
    return;
  }

  bookingsList.innerHTML = visibleBookings
    .map(
      (booking) => `
        <article class="booking-item booking-item-${escapeHtml(booking.status)}">
          <div class="booking-card-top" data-open-details="${booking.id}">
            <div>
              <h3>${escapeHtml(booking.name)}</h3>
              <p class="booking-meta">Date: ${escapeHtml(booking.date)}<br />Time: ${escapeHtml(formatTime(booking.time))}<br />Submitted: ${escapeHtml(booking.createdAt)}</p>
              <p class="booking-state-note">${escapeHtml(buildStatusMeta(booking))}</p>
            </div>
            <span class="booking-status ${escapeHtml(booking.status)}">${escapeHtml(formatStatus(booking.status))}</span>
          </div>
          <div class="booking-contact-row">
            <div class="booking-contact-card">
              <strong>Email</strong>
              <a class="contact-link" href="mailto:${escapeHtml(booking.email)}">${escapeHtml(booking.email)}</a>
            </div>
            <div class="booking-contact-card">
              <strong>Phone</strong>
              <a class="contact-link" href="tel:${escapeHtml(booking.phone)}">${escapeHtml(booking.phone || "Not provided")}</a>
            </div>
          </div>
          <p class="booking-message">${escapeHtml(booking.message)}</p>
          ${renderBookingActions(booking)}
        </article>
      `
    )
    .join("");
}

function openModal(element) {
  element.classList.remove("hidden");
  element.setAttribute("aria-hidden", "false");
}

function closeModal(element) {
  element.classList.add("hidden");
  element.setAttribute("aria-hidden", "true");
}

function openAdminModal() {
  openModal(adminModal);
}

async function showDashboard() {
  adminLoginView.classList.add("hidden");
  adminDashboardView.classList.remove("hidden");
  if (!services.firebaseReady) {
    saveAdminSession(true);
  }
  await renderBookings();
}

function showLogin() {
  adminDashboardView.classList.add("hidden");
  adminLoginView.classList.remove("hidden");
  adminResponse.textContent = "";
  adminLoginForm.reset();
  if (!services.firebaseReady) {
    saveAdminSession(false);
  }
}

async function openDetailsModal(id) {
  const booking = await findBookingById(id);

  if (!booking) {
    return;
  }

  detailsContent.innerHTML = `
    <p class="eyebrow">Appointment Details</p>
    <h2>${escapeHtml(booking.name)}</h2>
    <div class="detail-grid">
      <div class="detail-card"><strong class="detail-label">Status</strong><div class="detail-value">${escapeHtml(formatStatus(booking.status))}</div></div>
      <div class="detail-card"><strong class="detail-label">Updated</strong><div class="detail-value">${escapeHtml(formatDateTimeLabel(booking.statusUpdatedAt) || "Awaiting review")}</div></div>
      <div class="detail-card"><strong class="detail-label">Submitted</strong><div class="detail-value">${escapeHtml(booking.createdAt)}</div></div>
      <div class="detail-card"><strong class="detail-label">Preferred date</strong><div class="detail-value">${escapeHtml(booking.date)}</div></div>
      <div class="detail-card"><strong class="detail-label">Preferred time</strong><div class="detail-value">${escapeHtml(formatTime(booking.time))}</div></div>
      <div class="detail-card"><strong class="detail-label">Email</strong><div class="detail-value">${escapeHtml(booking.email)}</div></div>
      <div class="detail-card"><strong class="detail-label">Phone</strong><div class="detail-value">${escapeHtml(booking.phone || "Not provided")}</div></div>
    </div>
    <div class="detail-card">
      <strong class="detail-label">What they need help with</strong>
      <div class="detail-value">${escapeHtml(booking.message)}</div>
    </div>
  `;

  openModal(detailsModal);
}

async function openEmailComposer(id, mode) {
  const booking = await findBookingById(id);

  if (!booking) {
    return;
  }

  selectedBookingId = id;
  selectedEmailMode = mode;
  emailModalTitle.textContent = mode === "declined" ? "Declined message ready" : "Accepted message ready";
  emailSummary.innerHTML = `
    <div class="detail-card"><strong class="detail-label">Client</strong><div class="detail-value">${escapeHtml(booking.name)}</div></div>
    <div class="detail-card"><strong class="detail-label">Appointment</strong><div class="detail-value">Date: ${escapeHtml(booking.date)}<br />Time: ${escapeHtml(formatTime(booking.time))}</div></div>
    <div class="detail-card"><strong class="detail-label">Status now</strong><div class="detail-value">${escapeHtml(formatStatus(booking.status))}</div></div>
  `;
  emailMessage.value = buildTemplateMessage(booking, mode);
  renderEmailPreview();
  emailNote.textContent = mode === "declined"
    ? "This booking is now marked as declined. You can edit the message before sending."
    : "This booking is now marked as accepted. You can edit the message before sending.";
  openModal(emailModal);
}

async function sendAppointmentEmail(booking, mode, message) {
  if (services.emailReady) {
    const templateId = mode === "declined" ? emailConfig.declinedTemplateId : emailConfig.acceptedTemplateId;

    if (templateId) {
      await window.emailjs.send(emailConfig.serviceId, templateId, {
        company_name: "Open Hearts",
        patient_name: booking.name,
        patient_email: booking.email,
        patient_phone: booking.phone,
        appointment_date: booking.date,
        appointment_time: formatTime(booking.time),
        status_label: formatStatus(mode === "declined" ? "declined" : "accepted"),
        message,
        logo_url: brandingConfig.logoUrl || "",
        reply_to: booking.email,
        to_email: booking.email,
      });
      return "Email sent successfully.";
    }
  }

  window.location.href = buildMailtoLink(booking, mode, message);
  return "Your email app has been opened with the message ready to send.";
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(bookingForm);
  const booking = {
    id: `booking-${Date.now()}`,
    name: formData.get("name")?.toString().trim() || "",
    email: formData.get("email")?.toString().trim() || "",
    phone: formData.get("phone")?.toString().trim() || "",
    date: formData.get("date")?.toString() || "",
    time: formData.get("time")?.toString() || "",
    message: formData.get("message")?.toString().trim() || "",
    status: "pending",
    createdAt: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    statusUpdatedAt: "",
  };

  formResponse.textContent = "Saving your request...";

  try {
    await saveBooking(booking);
    bookingForm.reset();
    formResponse.textContent = services.firebaseReady
      ? "Your free session request has been sent successfully."
      : "Your request has been saved in demo mode on this device. Add Firebase in config.js to make it live across devices.";
  } catch (error) {
    formResponse.textContent = "There was a problem saving your request. Please try again.";
  }
});

openAdminButton.addEventListener("click", openAdminModal);
closeAdminButton.addEventListener("click", () => closeModal(adminModal));
closeDetailsButton.addEventListener("click", () => closeModal(detailsModal));
closeEmailButton.addEventListener("click", () => closeModal(emailModal));

[adminModal, detailsModal, emailModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  if (services.firebaseReady) {
    try {
      const credential = await services.auth.signInWithEmailAndPassword(email, password);
      if ((credential.user && credential.user.email) !== adminEmail) {
        await services.auth.signOut();
        adminResponse.textContent = "That account is not approved for admin access.";
        return;
      }
      await showDashboard();
      return;
    } catch (error) {
      adminResponse.textContent = "Login failed. Check your Firebase admin account details.";
      return;
    }
  }

  if (email === adminEmail && password === DEFAULT_ADMIN_PASSWORD) {
    await showDashboard();
    return;
  }

  adminResponse.textContent = "Login failed. Use the demo admin credentials from the setup guide.";
});

bookingsList.addEventListener("click", async (event) => {
  const composeTrigger = event.target.closest("[data-compose-email]");
  if (composeTrigger) {
    const bookingId = composeTrigger.getAttribute("data-compose-email");
    const mode = composeTrigger.getAttribute("data-email-mode") || "accepted";
    if (bookingId) {
      await openEmailComposer(bookingId, mode);
    }
    return;
  }

  const detailTrigger = event.target.closest("[data-open-details]");
  if (detailTrigger) {
    const bookingId = detailTrigger.getAttribute("data-open-details");
    if (bookingId) {
      await openDetailsModal(bookingId);
    }
  }
});

emailMessage.addEventListener("input", renderEmailPreview);

sendEmailButton.addEventListener("click", async () => {
  const booking = await findBookingById(selectedBookingId);

  if (!booking) {
    emailNote.textContent = "This booking could not be found anymore.";
    return;
  }

  sendEmailButton.disabled = true;
  emailNote.textContent = "Sending message...";

  try {
    const resultMessage = await sendAppointmentEmail(
      booking,
      selectedEmailMode,
      emailMessage.value.trim() || buildTemplateMessage(booking, selectedEmailMode)
    );
    await updateBookingStatus(booking.id, selectedEmailMode === "declined" ? "declined" : "accepted");
    emailNote.textContent = resultMessage;
    setTimeout(() => closeModal(emailModal), 700);
  } catch (error) {
    emailNote.textContent = "The message could not be sent. Check your EmailJS setup or use the fallback mail app flow.";
  } finally {
    sendEmailButton.disabled = false;
  }
});

bookingFilters.addEventListener("click", async (event) => {
  const trigger = event.target.closest("[data-filter]");
  if (!trigger) {
    return;
  }

  currentFilter = trigger.getAttribute("data-filter") || "all";
  syncFilterButtons();
  await renderBookings();
});

adminLogout.addEventListener("click", async () => {
  if (services.firebaseReady && services.auth) {
    await services.auth.signOut();
  }
  showLogin();
});

async function initializePage() {
  applyBranding();
  renderEmailPreview();
  await initializeServices();

  if (services.firebaseReady && services.auth) {
    services.auth.onAuthStateChanged(async (user) => {
      if (user && user.email === adminEmail) {
        await showDashboard();
      } else {
        showLogin();
      }
    });
  } else if (loadAdminSession()) {
    await showDashboard();
  } else {
    showLogin();
  }

  syncFilterButtons();
}

initializePage();

















