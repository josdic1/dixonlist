document.addEventListener("DOMContentLoaded", () => {
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
  const taskTableBody = document.querySelector("#task-table-body");
  const taskForm = document.querySelector("#task-form");
  const submitButton = document.querySelector('#task-form button[type="submit"]');
  const toggleFormButton = document.querySelector("#toggle-form");
  const formContainer = document.querySelector("#form-container");
  const filterStatus = document.querySelector("#filter-status");
  const sortBy = document.querySelector("#sort-by");
  const filterText = document.querySelector("#filter-text");
  const clearButton = document.querySelector("#button-clear");

  let inEditMode = false;
  let currentTaskId = null;
  let allTasks = []; // Store all tasks for filtering/sorting

  formContainer.style.display = "block";

  toggleFormButton.addEventListener("click", () => {
    formContainer.style.display = formContainer.style.display === "none" ? "block" : "none";
    toggleFormButton.textContent = formContainer.style.display === "none" ? "Show Form" : "Hide Form";
  });

  async function fetchTasks() {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      allTasks = await response.json();
      console.log("Fetched tasks:", allTasks);
      applyFilterAndSort();
      return allTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  function applyFilterAndSort() {
    let filteredTasks = [...allTasks];

    // Apply status filter
    const statusValue = filterStatus.value;
    if (statusValue) {
      filteredTasks = filteredTasks.filter(task => task.status === statusValue);
    }

    // Apply text filter
    const searchText = filterText.value.toLowerCase().trim();
    if (searchText) {
      filteredTasks = filteredTasks.filter(task =>
        (task.task?.toLowerCase().includes(searchText) || '') ||

        (task.room?.toLowerCase().includes(searchText) || '') ||
        (task.description?.toLowerCase().includes(searchText) || '')
      );
    }

    // Apply sorting
    const sortValue = sortBy.value;
    filteredTasks.sort((a, b) => {
      switch (sortValue) {
        case "due_date":
          return (new Date(a.due_date || "9999-12-31") - new Date(b.due_date || "9999-12-31"));

        case "status":
          return (a.status || "").localeCompare(b.status || "");

        default:
          return 0;
      }
    });

    renderTasks(filteredTasks);
  }

  function renderTasks(tasks) {
    taskTableBody.innerHTML = "";
    tasks.forEach(task => {
      const row = document.createElement("tr");
      const cleanedDescription = (task.description || "").trim();
      let descriptionButton = "";
      if (cleanedDescription.match(/^https?:\/\//)) {
        descriptionButton = `<button class="info-btn" onclick="window.open('${cleanedDescription}', '_blank')">Link</button>`;
      } else if (cleanedDescription) {
        descriptionButton = `<button class="info-btn" onclick="showPopup('${cleanedDescription.replace(/'/g, "\\'")}')">More Info</button>`;
      }

      row.innerHTML = `
        <td>${task.task || ""}</td>

        <td>${task.status || ""}</td>
        <td>${task.room || ""}</td>
        <td>${task.due_date ? new Date(task.due_date).toDateString() : ""}</td>
        <td>${descriptionButton}</td>
        <td>
          <div class="action-buttons">
            <button class="edit-btn" data-id="${task.id}">Edit</button>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
          </div>
        </td>
      `;
      row.dataset.task = JSON.stringify(task);
      taskTableBody.appendChild(row);
    });
  }

  window.showPopup = function (description) {
    const existingPopup = document.querySelector(".popup-overlay");
    if (existingPopup) existingPopup.remove();
    const popup = document.createElement("div");
    popup.classList.add("popup-overlay");
    popup.innerHTML = `
      <div class="popup">
        <p style="word-wrap: break-word;">${description}</p>
        <button class="close-popup">Close</button>
      </div>
    `;
    document.body.appendChild(popup);
    popup.addEventListener("click", (event) => {
      if (event.target.classList.contains("popup-overlay") || event.target.classList.contains("close-popup")) {
        popup.remove();
      }
    });
  };

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const taskData = {
      task: document.getElementById("task-name").value.trim(),

      status: document.getElementById("task-status").value.trim(),
      room: document.getElementById("task-room").value.trim() || null,
      due_date: document.getElementById("task-due-date").value || null,
      description: document.getElementById("task-desc").value.trim() || null,
    };
    console.log("Submitting task data:", taskData);

    try {
      const method = inEditMode ? "PUT" : "POST";
      const endpoint = inEditMode ? `${API_URL}/tasks/${currentTaskId}` : `${API_URL}/tasks`;
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error(`Failed to ${method === "PUT" ? "update" : "add"} task. Status: ${response.status}`);
      const result = await response.json();
      console.log("Server response:", result);
      inEditMode = false;
      submitButton.textContent = "Add Task";
      taskForm.reset();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  });

  taskTableBody.addEventListener("click", async (event) => {
    const target = event.target;
    const taskId = target.dataset.id;

    if (target.classList.contains("delete-btn")) {
      await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE" });
      fetchTasks();
    } else if (target.classList.contains("edit-btn")) {
      enterEditMode(taskId);
    }
  });

  function enterEditMode(id) {
    inEditMode = true;
    currentTaskId = id;
    submitButton.textContent = "Update Task";

    const row = document.querySelector(`button[data-id="${id}"]`).closest("tr");
    const task = JSON.parse(row.dataset.task);
    console.log("Editing task:", task);

    document.getElementById("task-name").value = task.task || "";

    document.getElementById("task-status").value = task.status || "";
    document.getElementById("task-room").value = task.room || "";
    document.getElementById("task-due-date").value = task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "";
    document.getElementById("task-desc").value = task.description || "";

    formContainer.style.display = "block";
    toggleFormButton.textContent = "Hide Form";
  }

  // Add event listeners for filter and sort controls
  filterStatus.addEventListener("change", applyFilterAndSort);
  sortBy.addEventListener("change", applyFilterAndSort);
  filterText.addEventListener("input", applyFilterAndSort);
  clearButton.addEventListener("click", () => {
    filterStatus.value = "";
    sortBy.value = "due_date";
    filterText.value = "";
    applyFilterAndSort();
  });

  fetchTasks();
});