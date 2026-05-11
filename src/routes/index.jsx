import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
// import Signup from "../pages/Signup.jsx";
// import React from "react";
// import Login from "../pages/Login.jsx";
// import EmployeeDashboard from "../pages/EmployeeDashboard.jsx";
// import ManagerDashboard from "../pages/ManagerDashboard.jsx";
// import HomeRedirect from "../components/HomeRedirect.jsx";
// import TeamPlanDetails from "../pages/TeamPlanDetails.jsx";
// import ReportGeneration from "../pages/ReportGeneration.jsx";
// import RoleProtectedRoute from "../routes/RoleProtectedRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // children: [
    //   {
    //     index: true,
    //     element: <HomeRedirect />,
    //   },
    // ],
  },
]);

export default router;