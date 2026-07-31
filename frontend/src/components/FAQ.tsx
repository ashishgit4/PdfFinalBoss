import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question: "What is a password protected PDF?",
      answer: "A password protected PDF is an encrypted document that requires a password to open (known as a User password) or to edit, print, or copy content (known as an Owner password). Our tool helps you remove these restrictions by entering the correct password once, allowing you to access it without prompts in the future.",
    },
    {
      question: "Is my file secure?",
      answer: "Yes, absolutely. All file transfers are secured via HTTPS with SSL/TLS encryption. Your files are processed entirely in memory or temporary environments and are never accessed by third parties. We treat data protection and user privacy with the highest priority.",
    },
    {
      question: "Do you store my password?",
      answer: "No. The password you enter is used strictly to decrypt the specific file you uploaded in that session. We do not store, log, or track the passwords you enter. They are discarded immediately after the file is processed.",
    },
    {
      question: "Is this free?",
      answer: "Yes, our PDF unlocking tool is 100% free. There are no subscriptions, no size limits (up to 100 MB), no trial periods, and no watermarks added to your output. You can use it as much as you need.",
    },
    {
      question: "How long are files stored?",
      answer: "Files are automatically and permanently deleted from our servers within one hour of processing. We do not retain copies or backups of your files after this deletion window.",
    },
    {
      question: "Can I unlock any PDF?",
      answer: "You can unlock any PDF for which you know the password. If a PDF is completely locked and you do not know the password, our tool cannot crack it, as we do not run brute-force password cracking scripts. This is to ensure compliance with security and privacy laws.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Have questions? We have compiled the most common queries about our PDF unlocking service.
          </p>
        </div>

        <div className="bg-card/30 border border-border/40 rounded-3xl p-6 sm:p-10 backdrop-blur-md">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/40 py-1 last:border-b-0">
                <AccordionTrigger className="text-left font-bold text-base hover:text-primary transition-colors hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4 pt-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
