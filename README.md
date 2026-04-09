# Micro Frontends Learning

A sample project demonstrating micro-frontend architecture using multiple frameworks (Angular, React, Vue) and module federation.

## Project Structure

```
cross-framework/
  app-host/        # Angular host application
  app-remote-1/    # React remote application
  app-remote-2/    # Vue remote application

same-framework/
  app-host/        # React host application
  app-remote-1/    # React remote application
  app-remote-2/    # React remote application
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Install Dependencies

```bash
# Install dependencies for all apps
cd cross-framework/app-host && npm install
cd ../app-remote-1 && npm install
cd ../app-remote-2 && npm install
cd ../../same-framework/app-host && npm install
cd ../app-remote-1 && npm install
cd ../app-remote-2 && npm install
```

### Running Applications

#### Cross-Framework

- **Angular Host**  
  ```bash
  cd cross-framework/app-host
  npm start
  # or
  ng serve
  ```
  Visit [http://localhost:4200](http://localhost:4200)

- **React Remote**  
  ```bash
  cd cross-framework/app-remote-1
  npm run dev
  ```
  Visit [http://localhost:5173](http://localhost:5173)

- **Vue Remote**  
  ```bash
  cd cross-framework/app-remote-2
  npm run dev
  ```
  Visit [http://localhost:5173](http://localhost:5173) (or as configured)

#### Same-Framework

- **React Host & Remotes**  
  Each app can be started with:
  ```bash
  npm run dev
  ```
  in their respective directories.

## Features

- **Module Federation**: Share code and components between host and remotes.
- **Multiple Frameworks**: Demonstrates integration of Angular, React, and Vue in a single micro-frontend system.
- **Modern Tooling**: Uses Angular CLI, Vite, and ESLint.

## Development

- Use the recommended IDE extensions for each framework (e.g., Volar for Vue, Angular Language Service, etc.).
- For code scaffolding in Angular, use:
  ```bash
  ng generate component <component-name>
  ```
- For React and Vue, follow standard Vite project conventions.

## Build

- **Angular**:  
  ```bash
  ng build
  ```
- **React/Vue**:  
  ```bash
  npm run build
  ```

## License

MIT
