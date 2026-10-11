import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/motion/Reveal";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Send } from "lucide-react";

const EXAMPLES = [
  "كيف تغيّر الأرقام حياتنا اليومية؟",
  "ماذا يحدث خلف القرار الاقتصادي؟",
  "أين تبدأ حكاية الإنسان مع السوق؟",
];

export const AskSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [example, setExample] = useState(0);
  const questionRef = useRef<HTMLTextAreaElement>(null);

  const focusQuestion = () => {
    setSent(false);
    window.requestAnimationFrame(() => {
      const field = questionRef.current;
      if (!field) return;
      field.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      field.focus({ preventScroll: true });
    });
  };

  const { toast } = useToast();

  const { data: transformedQuestions } = useQuery({
    queryKey: ["questions-became-content", "compact"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("audience_questions")
        .select(`
          id,
          question,
          articles:linked_article_id (
            id,
            title,
            status
          )
        `)
        .not("linked_article_id", "is", null)
        .order("updated_at", { ascending: false })
        .limit(4);

      if (error) throw error;

      return (data || []).filter(
        (row: any) => row.articles?.status === "approved"
      );
    },
  });

  useEffect(() => {
    if (question) return;

    const id = window.setInterval(() => {
      setExample((value) => (value + 1) % EXAMPLES.length);
    }, 4200);

    return () => window.clearInterval(id);
  }, [question]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!question.trim()) return;

    setSending(true);

    const { error } = await supabase
      .from("audience_questions")
      .insert({
        name: name.trim() || null,
        email: email.trim() || null,
        question: question.trim(),
        status: "new",
      });

    setSending(false);

    if (error) {
      toast({
        title: "تعذّر الإرسال",
        description: "حاول مرة أخرى بعد قليل",
        variant: "destructive",
      });

      return;
    }

    setSent(true);

    // تفريغ الحقول بعد الإرسال
    setName("");
    setEmail("");
    setQuestion("");
  };

  return (
    <section className="ask-editorial-section">
      <div className="ask-dots" aria-hidden="true" />

      <div className="container relative z-10 mx-auto px-6">
        <Reveal variant="clip" className="ask-editorial-heading">
          <h2>من سؤالك يبدأ المقال</h2>

          <p>
            لاحظت شيئًا يستحق السؤال ؟
            <br />
            أرسله للمُنحنى، لتبدأ الحكاية من تساؤلك
          </p>
        </Reveal>

        <Reveal
          variant="rise"
          delay={100}
          className="ask-editorial-panel"
        >
          {/* =========================
              FORM
              ========================= */}

          <div className="ask-form-column">
            <h3>اكتب ما لاحظته</h3>

            <div className="ask-form-stage">
              <form
                onSubmit={submit}
                className={sent ? "is-hidden" : ""}
              >
                <Textarea
                  ref={questionRef}
                  aria-label="اكتب سؤالك"
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder={`مثال: ${EXAMPLES[example]}`}
                  rows={3}
                  maxLength={600}
                  required
                />

               <div className="ask-form-footer">

  <div className="ask-contact-fields">
    <Input
      value={name}
      onChange={(event) =>
        setName(event.target.value)
      }
      placeholder="اسمك (اختياري)"
      maxLength={80}
    />

    <Input
      type="email"
      value={email}
      onChange={(event) =>
        setEmail(event.target.value)
      }
      placeholder="بريدك الإلكتروني (اختياري)"
      maxLength={160}
    />
  </div>

  <Button
    type="submit"
    disabled={sending}
    className="ask-submit"
  >
    {sending ? "جارٍ الإرسال..." : "أرسل"}
    <Send />
  </Button>

</div>
              </form>

              {/* =========================
                  SUCCESS
                  ========================= */}

              <div
                className={`ask-success ${
                  sent ? "is-visible" : ""
                }`}
                aria-live="polite"
              >
                <span>
                  <Check />
                </span>

                <h3>وصل سؤالك</h3>

                <p>
                  أصبح الآن ضمن أفكار المُنحنى القادمة.
                </p>

                <Button
                  variant="ghost"
                  onClick={() => setSent(false)}
                >
                  أرسل سؤالًا آخر
                </Button>
              </div>
            </div>
          </div>

          {/* =========================
              QUESTIONS → ARTICLES
              ========================= */}

          <div className="ask-content-column">
            <h3>أسئلة أصبحت محتوى</h3>

            <div className="ask-content-list">
              {transformedQuestions?.length ? (
                transformedQuestions.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/articles/${item.articles.id}`}
                    className="ask-content-item"
                  >
                    <p className="ask-content-question">
                      <span>«</span>
                      {item.question}
                      <span>»</span>
                    </p>

                    <p className="ask-content-article">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {item.articles.title}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="ask-content-empty">
                  قريبًا تتحول أسئلة الجمهور إلى مقالات.
                </p>
              )}
            </div>

            {!!transformedQuestions?.length && (
              <p className="ask-content-count">
                من ملاحظات وصلت إلى المُنحنى وأصبحت محتوى
              </p>
            )}
          </div>

          {/* =========================
              FOOTER
              ========================= */}

          <Button variant="ghost" onClick={focusQuestion} className="ask-panel-footer h-auto w-full whitespace-normal rounded-none bg-transparent p-0 text-inherit hover:bg-transparent hover:text-inherit">
            <span>
              سيكون المُنحنى أقرب منك عندما تكون شريكًا في
              صياغة المحتوى
            </span>

            <ArrowLeft />
          </Button>
        </Reveal>
      </div>
    </section>
  );
};

export default AskSection;
