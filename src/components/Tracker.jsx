import { useEffect, useRef, useState } from "react";
import { sb } from "../supabase.js";
import { useData } from "../useData.js";
import { usePresence } from "../usePresence.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Jobs from "./Jobs.jsx";
import Archive from "./Archive.jsx";
import Customers from "./Customers.jsx";
import Report from "./Report.jsx";
import Users from "./Users.jsx";
import { useT } from "../i18n.jsx";
import Icon from "./Icons.jsx";
import LangSwitch from "./LangSwitch.jsx";
import { InstallItem } from "./Install.jsx";
import Mark from "./Mark.jsx";
import { daysLeft } from "../utils.js";

const PAGES = [
  { id: "ishlar", label: "Ishlar", icon: "board" },
  { id: "tugatilgan", label: "Tugatilgan ishlar", short: "Tugatilgan", icon: "done" },
  { id: "mijozlar", label: "Mijozlar", icon: "people" },
  { id: "hisobot", label: "Hisobot", icon: "chart", admin: true },
  { id: "foydalanuvchilar", label: "Foydalanuvchilar", short: "Xodimlar", icon: "shield", admin: true },
];

// Pages have their own address: /mijozlar, /hisobot ... ("/" is the jobs board).
// The Claude preview can only use #addresses, so its build sets VITE_HASH_ROUTER.
const HASH = import.meta.env.VITE_HASH_ROUTER === "1";
const initials = (n) =>
  (n || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fromUrl = () =>
  HASH ? window.location.hash.replace("#", "") : decodeURI(window.location.pathname).replace(/^\/+|\/+$/g, "");
const goTo = (id, replace) => {
  if (HASH) window.location.hash = id;
  else window.history[replace ? "replaceState" : "pushState"](null, "", "/" + id);
};
// Old links like /#mijozlar move to /mijozlar.
if (!HASH && window.location.hash.length > 1) goTo(window.location.hash.slice(1), true);

export default function Tracker({ isAdmin, username }) {
  const t = useT();
  const data = useData();
  const online = usePresence(username);
  const [hash, setHash] = useState(fromUrl());
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const on = () => setHash(fromUrl());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);
  const open = (id) => {
    goTo(id === "ishlar" ? "" : id);
    setHash(id);
    window.scrollTo(0, 0);
  };

  const pages = PAGES.filter((p) => !p.admin || isAdmin);
  const page = (pages.find((p) => p.id === hash) || pages[0]).id;
  // An unknown address (or an admin page for a worker) shows the jobs board, so the address bar says "/".
  useEffect(() => {
    if (hash && hash !== page) goTo("", true);
  }, [hash, page]);

  function logout() {
    setConfirm({
      title: t("Chiqish"),
      text: t("Tizimdan chiqmoqchimisiz?"),
      yes: t("Chiqish"),
      tone: "primary",
      onYes: () => {
        setConfirm(null);
        goTo("", true);
        sb.auth.signOut();
      },
    });
  }

  const { status, jobs, customers } = data;
  const statusText = status.text.startsWith("Xato: ") ? t("Xato") + status.text.slice(4) : t(status.text);

  // Numbers on the tabs: jobs still in work (red when one is late), finished jobs, customers.
  const active = jobs.filter((j) => j.stage < 4);
  const late = active.filter((j) => j.stage < 3 && j.due && daysLeft(j.due) < 0).length;
  const custCount = new Set([...Object.keys(customers), ...jobs.map((j) => (j.customer || "").trim()).filter(Boolean)]).size;
  const badge = {
    ishlar: active.length ? { n: active.length, red: late > 0, title: late ? t("{0} ta ish kechikdi", late) : "" } : null,
    tugatilgan: jobs.length - active.length ? { n: jobs.length - active.length } : null,
    mijozlar: custCount ? { n: custCount } : null,
  };
  const tone = status.err ? "err" : status.text === "Yuklanmoqda..." ? "busy" : "ok";
  const others = online.filter((n) => n !== username);

  const tabsFor = (cls) =>
    pages.map((p) => {
      const b = badge[p.id];
      return (
        <button
          key={p.id}
          className={cls + (page === p.id ? " on" : "")}
          aria-current={page === p.id ? "page" : undefined}
          onClick={() => open(p.id)}
          title={t(p.label)}
        >
          <Icon name={p.icon} size={17} />
          <span className="lbl">{t(cls === "btab" && p.short ? p.short : p.label)}</span>
          {b && (
            <span className={"cnt" + (b.red ? " red" : "")} title={b.title || undefined}>
              {b.n > 99 ? "99+" : b.n}
            </span>
          )}
        </button>
      );
    });

  return (
    <>
      <header className="topbar">
        <div className="tb-brand">
          <Mark size={30} />
          <span className="tb-name">{t("Ish kuzatuv")}</span>
        </div>

        <nav className="tabs" aria-label={t("Sahifalar")}>
          {tabsFor("tab")}
        </nav>

        <div className="tb-right">
          <span className={"sync " + tone} title={statusText} role="status">
            <i />
            <span className="sync-txt">{statusText}</span>
          </span>
          {others.length > 0 && (
            <div className="faces" title={t("Hozir tizimda") + ": " + online.join(", ")}>
              {others.slice(0, 3).map((n) => (
                <span key={n} className="face">
                  {initials(n)}
                </span>
              ))}
              {others.length > 3 && <span className="face more">+{others.length - 3}</span>}
            </div>
          )}
          <LangSwitch className="tb-lang" />
          <UserMenu username={username} isAdmin={isAdmin} online={online} onLogout={logout} />
        </div>
      </header>

      {page === "ishlar" && <Jobs data={data} isAdmin={isAdmin} username={username} />}
      {page === "tugatilgan" && <Archive data={data} isAdmin={isAdmin} username={username} />}
      {page === "mijozlar" && <Customers jobs={jobs} customers={customers} isAdmin={isAdmin} onPhone={data.savePhone} />}
      {page === "hisobot" && isAdmin && (
        <Report jobs={jobs} customers={customers} onRestore={data.restore} onWipe={data.wipe} />
      )}
      {page === "foydalanuvchilar" && isAdmin && <Users me={username} />}

      <nav className="bottombar" aria-label={t("Sahifalar")}>
        {tabsFor("btab")}
      </nav>

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          text={confirm.text}
          yes={confirm.yes}
          tone={confirm.tone}
          onYes={confirm.onYes}
          onNo={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// Avatar button with a small menu: who you are, who else is online, language (on phones), log out.
function UserMenu({ username, isAdmin, online, onLogout }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="umenu" ref={box}>
      <button className={"ubtn" + (open ? " on" : "")} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={"face me" + (isAdmin ? " adm" : "")}>{initials(username)}</span>
        <span className="uname">{username}</span>
        <Icon name="down" size={14} />
      </button>
      {open && (
        <div className="udrop" role="menu">
          <div className="uhead">
            <span className={"face me big" + (isAdmin ? " adm" : "")}>{initials(username)}</span>
            <div>
              <b>{username}</b>
              <small>{isAdmin ? t("Admin") : t("Ishchi")}</small>
            </div>
          </div>
          <div className="usec">
            <div className="ulabel">{t("Hozir tizimda")}</div>
            <div className="uonline">
              {online.map((n) => (
                <span key={n}>
                  <i className="dot d2" />
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="usec ulang">
            <div className="ulabel">{t("Til")}</div>
            <LangSwitch />
          </div>
          <InstallItem />
          <button
            className="uitem danger"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <Icon name="logout" size={15} />
            {t("Chiqish")}
          </button>
        </div>
      )}
    </div>
  );
}
