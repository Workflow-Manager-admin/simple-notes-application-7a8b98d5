import React, { useState, useEffect } from "react";
import "./App.css";

// Single note data structure:
// { id: number, title: string, content: string, created: ISOString, updated: ISOString }

/**
 * Generates a unique id using the current timestamp and a random number.
 */
function genId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

// PUBLIC_INTERFACE
/**
 * Main App component that manages notes and handles theme toggling.
 */
function App() {
  // Theme management (light only, but dark-ready for future expansion)
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /** PUBLIC_INTERFACE
   * Toggle theme between light and dark (future-proof; always light for now)
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Notes state. Persist in localStorage for demo purposes.
  const [notes, setNotes] = useState(() =>
    JSON.parse(localStorage.getItem("notes-app-data") || "[]")
  );
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("notes-app-data", JSON.stringify(notes));
  }, [notes]);

  // Find note by id
  const currentNote = notes.find((n) => n.id === selectedNoteId);

  // Sidebar responsiveness for mobile
  useEffect(() => {
    function onResize() {
      setSidebarOpen(window.innerWidth > 600);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // PUBLIC_INTERFACE
  /** Create a new note (opens in edit mode immediately) */
  const createNote = () => {
    const newNote = {
      id: genId(),
      title: "Untitled Note",
      content: "",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  // PUBLIC_INTERFACE
  /**
   * Update the given note's title/content.
   * @param {object} noteUpdate - Updated note object
   */
  const updateNote = (noteUpdate) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteUpdate.id
          ? { ...noteUpdate, updated: new Date().toISOString() }
          : n
      )
    );
  };

  // PUBLIC_INTERFACE
  /**
   * Delete a note by id.
   * @param {number} id - The note ID to delete
   */
  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  // NOTE: Create, Edit, Delete, List, and Detail all are handled below.

  return (
    <div className="notes-root">
      {/* Sidebar for note navigation */}
      <aside className={`sidebar${sidebarOpen ? "" : " sidebar-collapsed"}`}>
        <div className="sidebar-header">
          <h1 className="brand-title">📝 Notes</h1>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
        <button className="fab" onClick={createNote} title="Add new note">
          ＋
        </button>
        <nav className="notes-list-nav">
          {notes.length === 0 ? (
            <div className="empty-list">No notes yet. Create one!</div>
          ) : (
            <ul className="notes-list">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className={
                    "note-list-item" +
                    (note.id === selectedNoteId ? " selected" : "")
                  }
                  onClick={() => setSelectedNoteId(note.id)}
                  tabIndex={0}
                  aria-current={note.id === selectedNoteId ? "page" : undefined}
                >
                  <div className="note-title">{note.title || <em>No Title</em>}</div>
                  <div className="note-date">
                    {new Date(note.updated).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <footer className="sidebar-footer">
          <small>
            Simple Notes App &copy; 2024
          </small>
        </footer>
      </aside>

      {/* Main content area */}
      <main className="main-content">
        {!currentNote ? (
          <div className="welcome-container">
            <h2>Welcome!</h2>
            <p>Select a note from the sidebar or create a new one.</p>
          </div>
        ) : (
          <NoteDetail
            note={currentNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            onBack={() => setSelectedNoteId(null)}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Note details and editing component.
 * Supports viewing, editing, and deleting a note.
 * @param {object} props
 */
function NoteDetail({ note, updateNote, deleteNote, onBack }) {
  const [editMode, setEditMode] = useState(note.content === "");
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    // If new/untitled note, start in edit mode
    setEditMode(note.content === "");
  }, [note.id]);

  // Handle save
  function onSave(e) {
    e.preventDefault();
    updateNote({ ...note, title: title.trim() || "Untitled Note", content: content.trim() });
    setEditMode(false);
  }

  return (
    <section className="note-detail-section">
      <div className="note-header">
        <button className="back-btn" onClick={onBack} title="Back to list">
          ←
        </button>
        {!editMode && (
          <button className="edit-btn" onClick={() => setEditMode(true)}>
            Edit
          </button>
        )}
        <button
          className="delete-btn"
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to delete this note? This action cannot be undone."
              )
            ) {
              deleteNote(note.id);
            }
          }}
        >
          🗑
        </button>
      </div>
      {editMode ? (
        <form className="note-form" onSubmit={onSave}>
          <input
            className="note-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={64}
            autoFocus
          />
          <textarea
            className="note-content-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            rows={10}
            maxLength={4096}
          />
          <div className="form-actions">
            <button className="save-btn" type="submit">
              Save
            </button>
            <button
              className="cancel-btn"
              type="button"
              onClick={() => {
                setEditMode(false);
                setTitle(note.title);
                setContent(note.content);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <article className="note-detail">
          <h2>{note.title}</h2>
          <div className="note-date detail">
            Last Updated: {new Date(note.updated).toLocaleString()}
          </div>
          <pre className="note-content">{note.content}</pre>
        </article>
      )}
    </section>
  );
}

export default App;
