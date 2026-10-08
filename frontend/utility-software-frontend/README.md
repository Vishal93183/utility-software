# Utility Software - React Frontend

Backend (Spring Boot) port 8081 par chalu hona chahiye.

```bash
npm install
npm run dev     # http://localhost:5173
```

- Dev server `/api/*` ko `http://localhost:8081` par proxy karta hai (vite.config.js), isliye CORS ka issue nahi aayega.
- Backend alag URL par ho to `.env` me `VITE_API_URL=http://host:port` set karo.
- Production build: `npm run build` (output `dist/`).
