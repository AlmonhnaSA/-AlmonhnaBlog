import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { serviceRequestSchema } from "../../supabase/functions/_shared/serviceRequestValidation";

interface Props {
  service: string | null;
  onClose: () => void;
}

export function ServiceRequestDialog({ service, onClose }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const submissionKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!service) return;
    setName(""); setContact(""); setDetails(""); setWebsite(""); setError(""); setSaved(false);
    submissionKey.current = crypto.randomUUID();
  }, [service]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending || saved) return;
    const parsed = serviceRequestSchema.safeParse({ submissionKey: submissionKey.current, name, contact, service, details, website });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "تحقق من بيانات الطلب");
      return;
    }
    setSending(true); setError("");
    try {
      const { data, error: requestError } = await supabase.functions.invoke("submit-service-request", { body: parsed.data });
      if (requestError || data?.success !== true) throw new Error("save failed");
      setSaved(true);
    } catch {
      setError("تعذّر إرسال الطلب. حاول مرة أخرى بعد قليل.");
    } finally { setSending(false); }
  };

  return <Dialog open={Boolean(service)} onOpenChange={(open) => { if (!open && !sending) onClose(); }}>
    <DialogContent dir="rtl" className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
      <DialogHeader className="text-right sm:text-right">
        <DialogTitle className="leading-7">طلب الخدمة</DialogTitle>
        <DialogDescription>{service}</DialogDescription>
      </DialogHeader>
      {saved ? <div className="space-y-4 py-6 text-center" role="status">
        <Check className="mx-auto h-8 w-8 text-primary" />
        <p className="font-bold">تم حفظ طلبك بنجاح</p>
        <Button onClick={onClose}>إغلاق</Button>
      </div> : <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="service-request-name">الاسم</Label><Input id="service-request-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" required disabled={sending} /></div>
        <div className="space-y-2"><Label htmlFor="service-request-contact">التواصل (البريد الإلكتروني أو رقم الهاتف)</Label><Input id="service-request-contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={255} required disabled={sending} /></div>
        <div className="space-y-2"><Label htmlFor="service-request-service">الخدمة</Label><Input id="service-request-service" value={service || ""} readOnly /></div>
        <div className="space-y-2"><Label htmlFor="service-request-details">تفاصيل الطلب</Label><Textarea id="service-request-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={4000} rows={4} required disabled={sending} /></div>
        <div className="hidden" aria-hidden="true"><Input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" disabled={sending} className="w-full">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? "جارٍ الإرسال..." : "إرسال الطلب"}</Button>
      </form>}
    </DialogContent>
  </Dialog>;
}