document.addEventListener("DOMContentLoaded", () => {
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
  const taskTableBody = document.querySelector("#task-table-body");
  const taskForm = document.querySelector("#task-form");
  const submitButton = document.querySelector('#task-form button[type="submit"]');
  const toggleFormButton = document.querySelector("#toggle-form");
  const formContainer = document.querySelector("#form-container");
  const filterText = document.querySelector("#filter-text");
  const sortBy = document.querySelector("#sort-by");
  const clearButton = document.querySelector("#button-clear");
  const showUncompletedBtn = document.querySelector("#show-uncompleted");
  const showCompletedBtn = document.querySelector("#show-completed");
  const showOnholdBtn = document.querySelector("#show-onhold");

  let inEditMode = false;
  let currentTaskId = null;
  let allTasks = [];
  let currentFilter = ""; // Track active filter

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
      applyFilterAndSort();
      return allTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  function applyFilterAndSort() {
    let filteredTasks = [...allTasks];

    // Apply status filter based on button
    if (currentFilter === "uncompleted") {
      filteredTasks = filteredTasks.filter(task => task.status === "Not Started" || task.status === "In-Progress");
    } else if (currentFilter === "completed") {
      filteredTasks = filteredTasks.filter(task => task.status === "Completed");
    } else if (currentFilter === "onhold") {
      filteredTasks = filteredTasks.filter(task => task.status === "On-Hold");
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

    // Apply sorting (due_date first, then status)
    const sortValue = sortBy.value;
    filteredTasks.sort((a, b) => {
      if (sortValue === "due_date") {
        const dateA = new Date(a.due_date || "9999-12-31");
        const dateB = new Date(b.due_date || "9999-12-31");
        return dateA - dateB || statusOrder(a.status) - statusOrder(b.status);
      } else if (sortValue === "status") {
        return statusOrder(a.status) - statusOrder(b.status) ||
          (new Date(a.due_date || "9999-12-31") - new Date(b.due_date || "9999-12-31"));
      }
      return 0;
    });

    renderTasks(filteredTasks);
  }

  // Define status order for sorting
  function statusOrder(status) {
    const order = { "Not Started": 0, "In-Progress": 1, "On-Hold": 2, "Completed": 3 };
    return order[status] ?? 4; // Unknown statuses go last
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

    try {
      const method = inEditMode ? "PUT" : "POST";
      const endpoint = inEditMode ? `${API_URL}/tasks/${currentTaskId}` : `${API_URL}/tasks`;
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error(`Failed to ${method === "PUT" ? "update" : "add"} task. Status: ${response.status}`);
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

    document.getElementById("task-name").value = task.task || "";
    document.getElementById("task-status").value = task.status || "";
    document.getElementById("task-room").value = task.room || "";
    document.getElementById("task-due-date").value = task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "";
    document.getElementById("task-desc").value = task.description || "";

    formContainer.style.display = "block";
    toggleFormButton.textContent = "Hide Form";
  }

  // Event listeners for filter buttons
  showUncompletedBtn.addEventListener("click", () => {
    currentFilter = "uncompleted";
    applyFilterAndSort();
  });

  showCompletedBtn.addEventListener("click", () => {
    currentFilter = "completed";
    applyFilterAndSort();
  });

  showOnholdBtn.addEventListener("click", () => {
    currentFilter = "onhold";
    applyFilterAndSort();
  });

  // Event listeners for existing controls
  sortBy.addEventListener("change", applyFilterAndSort);
  filterText.addEventListener("input", applyFilterAndSort);
  clearButton.addEventListener("click", () => {
    currentFilter = "";
    sortBy.value = "due_date"; // Default sort
    filterText.value = "";
    applyFilterAndSort();
  });

  fetchTasks();
});