import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import Skeleton from "./components/pages/Skeleton";
import NotFound from "./components/pages/NotFound";
import Gallery from "./components/Gallery";
import Profile from "./components/pages/Profile";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { GoogleOAuthProvider } from "@react-oauth/google";

//TODO: DONE - REPLACE WITH YOUR OWN CLIENT_ID
const GOOGLE_CLIENT_ID = "99548937462-ju96p61ngch1n4qt79iq076ltvjnfcv6.apps.googleusercontent.com";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Skeleton />} />
      <Route path="gallery" element={<Gallery />} />
      <Route path="profile" element={<Profile />} />
      <Route path="profile/:userId" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

// renders React Component "Root" into the DOM element with ID "root"
ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <RouterProvider router={router} />
  </GoogleOAuthProvider>
);
