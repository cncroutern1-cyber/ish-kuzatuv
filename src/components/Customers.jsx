import { useState } from "react";
import Page from "./Page.jsx";
import { STAGE_NAMES, fmt, debtOf } from "../utils.js";
import { useT } from "../i18n.jsx";

export default function Customers({ jobs, customers, isAdmin, onPhone }) {
  const t = useT();
  const [q, setQ] = useState("");
  // Collapsed customer cards (by name), remembered on this device like the job board's "Kichraytirish".
  const [mins, setMins] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("ish-kuzatuv-cust-min") || "[]"));
    } catch (e) {
      return new Set();
    }
  });
  const saveMins = (set) => {
    try {
      localStorage.setItem("ish-kuzatuv-cust-min", JSON.stringify([...set]));
    } catch (e) {}
    setMins(set);
  };
  const toggle = (n) => {
    const set = new Set(mins);
    set.has(n) ? set.delete(n) : set.add(n);
    saveMins(set);
  };
  const names = new Set(Object.keys(customers));
  jobs.forEach((j) => names.add((j.customer || "").trim() || "Nomsiz"));

  const rows = [...names]
    .map((n) => {
      const js = jobs.filter((j) => ((j.customer || "").trim() || "Nomsiz") === n);
      return {
        n,
        js,
        debt: js.reduce((s, j) => s + debtOf(j), 0),
        sum: js.reduce((s, j) => s + (j.price || 0), 0),
      };
    })
    .sort((a, b) => b.debt - a.debt || b.js.length - a.js.length);

  // Ism yoki telefon bo'yicha qidirish (telefonda bo'sh joy, +, - hisobga olinmaydi).
  const qt = q.trim().toLowerCase();
  const qd = qt.replace(/\D/g, "");
  const shown = qt
    ? rows.filter((r) => {
        const ph = ((customers[r.n] || {}).phone || "").replace(/\D/g, "");
        return r.n.toLowerCase().includes(qt) || (qd.length > 0 && ph.includes(qd));
      })
    : rows;
  const allMin = rows.length > 0 && rows.every((r) => mins.has(r.n));
  const debtText = (r) =>
    r.debt > 0 ? (
      <span className="debt">{t("Qarz: {0}", fmt(r.debt))}</span>
    ) : (
      <span style={{ color: "var(--mute)", fontSize: 13 }}>{t("Qarz yo'q")}</span>
    );

  return (
    <Page title={t("Mijozlar")}>
      <div className="arch-bar">
        <input
          type="search"
          placeholder={t("Ism yoki telefon bo'yicha qidirish...")}
          aria-label={t("Qidirish")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="arch-count">{t("{0} ta mijoz", shown.length)}</span>
        {rows.length > 0 && (
          <button
            className="btn"
            onClick={() => saveMins(allMin ? new Set() : new Set(rows.map((r) => r.n)))}
            title={allMin ? t("Hamma mijozni kattalashtirish") : t("Hamma mijozni kichraytirish")}
          >
            {allMin ? t("⤢ Kattalashtirish") : t("⤡ Kichraytirish")}
          </button>
        )}
      </div>
      {rows.length === 0 && <div className="empty">{t("Hali mijozlar yo'q")}</div>}
      {rows.length > 0 && shown.length === 0 && <div className="empty">{t("Topilmadi")}</div>}
      <div className="cust-grid">
      {shown.map((r) => {
        const phone = (customers[r.n] || {}).phone || "";
        const name = r.n === "Nomsiz" ? t("Nomsiz") : r.n;
        if (mins.has(r.n)) {
          return (
            <div className="cbox mini" key={r.n}>
              <div className="txt">
                <b>{name}</b>
                <span className="jl">{t("{0} ta ish", r.js.length)}</span>
              </div>
              {isAdmin && debtText(r)}
              <button className="ic" aria-label={t("Kattalashtirish")} title={t("Kattalashtirish")} onClick={() => toggle(r.n)}>
                +
              </button>
            </div>
          );
        }
        return (
          <div className="cbox" key={r.n}>
            <div className="top">
              <b>{name}</b>
              <span className="right">
                {isAdmin && debtText(r)}
                <button className="ic" aria-label={t("Kichraytirish")} title={t("Kichraytirish")} onClick={() => toggle(r.n)}>
                  –
                </button>
              </span>
            </div>
            <div className="jl">
              {t("{0} ta ish", r.js.length)}{isAdmin ? t(" · jami {0} so'm", fmt(r.sum)) : ""}
            </div>
            <div className="jl">
              {r.js.length === 0
                ? t("Ishlar yo'q")
                : r.js.map((j) => (
                    <div key={j.id}>
                      {j.title} ({t(STAGE_NAMES[j.stage])})
                    </div>
                  ))}
            </div>
            {r.n !== "Nomsiz" && (
              <input
                type="tel"
                key={r.n + phone}
                defaultValue={phone}
                placeholder={t("Telefon raqami")}
                aria-label={t("Telefon")}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== phone) onPhone(r.n, v);
                }}
              />
            )}
            {phone && (
              <div className="jl">
                <a href={"tel:" + phone} style={{ color: "var(--accent)" }}>
                  {t("Qo'ng'iroq qilish")}
                </a>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </Page>
  );
}
