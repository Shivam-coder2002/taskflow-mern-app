import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [name, setName] = useState(localStorage.getItem("name") || "");

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("name", data.name);
    setToken(data.token);
    setName(data.name);
  };
  const logout = () => {
    localStorage.clear();
    setToken(null);
  };

  return (
    <div className="container">
      <h1>TaskFlow</h1>
      {token ? <Tasks token={token} name={name} onLogout={logout} /> : <AuthForm onLogin={login} />}
    </div>
  );
}

function AuthForm({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`${API}/auth/${isRegister ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    res.ok ? onLogin(data) : setError(data.message);
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={submit} className="card">
      <h2>{isRegister ? "Create account" : "Log in"}</h2>
      {isRegister && <input name="name" placeholder="Name" onChange={change} required />}
      <input name="email" type="email" placeholder="Email" onChange={change} required />
      <input name="password" type="password" placeholder="Password (6+ characters)" onChange={change} required />
      {error && <p className="error">{error}</p>}
      <button type="submit">{isRegister ? "Register" : "Log in"}</button>
      <p className="link" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
      </p>
    </form>
  );
}

function Tasks({ token, name, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/tasks`, { headers })
      .then((r) => (r.status === 401 ? onLogout() : r.json()))
      .then((d) => Array.isArray(d) && setTasks(d));
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`${API}/tasks`, { method: "POST", headers, body: JSON.stringify({ title }) });
    const task = await res.json();
    setTasks([task, ...tasks]);
    setTitle("");
  };

  const toggle = async (t) => {
    const res = await fetch(`${API}/tasks/${t._id}`, { method: "PUT", headers, body: JSON.stringify({ done: !t.done }) });
    const updated = await res.json();
    setTasks(tasks.map((x) => (x._id === t._id ? updated : x)));
  };

  const remove = async (id) => {
    await fetch(`${API}/tasks/${id}`, { method: "DELETE", headers });
    setTasks(tasks.filter((t) => t._id !== id));
  };

  return (
    <div>
      <div className="bar">
        <span>Hi, {name}</span>
        <button className="small" onClick={onLogout}>Log out</button>
      </div>
      <form onSubmit={addTask} className="row">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a new task" />
        <button type="submit">Add</button>
      </form>
      {tasks.length === 0 && <p className="muted">No tasks yet.</p>}
      {tasks.map((t) => (
        <div key={t._id} className="task">
          <span className={t.done ? "done" : ""} onClick={() => toggle(t)}>{t.title}</span>
          <button className="small danger" onClick={() => remove(t._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
