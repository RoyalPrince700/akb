import * as Icons from "lucide-react";

const ChapterContent = ({ sections }) => {
  if (!sections?.length) {
    return <p className="text-slate-600">No content available for this chapter.</p>;
  }

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

  return (
    <article className="prose prose-slate max-w-none">
      {sections.map((section, index) => {
        if (section.type === "heading") {
          return (
            <h2
              key={index}
              className="mt-8 text-xl font-bold text-slate-950 flex items-center first:mt-0"
            >
              {renderIcon(section.icon)}
              {section.text}
            </h2>
          );
        }

        if (section.type === "list") {
          return (
            <ul key={index} className="my-4 space-y-3 text-slate-700">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start">
                  {section.itemIcon ? renderListIcon(section.itemIcon) : <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5 mr-3 shrink-0" />}
                  <span>{item.text || item}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (section.type === "illustration") {
          return (
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
        }

        return (
          <p key={index} className="my-4 leading-8 text-slate-700 flex items-start gap-2">
            {section.icon && (
              <span className="shrink-0 mt-1">
                {renderIcon(section.icon)}
              </span>
            )}
            <span>{section.text}</span>
          </p>
        );
      })}
    </article>
  );
};

export default ChapterContent;
