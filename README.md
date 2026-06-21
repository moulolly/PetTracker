# Funky Pet Tracker 🐾

A vibrant, mobile-friendly web application for tracking your pets' daily habits. This app was built using **Vanilla HTML, CSS, and JavaScript** with no build tools or local servers required. It's designed to be simple, fast, and completely offline-capable.

## Features

- **Track Multiple Pets**: Add multiple pets, each with their own profile picture and timeline.
- **Log Daily Habits**:
  - **Feeding**: Log how much your pet ate (Finished, Half, Nibbled).
  - **Peeing**: Log the size (Large, Medium, Small, Spot).
  - **Pooing**: Log the consistency (Hard, Firm, Soft, Runny).
- **Edit & Delete**: Tap any logged event in the timeline to add comments or delete it.
- **Calendar View**: Look back at your pet's history on any given day.
- **Local Storage**: All data is saved directly in your browser using IndexedDB. No external database is needed!
- **Data Export & Import**: Export your data to a JSON file to create backups or transfer to another device.

## How to Run

Because this app uses zero build tools, running it is incredibly simple:

1. Clone or download this repository.
2. Open the folder on your computer.
3. Double-click the `index.html` file to open it in your browser.
4. That's it!

> **Note**: For security reasons, some browsers (like Firefox) may block database access when running files directly via the `file:///` protocol. If you experience this, the app will fall back to "in-memory" mode (data resets on refresh). To fix this, use Google Chrome, or serve the folder using a basic local web server (e.g., `npx serve`).

## Tech Stack

- **HTML5**: Single `index.html` file acting as a Single Page Application.
- **CSS3**: Vanilla CSS in `styles.css` utilizing modern glassmorphism UI/UX design.
- **JavaScript (ES6)**: Vanilla JS in `app.js` using raw DOM manipulation and `IndexedDB` for data storage. No frameworks or npm dependencies!
- **Icons**: Embedded SVG vectors.

## Contributing

Feel free to fork the repository and submit pull requests if you want to add new features or fix bugs!
