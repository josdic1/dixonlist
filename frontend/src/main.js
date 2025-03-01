import './style.css'

const API_URL = import.meta.env.VITE_API_URL;

async function fetchTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    const tasks = await response.json();
    console.log(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

fetchTasks();
