import { useEffect, useRef, useState } from "react";
import { sb } from "../supabase.js";
import { FALLBACK_USERS } from "../utils.js";
import PasswordInput from "./PasswordInput.jsx";
import { useT } from "../i18n.jsx";
import LangSwitch from "./LangSwitch.jsx";

// Carved-wood lattice, drawn in SVG so the page needs no image file.
const ORNAMENT = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
<rect width='120' height='120' fill='#e8dac3'/>
<g fill='none' stroke='#a98055' stroke-width='1.5' stroke-linejoin='round'>
<path d='M60 5L115 60 60 115 5 60Z'/>
<path d='M60 22L98 60 60 98 22 60Z' stroke-opacity='.7'/>
<circle cx='60' cy='60' r='24'/>
<path d='M60 36L77 43 84 60 77 77 60 84 43 77 36 60 43 43Z'/>
<circle cx='60' cy='60' r='7' fill='#a98055' fill-opacity='.35'/>
<path d='M0 0L22 22M120 0L98 22M0 120L22 98M120 120L98 98'/>
<circle cx='0' cy='0' r='10'/><circle cx='120' cy='0' r='10'/><circle cx='0' cy='120' r='10'/><circle cx='120' cy='120' r='10'/>
</g></svg>`;

const PATTERN = `url("data:image/svg+xml,${encodeURIComponent(ORNAMENT)}")`;
// The same lattice in gold lines, for the dark brand panel.
const GOLD = ORNAMENT.replace("<rect width='120' height='120' fill='#e8dac3'/>", "").replace(/#a98055/g, "#c9a227");
const GOLD_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(GOLD)}")`;
const LAST = "ish-kuzatuv-last-user";

// Round carved rosette used as the app mark.
function Mark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#c9a227" />
      <g fill="none" stroke="#2b1d12" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M24 6L42 24 24 42 6 24Z" />
        <circle cx="24" cy="24" r="10" />
        <path d="M24 14l7 3 3 7-3 7-7 3-7-3-3-7 3-7Z" />
      </g>
      <circle cx="24" cy="24" r="3" fill="#2b1d12" />
    </svg>
  );
}

const initials = (n) =>
  (n || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const SHADE = "linear-gradient(rgba(255,250,240,.35),rgba(255,250,240,.35))";

// To use your own photo of furniture or carved screens: put it in the "public" folder as login-bg.jpg.
const PHOTO = `url(${import.meta.env.BASE_URL}login-bg.jpg)`;

export default function Login() {
  const t = useT();
  const [users, setUsers] = useState(null);
  const [who, setWho] = useState(() => {
    try {
      return localStorage.getItem(LAST) || "";
    } catch (e) {
      return "";
    }
  });
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [caps, setCaps] = useState(false);
  const [shake, setShake] = useState(false);
  const passRef = useRef(null);

  // The list of names comes from the database, so users added by the admin show up here.
  useEffect(() => {
    let off = false;
    sb.from("profiles")
      .select("username,email,role")
      .order("username")
      .then(({ data, error }) => {
        if (off) return;
        const list = !error && data && data.length ? data : FALLBACK_USERS;
        setUsers(list);
        // A remembered name that no longer exists is dropped; with only one user, pick them.
        setWho((w) => (list.some((u) => u.username === w) ? w : list.length === 1 ? list[0].username : ""));
      });
    return () => {
      off = true;
    };
  }, []);

  // As soon as a name is chosen, the cursor goes to the password.
  useEffect(() => {
    if (who && users) passRef.current?.focus();
  }, [who, users]);

  const fail = (msg) => {
    setErr(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const u = (users || []).find((x) => x.username === who);
    if (!u) return fail(t("Ismingizni tanlang."));
    if (!pass) {
      passRef.current?.focus();
      return fail(t("Parolni kiriting."));
    }
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email: u.email, password: pass });
    setBusy(false);
    if (error) {
      fail(
        /invalid login/i.test(error.message)
          ? t("Parol noto'g'ri, yoki bu foydalanuvchi Supabase'da yaratilmagan.")
          : /fetch|network/i.test(error.message)
          ? t("Internet aloqasi yo'q. Qayta urinib ko'ring.")
          : t("Xato") + ": " + error.message
      );
      passRef.current?.select();
    } else {
      try {
        localStorage.setItem(LAST, u.username);
      } catch (e2) {}
      setPass("");
    }
  }

  const pick = (name) => {
    setWho(name);
    setErr("");
  };
  const checkCaps = (e) => setCaps(!!(e.getModifierState && e.getModifierState("CapsLock")));
  const many = users && users.length > 8; // a long list is easier as a dropdown

  return (
    <div
      className="login"
      style={{
        backgroundImage: `${SHADE}, ${PHOTO}, ${PATTERN}`,
        backgroundSize: "auto, cover, 120px 120px",
      }}
    >
      <LangSwitch className="login-lang" />
      <div className="login-shell">
        <aside className="login-brand" style={{ backgroundImage: GOLD_PATTERN }}>
          <div className="lb-inner">
            <Mark />
            <h1>{t("Ish kuzatuv")}</h1>
            <p>{t("Mebel, shirma va CNC naqsh ishlari bir joyda.")}</p>
            <ul>
              <li>{t("Navbatdan tayyorgacha har bir ish")}</li>
              <li>{t("Narx, avans va qarzlar nazorati")}</li>
              <li>{t("Hamma qurilmada bir xil ma'lumot")}</li>
            </ul>
          </div>
        </aside>

        <form className={"login-card" + (shake ? " shake" : "")} onSubmit={submit} noValidate>
          <h2>{t("Kirish")}</h2>
          <p className="lead">{t("Kim kirmoqda?")}</p>

          {!users && <div className="who-loading">{t("Yuklanmoqda...")}</div>}

          {users && !many && (
            <div className="who-grid" role="radiogroup" aria-label={t("Foydalanuvchi")}>
              {users.map((u) => {
                const on = who === u.username;
                return (
                  <button
                    type="button"
                    key={u.username}
                    role="radio"
                    aria-checked={on}
                    className={"who" + (on ? " on" : "")}
                    onClick={() => pick(u.username)}
                  >
                    <span className={"av" + (u.role === "admin" ? " adm" : "")}>{initials(u.username)}</span>
                    <span className="nm">{u.username}</span>
                    <span className="rl">{u.role === "admin" ? t("Admin") : t("Ishchi")}</span>
                  </button>
                );
              })}
            </div>
          )}

          {users && many && (
            <div className="f">
              <label htmlFor="who">{t("Foydalanuvchi")}</label>
              <select id="who" value={who} onChange={(e) => pick(e.target.value)}>
                <option value="">{t("Tanlang...")}</option>
                {users.map((u) => (
                  <option key={u.username} value={u.username}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="f">
            <label htmlFor="lPass">{who ? t("{0} uchun parol", who) : t("Parol")}</label>
            <PasswordInput
              id="lPass"
              inputRef={passRef}
              autoComplete="current-password"
              value={pass}
              invalid={!!err}
              onChange={(e) => {
                setPass(e.target.value);
                if (err) setErr("");
              }}
              onKeyDown={checkCaps}
              onKeyUp={checkCaps}
              onBlur={() => setCaps(false)}
            />
            {caps && <div className="caps">⇪ {t("Caps Lock yoqilgan")}</div>}
          </div>

          <div className="errtxt" role="alert">{err}</div>

          <button className="btn primary login-go" disabled={busy || !users}>
            {busy && <span className="spin" aria-hidden="true" />}
            {busy ? t("Kirilmoqda...") : t("Kirish")}
          </button>
          <p className="login-foot">{t("Parolni unutdingizmi? Admin yangi parol qo'yib beradi.")}</p>
        </form>
      </div>
    </div>
  );
}
