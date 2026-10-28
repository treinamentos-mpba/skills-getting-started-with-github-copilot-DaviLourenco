document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();
      const selectedActivity = activitySelect.value;

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("div");
        participantsHeading.className = "participants-heading";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participantes";

        const participantsCount = document.createElement("span");
        participantsCount.className = "participant-count";
        participantsCount.textContent = details.participants.length;

        participantsHeading.append(participantsTitle, participantsCount);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participants-empty";
          emptyMessage.textContent = "Nenhum participante ainda";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((participantData) => {
            const participant = document.createElement("li");

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = `${participantData.participantName} (${participantData.email})`;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.title = `Remover inscrição de ${participantData.email} em ${name}`;
            removeButton.setAttribute("aria-label", `Remover inscrição de ${participantData.email} em ${name}`);
            removeButton.innerHTML = `
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
              </svg>
            `;
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const deleteResponse = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?${new URLSearchParams({ email: participantData.email })}`,
                  { method: "DELETE" }
                );
                const result = await deleteResponse.json();

                if (!deleteResponse.ok) {
                  throw new Error(result.detail || "Não foi possível remover a inscrição");
                }

                await fetchActivities();
                messageDiv.textContent = result.message;
                messageDiv.className = "message success";
              } catch (error) {
                removeButton.disabled = false;
                messageDiv.textContent = error.message || "Não foi possível remover a inscrição";
                messageDiv.className = "message error";
              }

              messageDiv.classList.remove("hidden");
            });

            participant.className = "participant-item";
            participant.append(participantEmail, removeButton);
            participantsList.appendChild(participant);
          });
        }

        participantsSection.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      activitySelect.value = selectedActivity;
    } catch (error) {
      activitiesList.innerHTML = "<p>Não foi possível carregar as atividades. Tente novamente mais tarde.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const participantName = document.getElementById("participantName").value;
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?${new URLSearchParams({ email, participantName })}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Ocorreu um erro";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Não foi possível fazer a inscrição. Tente novamente.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
