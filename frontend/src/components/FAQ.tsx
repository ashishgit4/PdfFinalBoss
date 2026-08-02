import { useState } from "react";

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqItems = [
    {
      q: "What is a password protected PDF?",
      a: "A password protected PDF is an encrypted document that requires an authorization key to either open, edit, print, or copy content. Our tool lets you clear these locks once the correct password has been supplied."
    },
    {
      q: "Is my file secure?",
      a: "Yes. All file streams utilize secure SSL/TLS connections during uploads and downloads. Processing occurs in completely isolated sandboxes, ensuring complete data privacy."
    },
    {
      q: "Do you store my password?",
      a: "No. The credentials you submit are solely used in memory during decryption and are never saved, logged, or recorded anywhere on the server disk."
    },
    {
      q: "How does the Local Password Vault work?",
      a: "When you lock a PDF, you can choose to save the password to your local vault. We encrypt and save this password directly in your browser's localStorage mapped to the file's unique hash. If you upload the same PDF again, your browser automatically retrieves the password and unlocks it for you. Your passwords never leave your device."
    },
    {
      q: "Is this free?",
      a: "Yes, it is 100% free. There are no subscriptions, email constraints, limits, or hidden fees. We do not insert custom watermarks on output files."
    },
    {
      q: "How long are files stored?",
      a: "All document assets are automatically wiped from our cache arrays exactly 24 hours after execution finishes."
    },
    {
      q: "Can I unlock any PDF?",
      a: "You can unlock any document for which you know the correct password. We do not run brute-force crackers or dictionary attacks, ensuring compliance with security standards."
    }
  ];

  return (
    <section id="faq" className="section-faq container reveal">
      <div className="faq-layout">
        <div className="faq-left">
          <span className="eyebrow">[ FAQ ]</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        
        <div className="faq-right">
          <div className="accordion">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className={`accordion-item ${activeIndex === index ? "active" : ""}`}
              >
                <button className="accordion-trigger" onClick={() => toggleAccordion(index)}>
                  <span>{item.q}</span>
                  <svg className="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div 
                  className="accordion-content" 
                  style={{ maxHeight: activeIndex === index ? "200px" : "0px" }}
                >
                  <div className="accordion-content-inner">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export default FAQ;
