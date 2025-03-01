import './style.css'

const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, ""); // Remove trailing slash

async function fetchTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const tasks = await response.json();
    console.log(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

fetchTasks();
