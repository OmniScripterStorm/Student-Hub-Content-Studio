# TagSci G11 Content Studio

Visual authoring suite, reviewer block builder, interactive multi-format quiz designer, and curriculum OTA manager for the TagSci G11 Student Hub.

## 🚀 Live Site
- **GitHub Pages URL**: `https://omniscripterstorm.github.io/Student-Hub-Content-Studio/`

## 🛠️ Features
- **Visual Block Canvas**: Drag/drop order, lesson templates, and rich math formatting.
- **Visual LaTeX & Equation Studio**: Standalone offline math preview with symbol palettes and snippet builder.
- **6-in-1 Quiz Builder**: Multiple Choice, True / False, Direct Identification, Numerical with Tolerances, Multi-Select Checkboxes, and Active Recall Flashcards with real-time test simulations.
- **Academic Calendar & Deadlines**: TagSci & DepEd categorization and timeline management.
- **JSON Sync Hub**: Export production `updates.json`, `.md` files, or test remote OTA endpoints.

## 📦 Architecture & Build
- `src/`: Modular ES6 source files (data, components, equation modal, quiz engine, reviewer studio, JSON hub).
- `build.py`: Python bundler that inlines all modular components into a standalone single-file `index.html`.
- `index.html`: Standalone production build for offline and GitHub Pages deployment.

```bash
# To rebuild after editing src/:
python build.py
```
