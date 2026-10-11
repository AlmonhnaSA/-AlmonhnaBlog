import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import authEditorial from "@/assets/auth-editorial.jpg";
import logo from "@/assets/logo.svg";
import darkLogo from "@/assets/darkLogo.png";

interface AuthVisualProps {
  mode: "login" | "register";
}

export const AuthVisual = ({ mode }: AuthVisualProps) => (
  <aside className="auth-visual" aria-label="المُنحنى">
    <img
      src={authEditorial}
      alt="مسارات ورقية منحنية بألوان المُنحنى"
      className="auth-visual-image"
      width={1200}
      height={1600}
    />
    <div className="auth-visual-shade" />
    <div className="auth-visual-line auth-visual-line-one" aria-hidden="true" />
    <div className="auth-visual-line auth-visual-line-two" aria-hidden="true" />
    <div className="auth-visual-content">
      {/* <Link to="/" className="auth-visual-logo" aria-label="العودة إلى الرئيسية">
        <img src={logo} alt="المُنحنى" className="dark:hidden" />
        <img src={darkLogo} alt="المُنحنى" className="hidden dark:block" /> 
      </Link> */}
      <div className="auth-visual-copy">
        <span className="auth-visual-kicker">
          <BookOpen className="h-4 w-4" />
          مساحة للمعرفة التي تستحق أن تُروى
        </span>
        <h2>{mode === "login" ? "واصل رحلتك في المُنحنى" : "أضف صوتك إلى الحكاية"}</h2>
        <p>
          {mode === "login"
            ? "عد إلى مقالاتك ومساحتك المعرفية من حيث توقفت."
            : "انضم ككاتب، وشارك أفكارك ضمن تجربة تحريرية مترابطة."}
        </p>
      </div>
      <Link to="/" className="auth-back-link">
        تصفّح الموقع
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  </aside>
);

export default AuthVisual;
