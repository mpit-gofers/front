import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { LoadingScreen } from "./components/LoadingScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ReportsLibrary } from "./components/ReportsLibrary";
import { ReportView } from "./components/ReportView";
import { RootLayout } from "./components/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "loading/:queryId", Component: LoadingScreen },
      { path: "result/:queryId", Component: ResultScreen },
      { path: "reports", Component: ReportsLibrary },
      { path: "report/:reportId", Component: ReportView },
    ],
  },
]);
