import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/http";
import SignIn from "./pages/Signin";
import Signup from "./pages/Signup";
import PrivateRoute from "./components/PrivateRoute";
import QRScan from "./pages/QRScan";
import Messages from "./pages/Messages";
import ReloadCheck from "./components/ReloadCheck";

const router = createBrowserRouter([
  {
    element: <ReloadCheck />,
    children: [
      {
        path: "/",
        element: <SignIn />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        element: <PrivateRoute />,
        children: [
          {
            path: "/authcheck",
            element: <QRScan />,
          },
          {
            path: "/messages",
            element: <Messages />,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
