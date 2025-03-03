import './style.css';

const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const filterSelect = document.getElementById("filter-select");
const sortDueDateButton = document.getElementById("sort-due-date");
const submitButton = taskForm.querySelector('button[type="submit"]');

let inEditMode = false;
let currentTaskId = null;

// ✅ Fetch tasks from API
async function fetchTasks(status = "") {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    let tasks = await response.json();
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    renderTasks(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    // Implement user error display
  }
}

// ✅ Render tasks in UI
function renderTasks(tasks) {
  taskList.innerHTML = ""; // Clear previous list

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.dataset.taskId = task.id; // Use data attribute
    li.innerHTML = `
      <strong>${task.task}</strong>  
      <p>📂 Status: ${task.status}</p>
      <p>📍 Room: ${task.room || "N/A"}</p>
      <p>📅 Due: ${task.due_date ? new Date(task.due_date).toDateString() : "No due date"}</p>
      <p>📝 ${task.description || "No description"}</p>
      
      <button class="edit-btn">✏️ Edit</button>
      <button class="delete-btn">🗑 Delete</button>
    `;
    taskList.appendChild(li);
  });
}

// ✅ Event delegation for task actions
taskList.addEventListener("click", async (event) => {
  const target = event.target;
  const taskLi = target.closest("li");
  if (!taskLi) return; // Clicked outside a task item

  const taskId = taskLi.dataset.taskId;

  if (target.classList.contains("delete-btn")) {
    await deleteTask(taskId);
  } else if (target.classList.contains("edit-btn")) {
    enterEditMode(taskId);
  }
});

// ✅ Add/Update task
taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const taskData = {
    task: document.getElementById("task-name").value,
    status: document.getElementById("task-status").value,
    room: document.getElementById("task-room").value,
    due_date: document.getElementById("task-due-date").value,
    description: document.getElementById("task-desc").value,
  };

  try {
    if (inEditMode) {
      await fetch(`${API_URL}/tasks/${currentTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      inEditMode = false;
      submitButton.textContent = "Add Task";
    } else {
      await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
    }

    fetchTasks();
    taskForm.reset();
  } catch (error) {
    console.error("Error:", error);
    // Implement user error display.
  }
});

// ✅ Delete a task
async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Failed to delete task`);

    document.querySelector(`li[data-task-id="${id}"]`).remove();
  } catch (error) {
    console.error("Error deleting task:", error);
    //Implement user error display.
  }
}

// ✅ Enter edit mode
function enterEditMode(id) {
  inEditMode = true;
  currentTaskId = id;
  submitButton.textContent = "Update Task";

  const taskLi = document.querySelector(`li[data-task-id="${id}"]`);
  document.getElementById("task-name").value = taskLi.querySelector("strong").textContent;
  document.getElementById("task-status").value = taskLi.querySelector("p:nth-child(2)").textContent.replace("📂 Status: ", "");
  document.getElementById("task-room").value = taskLi.querySelector("p:nth-child(3)").textContent.replace("📍 Room: ", "") === "N/A" ? "" : taskLi.querySelector("p:nth-child(3)").textContent.replace("📍 Room: ", "");
  document.getElementById("task-due-date").value = taskLi.querySelector("p:nth-child(4)").textContent.replace("📅 Due: ", "") === "No due date" ? "" : taskLi.querySelector("p:nth-child(4)").textContent.replace("📅 Due: ", "");
  document.getElementById("task-desc").value = taskLi.querySelector("p:nth-child(5)").textContent.replace("📝 ", "") === "No description" ? "" : taskLi.querySelector("p:nth-child(5)").textContent.replace("📝 ", "");
}

// ✅ Sort tasks by due date
async function sortTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error("HTTP error!");

    let tasks = await response.json();
    tasks.sort((a, b) => (a.due_date && b.due_date) ? new Date(a.due_date) - new Date(b.due_date) : (a.due_date ? -1 : 1));

    renderTasks(tasks);
  } catch (error) {
    console.error("Error sorting tasks:", error);
    //Implement user error display.
  }
}

// ✅ Filter tasks by status
filterSelect.addEventListener("change", (event) => {
  fetchTasks(event.target.value);
});

// ✅ Load tasks on page load and add button listeners.
function init() {
  fetchTasks();
  sortDueDateButton.addEventListener("click", sortTasks);
}

window.addEventListener("DOMContentLoaded", init);