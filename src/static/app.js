document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options when reloading
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (Array.isArray(details.participants) ? details.participants.length : 0);

        // Build participants DOM (hide bullets and add unregister button)
        const participants = Array.isArray(details.participants) ? details.participants : [];

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <p><strong>Participants:</strong></p>
          </div>
        `;

        // Append participants list or placeholder
        const participantsContainer = activityCard.querySelector('.participants');
        if (participants.length) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          participants.forEach(p => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'unregister-btn';
            btn.title = 'Unregister participant';
            btn.setAttribute('aria-label', 'Unregister');
            btn.textContent = '✖';
            // store identifiers on dataset for later
            btn.dataset.activity = name;
            btn.dataset.email = p;

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.className = 'no-participants';
          p.textContent = 'No participants yet.';
          participantsContainer.appendChild(p);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Event delegation for unregister buttons
  activitiesList.addEventListener('click', async (event) => {
    const btn = event.target.closest('.unregister-btn');
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!activity || !email) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
      } else {
        messageDiv.textContent = result.detail || 'An error occurred';
        messageDiv.className = 'error';
      }

      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);

      // Refresh activities list to reflect removal
      fetchActivities();
    } catch (err) {
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
      console.error('Error unregistering participant:', err);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh the activities list so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

// Small helper to avoid injecting raw HTML from participant strings
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
