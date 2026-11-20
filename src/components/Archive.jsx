import { useState } from "react";
import Page from "./Page.jsx";
import JobForm from "./JobForm.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Icon from "./Icons.jsx";
import { fmt, fmtArea, debtOf, canEdit, daysTaken } from "../utils.js";
import { useT } from "../i18n.jsx";

// Finished jobs: ticked off in the "Tayyor" column. Can be restored, edited or (admin) deleted.
export default function Archive({ data, isAdmin, username }) {
  const t = useT();
  const { jobs, customers, saveJob, removeJob, savePhone } = data;
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bigImg, setBigImg] = useState(null);
  // Kichraytirish: hamma karta (saqlanadi) va har bir karta alohida.
  const [allSmall, setAllSmall] = useState(() => {
    try {
      return localStorage.getItem("ish-kuzatuv-arch-compact") === "1";
    } catch (e) {
      return false;
    }
  });
  // id -> true/false (shu kartaning o'z tanlovi), qayta yuklanganda ham saqlanadi.
  const [own, setOwnState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ish-kuzatuv-arch-own") || "{}");
    } catch (e) {
      return {};
    }
  });
  const setOwn = (v) => {
    setOwnState(v);
    try {
      localStorage.setItem("ish-kuzatuv-arch-own", JSON.stringify(v));
    } catch (e) {}
  };
  const toggleAll = () => {
    const v = !allSmall;
    setAllSmall(v);
    setOwn({});
    try {
      localStorage.setItem("ish-kuzatuv-arch-compact", v ? "1" : "0");
    } catch (e) {}
  };

  const query = q.trim().toLowerCase();
  const list = jobs
    .filter((j) => j.stage === 4)
    .filter((j) => !query || (j.title + " " + j.customer + " " + (j.material || "")).toLowerCase().includes(query))
    .sort((a, b) => (b.done || "").localeCompare(a.done || "") || b.pos - a.pos);
  const total = jobs.filter((j) => j.stage === 4).length;
  const days = jobs.filter((j) => j.stage === 4).map(daysTaken).filter((d) => d !== null);
  const avg = days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null;

  function restore(j) {
    saveJob({ ...j, stage: 3, pos: Date.now() });
  }

  function ask(j) {
    if (!isAdmin) return;
    setConfirm({
      title: t("Ishni o'chirish"),
      text: t("\"{0}\" ishi hamma qurilmalardan o'chiriladi. Buni qaytarib bo'lmaydi.", j.title),
      onYes: async () => {
        setConfirm(null);
        setForm(null);
        await removeJob(j.id);
      },
    });
  }

  async function onSave(j, phone) {
    setForm(null);
    await saveJob(j);
    if (j.customer && (phone !== ((customers[j.customer] || {}).phone || "") || !customers[j.customer])) {
      await savePhone(j.customer, phone);
    }
  }

  return (
    <Page title={t("Tugatilgan ishlar")}>
      <div className="arch-bar">
        <input type="search" placeholder={t("Qidirish...")} aria-label={t("Qidirish")} value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="arch-count">
          {t("{0} ta ish", total)}
          {avg !== null && " · " + t("O'rtacha: {0} kun", avg)}
        </span>
        <button className="btn" onClick={toggleAll} title={allSmall ? t("Hamma ishni kattalashtirish") : t("Hamma ishni kichraytirish")}>
          {allSmall ? t("⤢ Kattalashtirish") : t("⤡ Kichraytirish")}
        </button>
      </div>

      {list.length === 0 && (
        <div className="empty">
          {total === 0
            ? t("Hali tugatilgan ish yo'q. \"Tayyor\" ustunidagi ish kartasida ✓ tugmasini bossangiz, ish shu yerga o'tadi.")
            : t("Topilmadi")}
        </div>
      )}

      <div className="cust-grid">
        {list.map((j) => {
          const debt = debtOf(j);
          const meta = [j.material, j.thick ? j.thick + " mm" : "", j.dims].filter(Boolean).join(" · ");
          const small = own[j.id] === undefined ? allSmall : own[j.id];
          if (small)
            return (
              <div className="card mini" key={j.id + "-c"}>
                <div className="txt">
                  <div className="title">{j.title}</div>
                  <div className="cust">
                    {[j.customer, t("Tugagan: {0}", j.done || "—"), daysTaken(j) !== null ? "⏱ " + daysTaken(j) + " " + t("kun") : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {isAdmin && debt > 0 && <span className="chip red">{t("Qarz: {0}", fmt(debt))}</span>}
                {!canEdit(j, isAdmin, username) && <span title={t("Faqat {0} o'zgartira oladi", j.createdBy || "admin")}>🔒</span>}
                <button className="ic" aria-label={t("Kattalashtirish")} title={t("Kattalashtirish")} onClick={() => setOwn({ ...own, [j.id]: false })}>
                  +
                </button>
              </div>
            );
          return (
            <div className="card" key={j.id}>
              <div className="row1">
                <button className="ic shrink" aria-label={t("Kichraytirish")} title={t("Kichraytirish")} onClick={() => setOwn({ ...own, [j.id]: true })}>
                  –
                </button>
                <span className="tag">{j.parts} ta detal</span>
                {j.area > 0 && <span>{fmtArea(j.area)} m²</span>}
                <span style={{ marginLeft: "auto" }}>{t("Tugagan: {0}", j.done || "—")}</span>
              </div>
              <div className="mid">
                <div className="txt">
                  <div className="title">{j.title}</div>
                  <div className="cust">{j.customer || "—"}</div>
                </div>
                {j.img && <img className="thumb" src={j.img} alt={t("Rasm")} onClick={() => setBigImg(j.img)} />}
              </div>
              {meta && <div className="meta">{meta}</div>}
              {daysTaken(j) !== null && (
                <div className="chips">
                  <span className="chip">
                    ⏱ {daysTaken(j) === 0 ? t("Bir kunda bajarildi") : t("Bajarilish vaqti: {0} kun", daysTaken(j))}
                  </span>
                  <span className="chip">{j.created} → {j.done}</span>
                </div>
              )}
              {j.note && <div className="meta">{j.note}</div>}
              {isAdmin && j.price > 0 && (
                <div className="chips">
                  {debt > 0 ? <span className="chip red">Qarz: {fmt(debt)}</span> : <span className="chip grn">{t("To'langan")}</span>}
                </div>
              )}
              {!canEdit(j, isAdmin, username) ? (
                <div className="meta lockmsg">🔒 {t("Faqat {0} o'zgartira oladi", j.createdBy || "admin")}</div>
              ) : (
              <div className="acts">
                <button className="ic" onClick={() => restore(j)} title={t("Tayyor ustuniga qaytarish")}>
                  <Icon name="left" /> {t("Qaytarish")}
                </button>
                <span className="sep" />
                <button className="ic" aria-label={t("Tahrirlash")} title={t("Tahrirlash")} onClick={() => setForm({ job: j })}>
                  <Icon name="edit" />
                </button>
                {isAdmin && (
                  <button className="ic del" aria-label={t("Ishni o'chirish")} title={t("Ishni o'chirish")} onClick={() => ask(j)}>
                    <Icon name="trash" />
                  </button>
                )}
              </div>
              )}
            </div>
          );
        })}
      </div>

      {form && (
        <JobForm
          key={form.job.id}
          job={form.job}
          isAdmin={isAdmin}
          username={username}
          customers={customers}
          onSave={onSave}
          onDelete={ask}
          onClose={() => setForm(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog title={confirm.title} text={confirm.text} onYes={confirm.onYes} onNo={() => setConfirm(null)} />
      )}
      {bigImg && (
        <div className="overlay on lightbox" onClick={() => setBigImg(null)}>
          <button type="button" className="xbtn light" onClick={() => setBigImg(null)} aria-label="×">
            ×
          </button>
          <img src={bigImg} alt="" />
        </div>
      )}
    </Page>
  );
}
