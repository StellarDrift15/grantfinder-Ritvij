import { Link } from "react-router-dom";

const LOGO_URL =
  "https://media.base44.com/images/public/6a39efc0b13445433b243bbd/4fb8fa174_grantfinder-logo-1024.png";

export const GRANTFINDER_LOGO_URL = LOGO_URL;

export default function Logo({ to = "/", size = 36 }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group" aria-label="GrantFinder home">
      <img
        src={LOGO_URL}
        alt=""
        width={size}
        height={size}
        className="rounded-[9px] shrink-0"
        style={{ width: size, height: size }}
      />
      <span
        className="font-display font-bold text-gf-hi tracking-tight"
        style={{ fontSize: 19, letterSpacing: "-0.01em" }}
      >
        Grant<span className="text-gf-grad">Finder</span>
      </span>
    </Link>
  );
}