
  # MVP веб-сервиса аналитики

  This is a code bundle for MVP веб-сервиса аналитики. The original project is available at https://www.figma.com/design/zEArxs9hej7TejEfdAaNdB/MVP-%D0%B2%D0%B5%D0%B1-%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D0%B0-%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B8.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Running with Docker

  Development mode (Vite with hot reload):

  Run `docker compose up --build`

  Open `http://localhost:5173`

  Production build (Nginx):

  Run `docker build --target prod -t queryai-front .`

  Run `docker run --rm -p 8080:80 queryai-front`

  Open `http://localhost:8080`
  
