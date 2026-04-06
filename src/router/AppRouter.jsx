import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "../components/Login";
import { Signup } from "../components/Signup";
import { ForgotPassword } from "../components/ForgotPassword";
import { ResetPassword } from "../components/ResetPassword";
import Home from "../components/User/Home";
import { Navbar } from "../components/User/Navbar";
import { TalentProfile } from "../components/User/TalentProfile";
import { TalentProviderProfile } from "../components/User/TalentProviderProfile";
import { Explore } from "../components/User/Explore";
import { TalentDetails } from "../components/User/TalentDetails";
import { Event } from "../components/User/Event";
import { EventDetails } from "../components/User/EventDetails";
import { PaymentPage } from "../components/User/PaymentPage";
import AdminSidebar from "../components/admin/AdminSidebar";
import { AllUser } from "../components/admin/AllUser";


const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path:"/forgot-password", element:<ForgotPassword />},
  { path:"/reset-password", element:<ResetPassword />},
  { path:"/payment/:bookingId", element:<PaymentPage />},
  { path:"/payment/event/:applicationId", element:<PaymentPage />},


  {
    path: "/", element: <Navbar />,
    children: [
      {
        index: true,element: <Home />,
      },
      {
        path: "/talentprofile", element: <TalentProfile />
      },
      {
        path: "/talentproviderprofile", element: <TalentProviderProfile />
      },
      {
        path: "/explore", element: <Explore />
      },
      {
        path: "/talent/:id", element: <TalentDetails />
      },
      {
        path: "/event", element: <Event />
      },
      {
        path: "/event/:id", element: <EventDetails />
      },
      
      
    ],
  },

]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;