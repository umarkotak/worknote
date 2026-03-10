import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CookiesProvider } from "react-cookie";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppLayout from "@/components/layouts/AppLayout";
import LandingLayout from "@/components/layouts/LandingLayout";
import { DashboardSessionProvider } from "@/components/session/DashboardSessionProvider";
import { requiresDashboardSession, resolveLayout } from "@/lib/layouts";

function renderWithLayout(layout, content) {
  if (layout === "landing") {
    return <LandingLayout>{content}</LandingLayout>;
  }

  if (layout === "dashboard") {
    return <AppLayout>{content}</AppLayout>;
  }

  return content;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const activeLayout = Component.layoutMode || resolveLayout(router.pathname);
  const needsDashboardSession = Component.requiresDashboardSession ?? requiresDashboardSession(router.pathname);

  let content = renderWithLayout(activeLayout, <Component {...pageProps} />);

  if (needsDashboardSession) {
    content = <DashboardSessionProvider>{content}</DashboardSessionProvider>;
  }

  return (
    <CookiesProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {content}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </ThemeProvider>
      </GoogleOAuthProvider>
    </CookiesProvider>
  );
}
