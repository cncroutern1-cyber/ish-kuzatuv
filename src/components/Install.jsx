import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icons.jsx";
import { useT } from "../i18n.jsx";

// "Install the app" support. Android/desktop Chrome can install with one tap;
// iPhone has no such API, so we show the two steps instead.
let deferred = null;
const subs = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    subs.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    subs.forEach((f) => f());
  });
}

const standalone = () =>
  typeof window !== "undefined" &&
  ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true);
const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// Returns null when the app is already installed, otherwise a function that starts the install.
export function useInstall() {
  const [, tick] = useState(0);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);
  if (standalone()) return { can: false, start() {}, dialog: null };
  const start = async () => {
    if (deferred) {
      const p = deferred;
      deferred = null;
      p.prompt();
      try {
        await p.userChoice;
      } catch (e) {}
      tick((n) => n + 1);
    } else setHelp(true);
  };
  return { can: true, start, dialog: help ? <InstallHelp onClose={() => setHelp(false)} /> : null };
}

function InstallHelp({ onClose }) {
  const t = useT();
  const ios = isIOS();
  return (
    <Modal title={t("Ilovani o'rnatish")} onClose={onClose}>
      <ol className="inst-steps">
        {ios ? (
          <>
            <li>{t("Saytni Safari brauzerida oching.")}</li>
            <li>{t("Pastdagi “Ulashish” tugmasini (⬆︎) bosing.")}</li>
            <li>{t("“Bosh ekranga qo'shish” (Add to Home Screen) ni tanlang.")}</li>
            <li>{t("“Qo'shish” ni bosing. Ilova bosh ekranda paydo bo'ladi.")}</li>
          </>
        ) : (
          <>
            <li>{t("Brauzer menyusini (⋮) oching.")}</li>
            <li>{t("“Ilovani o'rnatish” yoki “Bosh ekranga qo'shish” ni tanlang.")}</li>
            <li>{t("Tasdiqlang. Ilova bosh ekranda paydo bo'ladi.")}</li>
          </>
        )}
      </ol>
      <div className="mbtns">
        <span className="sp" />
        <button className="btn primary" onClick={onClose}>
          {t("Tushunarli")}
        </button>
      </div>
    </Modal>
  );
}

export function InstallItem({ className = "uitem" }) {
  const t = useT();
  const { can, start, dialog } = useInstall();
  if (!can) return null;
  return (
    <>
      <button className={className} role="menuitem" onClick={start}>
        <Icon name="install" size={15} />
        {t("Ilovani o'rnatish")}
      </button>
      {dialog}
    </>
  );
}
