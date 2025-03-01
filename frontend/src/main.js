import './style.css'

const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, ""); // Remove trailing slash

async function fetchTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const tasks = await response.json();

    // ✅ Render the tasks in the UI
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = ""; // Clear previous list

    tasks.forEach(task => {
      const li = document.createElement("li");
      li.textContent = task.task;
      taskList.appendChild(li);
    });

    console.log("Tasks loaded successfully:", tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

// Call fetchTasks when page loads
fetchTasks();
