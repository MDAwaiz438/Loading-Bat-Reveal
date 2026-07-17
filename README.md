# Loading Bat Reveal 🦇

A cinematic, Batman-inspired page load transition built with HTML, CSS, and Three.js. 

This project features a swarm of procedurally generated 3D bats that fly across the screen, acting as an animated wipe transition that reveals the webpage content underneath.

## ✨ Features
- **Procedural 3D Bat Swarm**: 200 bats with individualized flight paths, speeds, and wing-flap animations powered by a custom WebGL vertex shader.
- **Dynamic Reveal Masking**: Utilizes a synchronized CSS diagonal wipe mask that chases the bat swarm to reveal the underlying content.
- **Zero Build Tools**: Uses native ES modules and import maps to load Three.js directly from a CDN (unpkg). Just open `index.html` in a local server!
- **Infinite Looping Mode**: Configured by default to continuously loop the bat transition, perfect for showcase purposes.

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MDAwaiz438/Loading-Bat-Reveal.git
   cd Loading-Bat-Reveal
   ```

2. **Run a local web server:**
   Because this project uses ES modules (`type="module"`), you cannot simply open `index.html` directly from the file system (`file://` protocol) due to CORS restrictions. You must serve the folder using a local HTTP server.

   If you have Python installed:
   ```bash
   python -m http.server 8001
   ```

   If you have Node.js / npm installed:
   ```bash
   npx serve .
   ```

3. **View the animation:**
   Open your browser and navigate to `http://localhost:8001` (or whichever port your server provides).

## 🛠️ Technology Stack
- **Three.js (v0.160.0)** - Core 3D library used for instanced mesh rendering.
- **Vanilla JavaScript** - Orchestrating the animation loop and WebGL initialization.
- **CSS3 Transitions** - Handling the black screen wipe mechanics.

## 📂 File Structure
- `index.html`: The main entry point containing the DOM structure and ES module import maps.
- `style.css`: Contains the CSS wipe animation and layout styling.
- `main.js`: The Three.js application logic, custom shader materials, and animation loops.
- `background.png`: The sample background image revealed during the transition.