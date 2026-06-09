// import { useEffect, useState } from "react";
import * as Icons from "lucide-react";

const ChapterContent = ({ sections }) => {
  if (!sections?.length) {
    return <p className="text-slate-600">No content available for this chapter.</p>;
  }

  // Explain with AI — disabled for now
  // const [aiStates, setAiStates] = useState({});

  // useEffect(() => {
  //   setAiStates({});
  // }, [sections]);

  const renderIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = Icons[iconName];
    if (!Icon) return null;
    return <Icon className="inline-block w-5 h-5 mr-2 text-blue-600 align-text-bottom" />;
  };

  const renderListIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = Icons[iconName];
    if (!Icon) return null;
    return <Icon className="inline-block w-4 h-4 mr-2 text-slate-400 align-text-bottom mt-1 shrink-0" />;
  };

  // Explain with AI — disabled for now
  // const isReviewChunk = sections.some(
  //   (s) => s.type === "heading" && s.text?.toLowerCase().includes("review")
  // );

  // const shouldShowAIButton = (section) => {
  //   if (section.type !== "paragraph") return false;
  //   if (isReviewChunk) return false;
  //   const text = section.text || "";
  //   if (text.length < 140) return false;
  //   return true;
  // };

  /*
  const generateAIExplanation = (section) => {
    const text = section.text || "";
    const lower = text.toLowerCase();

    if (lower.includes("vicap is not a poster")) {
      return "VICAP is the cultural foundation of Accessible Publishers. These five values ensure that every department, from editorial to logistics, operates with the same standards of excellence that have defined us since 1996.";
    }
    if (lower.includes("value addition means we never")) {
      return "Value addition is about exceeding expectations. When you suggest the right book series or catch an error before printing, you are directly contributing to customer loyalty and the company's reputation for quality.";
    }
    if (lower.includes("innovation at accessible publishers is not limited")) {
      return "Innovation belongs to everyone. Whether you improve a process in production or create a checklist in customer service, you are helping the company serve learners more efficiently and stay ahead in the industry.";
    }
    if (lower.includes("no single department wins alone")) {
      return "Collaboration turns individual effort into organisational success. When sales, editorial, production, and logistics work as one team, schools receive better service and the company wins more adoptions.";
    }
    if (lower.includes("accountability means owning your outcomes")) {
      return "Accountability protects our most valuable asset: trust. Clients like UBEC, the Police, and examination bodies rely on us because they know we take full responsibility for our work and protect sensitive materials.";
    }
    if (lower.includes("professionalism is visible in how we dress")) {
      return "Professionalism and ethics are how we represent the company daily. They ensure that authors, schools, and government partners see Accessible Publishers as reliable, respectful, and worthy of long-term partnership.";
    }
    if (lower.includes("vicap is the standard we measure")) {
      return "Living VICAP daily turns your role into part of a larger legacy. It connects your personal contribution to the company's vision of becoming Africa's most innovative publishing house.";
    }
    if (lower.includes("more than a publisher")) {
      return "We are partners in education. Every staff member represents a legacy that began in 1996 and now touches millions of learners across Nigeria through quality books and accessible formats.";
    }
    if (lower.includes("picture a classroom in a rural school")) {
      return "Our work reaches the most remote classrooms. When you do your job well, you help a child in Borno or a student at Obafemi Awolowo University access the same high-quality learning materials.";
    }
    if (lower.includes("from our very first titles")) {
      return "Our national and international presence gives every employee a sense of pride and responsibility. We are not just a local publisher; we represent Nigerian educational excellence on the global stage.";
    }
    if (lower.includes("imagine trying to stock books for 50,000")) {
      return "Our massive distribution footprint means your daily work has national impact. Every order processed, every title printed, and every delivery completed serves learners in all 36 states.";
    }
    if (lower.includes("our catalogue is no longer limited to paper")) {
      return "Born-accessible publishing reflects our commitment to inclusion. By offering print, audio, e-book, and Braille, we ensure no learner is excluded because of format or ability.";
    }
    if (lower.includes("walk into any well-stocked school library")) {
      return "Curriculum-aligned publishing is our core strength. It ensures teachers can focus on teaching while students receive materials that prepare them for exams and real life.";
    }
    if (lower.includes("not every print job is a textbook")) {
      return "Security printing demands the highest standards of confidentiality and precision. Handling examination papers and official documents for national institutions is a responsibility we carry with pride.";
    }
    if (lower.includes("a great story or lesson should not be locked")) {
      return "Multiple formats are not just nice to have; they are essential. They allow us to meet every learner where they are while preparing Nigerian education for a digital future.";
    }
    if (lower.includes("smart edu hub is not just another app")) {
      return "Smart Edu Hub is our flagship innovation. It extends our mission beyond print into digital learning, giving schools modern tools for management, assessment, and interactive education.";
    }
    if (lower.includes("awards are not just trophies")) {
      return "Each award validates the collective effort of every department. They give staff added credibility when representing Accessible Publishers to clients and partners.";
    }
    if (lower.includes("we are proud to serve the nigerian police")) {
      return "Serving security agencies and education ministries requires absolute integrity. Your work helps maintain the trust these institutions place in us for their most sensitive materials.";
    }
    if (lower.includes("behind every title we publish")) {
      return "Our leaders model the blend of expertise and vision that drives the company. Their national and international roles open doors that benefit every staff member.";
    }

    return "This section highlights an important part of our identity. Understanding it helps you represent Accessible Publishers with pride and clarity in your daily interactions.";
  };

  const handleExplainWithAI = (index, section) => {
    setAiStates((prev) => ({
      ...prev,
      [index]: { loading: true, explanation: null },
    }));

    setTimeout(() => {
      const explanation = generateAIExplanation(section);
      setAiStates((prev) => ({
        ...prev,
        [index]: { loading: false, explanation },
      }));
    }, 1400);
  };
  */

  const renderSectionContent = (section, index) => {
    let contentElement = null;

    if (section.type === "heading") {
      contentElement = (
        <h2
          key={index}
          className="mt-8 text-xl font-bold text-slate-950 flex items-center first:mt-0"
        >
          {renderIcon(section.icon)}
          {section.text}
        </h2>
      );
    } else if (section.type === "list") {
      contentElement = (
        <ul key={index} className="my-4 space-y-3 text-slate-700">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start">
              {section.itemIcon ? renderListIcon(section.itemIcon) : <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5 mr-3 shrink-0" />}
              <span>{item.text || item}</span>
            </li>
          ))}
        </ul>
      );
    } else if (section.type === "illustration") {
      contentElement = (
        <div key={index} className="my-6 rounded-2xl bg-blue-50 p-6 flex gap-4 items-start border border-blue-100">
          {section.icon && (
            <div className="p-2 bg-white rounded-lg shadow-sm shrink-0 text-blue-600">
              {renderIcon(section.icon)}
            </div>
          )}
          <p className="m-0 leading-relaxed text-slate-800">
            <strong>{section.title}:</strong> {section.text}
          </p>
        </div>
      );
    } else {
      contentElement = (
        <p key={index} className="my-4 leading-8 text-slate-700 flex items-start gap-2">
          {section.icon && (
            <span className="shrink-0 mt-1">
              {renderIcon(section.icon)}
            </span>
          )}
          <span>{section.text}</span>
        </p>
      );
    }

    // Explain with AI — disabled for now
    // const showAIForThisSection = shouldShowAIButton(section);
    // if (showAIForThisSection) {
    //   return (
    //     <div key={index}>
    //       {contentElement}
    //       {!aiState && (
    //         <button
    //           onClick={() => handleExplainWithAI(index, section)}
    //           className="mt-1 mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
    //         >
    //           <Icons.Sparkles className="h-3.5 w-3.5" />
    //           Explain with AI
    //         </button>
    //       )}
    //       {aiState?.loading && (
    //         <div className="mt-1 mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
    //           <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    //           AI is generating a deeper explanation…
    //         </div>
    //       )}
    //       {aiState?.explanation && (
    //         <div className="mt-1 mb-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
    //           <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-blue-700">
    //             <Icons.Bot className="h-4 w-4" />
    //             AI Insight
    //           </div>
    //           {aiState.explanation}
    //         </div>
    //       )}
    //     </div>
    //   );
    // }

    return contentElement;
  };

  return (
    <article className="prose prose-slate max-w-none">
      {sections.map((section, index) => renderSectionContent(section, index))}
    </article>
  );
};

export default ChapterContent;
