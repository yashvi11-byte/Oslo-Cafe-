import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, MessageSquare, Phone, ShieldAlert, Utensils } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Ext, GetDirectionsButton, PageHero, btn } from "@/components/ui-kit";
import { Reveal } from "@/components/ScrollReveal";
import { MAP_EMBED_URL, SITE } from "@/lib/site";
import { trackCallClick } from "@/lib/analytics";
import {
  checkEnquiryBanStatus,
  recordEnquiryAttempt,
  banDeviceForOneHour,
  type BanStatus,
} from "@/lib/spam-protection";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Location | OSLO CAFE & RESTRO, Moga" },
      { name: "description", content: "Find OSLO CAFE & RESTRO near D.M. College, New Town, Moga. Call +91 93340 00029 or get directions." },
      { property: "og:title", content: "Visit OSLO CAFE & RESTRO in Moga" },
      { property: "og:description", content: "Address, phone and directions for OSLO CAFE & RESTRO." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banStatus, setBanStatus] = useState<BanStatus>(() => checkEnquiryBanStatus());

  // Real-time countdown timer for ban
  useEffect(() => {
    if (!banStatus.isBanned) return;
    const interval = setInterval(() => {
      const current = checkEnquiryBanStatus();
      setBanStatus(current);
      if (!current.isBanned) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [banStatus.isBanned]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Check if already banned
    const currentBan = checkEnquiryBanStatus();
    if (currentBan.isBanned) {
      setBanStatus(currentBan);
      return;
    }

    const f = new FormData(e.currentTarget);

    // Bot honeypot check (hidden input)
    const honeypot = String(f.get("user_company_url") || "");
    if (honeypot.trim()) {
      banDeviceForOneHour();
      setBanStatus(checkEnquiryBanStatus());
      return;
    }

    const name = String(f.get("name") || "").trim();
    const contact = String(f.get("contact") || "").trim();
    const message = String(f.get("message") || "").trim();
    const errs: Record<string, string> = {};
    if (!name) errs["name"] = "Please enter your name.";
    if (!contact) errs["contact"] = "Please add a phone number or email.";
    if (message.length < 5) errs["message"] = "Please write a short message.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Record attempt for spam protection - if spamming (3 attempts in 3 mins), ban for 1 hour!
    const attemptResult = recordEnquiryAttempt();
    if (attemptResult.isBanned) {
      setBanStatus(checkEnquiryBanStatus());
      return;
    }

    const body = encodeURIComponent(`Hi Oslo, I'm ${name} (${contact}). ${message}`);
    window.location.href = `${SITE.smsHref}?body=${body}`;
  }

  const field = "mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary";

  return (
    <>
      <PageHero eyebrow="Contact" title="Come Find Your Happy Place.">Call ahead, plan your visit or send us a message.</PageHero>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
        <Reveal variant="fade-left" className="space-y-6">
          <h2 className="text-3xl text-foreground">{SITE.name}</h2>
          <div className="flex gap-4"><MapPin className="mt-1 size-5 shrink-0 text-primary" /><address className="not-italic leading-relaxed text-muted-foreground">{SITE.address}</address></div>
          <div className="flex gap-4"><Clock className="mt-1 size-5 shrink-0 text-primary" /><p className="text-muted-foreground"><span className="font-semibold text-foreground">Open Daily:</span> 10:30 AM – 10:30 PM</p></div>
          <div className="flex gap-4"><Phone className="mt-1 size-5 shrink-0 text-primary" /><a href={SITE.phoneHref} onClick={() => trackCallClick("Contact Page Phone Link", SITE.phoneDisplay)} className="font-medium text-foreground hover:text-primary">{SITE.phoneDisplay}</a></div>
          <div className="flex gap-4"><Utensils className="mt-1 size-5 shrink-0 text-primary" /><p className="text-muted-foreground">Dine-in, takeaway and delivery</p></div>
          <div className="flex flex-wrap gap-3">
            <GetDirectionsButton variant="primary" />
            <Ext href={SITE.phoneHref} onClick={() => trackCallClick("Contact Page Call Button", SITE.phoneDisplay)} variant="outline"><Phone className="size-4 text-primary" /> Call Now</Ext>
            <Ext href={SITE.instagramUrl} variant="outline"><Instagram className="size-4 text-primary" /> Instagram</Ext>
          </div>
          <iframe title="Map to OSLO CAFE & RESTRO" src={MAP_EMBED_URL} loading="lazy" className="h-72 w-full border border-border" referrerPolicy="no-referrer-when-downgrade" />
        </Reveal>

        <Reveal variant="fade-right" delay={120}>
          {banStatus.isBanned ? (
            <div className="h-fit rounded-3xl border border-rose-200 bg-rose-50/80 p-7 md:p-9 text-center shadow-xs">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-100 text-rose-600 mb-4 border border-rose-200 shadow-xs">
                <ShieldAlert className="size-8" />
              </div>
              <span className="rounded-full bg-rose-200/80 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-rose-800">
                Spam Prevention Active
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold text-rose-950">
                Enquiry Blocked (1-Hour Ban)
              </h3>
              <p className="mt-2 text-xs text-rose-900/80 leading-relaxed max-w-sm mx-auto">
                Multiple rapid enquiry submissions were detected from this device. To prevent spam, your ability to submit enquiries has been suspended for 1 hour.
              </p>
              <div className="mt-5 rounded-2xl bg-white border border-rose-200 p-4 text-center">
                <span className="text-[0.65rem] uppercase tracking-wider text-rose-700 font-bold block mb-1">
                  Time Remaining on Ban
                </span>
                <span className="font-mono text-xl font-bold text-rose-950">
                  {banStatus.remainingMinutes} min ({Math.floor(banStatus.remainingSeconds % 60)}s)
                </span>
              </div>
              <div className="mt-6 border-t border-rose-200 pt-5 text-xs text-rose-900">
                <span className="font-semibold block mb-2">Need immediate assistance from Oslo Cafe?</span>
                <a
                  href={SITE.phoneHref}
                  onClick={() => trackCallClick("Banned Enquiry Helpline Call", SITE.phoneDisplay)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105"
                >
                  <Phone className="size-3.5" /> Call Directly: {SITE.phoneDisplay}
                </a>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="h-fit border border-border bg-white p-7 md:p-9 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl text-foreground">Send an enquiry</h2>
                <span className="text-[0.65rem] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Spam Protected
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">This opens a text message to the café on your phone with your details filled in.</p>

              {/* Invisible Bot Honeypot */}
              <input
                type="text"
                name="user_company_url"
                tabIndex={-1}
                autoComplete="off"
                style={{ display: "none", opacity: 0, position: "absolute", left: "-9999px" }}
                aria-hidden="true"
              />

              {[
                { n: "name", l: "Your name", t: "text", a: "name" },
                { n: "contact", l: "Phone or email", t: "text", a: "tel" },
              ].map((x) => (
                <div key={x.n} className="mt-5">
                  <label htmlFor={x.n} className="text-sm font-medium">{x.l}</label>
                  <input id={x.n} name={x.n} type={x.t} autoComplete={x.a} aria-invalid={!!errors[x.n]} aria-describedby={`${x.n}-err`} className={field} />
                  {errors[x.n] && <p id={`${x.n}-err`} className="mt-1 text-xs text-destructive">{errors[x.n]}</p>}
                </div>
              ))}
              <div className="mt-5">
                <label htmlFor="message" className="text-sm font-medium">Message</label>
                <textarea id="message" name="message" rows={4} aria-invalid={!!errors["message"]} aria-describedby="message-err" className={`${field} h-auto py-2`} />
                {errors["message"] && <p id="message-err" className="mt-1 text-xs text-destructive">{errors["message"]}</p>}
              </div>
              <button type="submit" className={`${btn.primary} mt-6 w-full cursor-pointer`}><MessageSquare className="size-4" /> Send via Text Message</button>
            </form>
          )}
        </Reveal>
      </section>
    </>
  );
}
