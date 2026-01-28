# Copilot Instructions for Agronegócio Site

## Project Overview
This project is a Node.js/Express web application for managing and displaying content for an agricultural fair. It includes a backend API, admin dashboard, and a public-facing site. The main features are:
- Dynamic home page with banners, event information, and logo carousels
- Gallery management (upload, list, and delete images)
- Expositors (exhibitors) management with sectorized logos
- File uploads for images and documents
- Admin interface for content editing

## Key Architecture
- **Backend:** Node.js with Express (`server.js`)
  - Serves static files from `/public` and `/admin`
  - API endpoints under `/api/` for galleries, home content, and expositors
  - Uses `multer` for file uploads (images, documents)
  - Data is stored in JSON files under `/data` (e.g., `home.json`, `galerias.json`)
- **Frontend:**
  - Public site in `/public` (HTML, CSS, JS)
  - Admin dashboard in `/admin` (HTML, CSS, JS)
  - Assets in `/public/assets/` and `/admin/assets/`
- **Uploads:** All uploaded files are stored in `/uploads` and referenced by relative URLs in JSON data

## Conventions & Workflows
- **API Design:**
  - RESTful endpoints, JSON responses for `/api/*`
  - File uploads use `multipart/form-data` (handled by `multer`)
  - All API errors return `{ success: false, error: ... }`
- **Data Model:**
  - Home page data: `/data/home.json`
  - Gallery data: `/data/galerias.json`
  - Expositors: `/data/expositores.json`
- **File Naming:**
  - Uploaded files are renamed with a timestamp and random number for uniqueness
  - Gallery and expositors images are prefixed by type (e.g., `galeria_`, `expositor_`)
- **Static Files:**
  - Public assets: `/public/assets/`
  - Admin assets: `/admin/assets/`
- **Debugging:**
  - Extensive `[DEBUG]` logs in `server.js` for all major actions
  - Logs are printed to the console and not persisted
- **Error Handling:**
  - Global error middleware ensures all errors return JSON for API routes
  - 404 handler for both API and static routes

## AI Agent Guidance
- **When adding new features:**
  - Follow the RESTful API pattern and update the relevant JSON data files
  - Use `multer` for any new file upload endpoints
  - Place new static assets in the appropriate `/public/assets/` or `/admin/assets/` directory
- **When editing frontend logic:**
  - Place new JS/CSS in the correct assets folder
  - For carousels or dynamic UI, ensure all elements are measured dynamically (see `galeria-dinamica.js`)
- **When updating data models:**
  - Maintain backward compatibility in JSON structure when possible
  - Normalize data on read (see `server.js` for examples)
- **Testing:**
  - Manual testing via the admin dashboard and public site is standard
  - No automated test suite is present
- **Documentation:**
  - Update this file with any new conventions or workflows
  - If adding major features, consider creating a `README.md` in the project root

## Special Notes
- **Logo Carousel:**
  - The logo carousel animation must loop only after all logos are shown. See `public/assets/js/galeria-dinamica.js` for logic.
- **Minimum Sectors:**
  - The first 4 expositors sectors are mandatory and cannot be removed via the API.
- **Uploads:**
  - All uploads are stored in `/uploads` and referenced by relative path in JSON data.
- **Debugging:**
  - Use the `[DEBUG]` logs in `server.js` to trace backend actions.

---
_Last updated: 2024-06_
