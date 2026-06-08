import { Lock } from "lucide-react";

const LockedChapterModal = ({ isOpen, onClose, firstName, chapterTitle, previousChapterTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl duration-300">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <Lock className="h-10 w-10 text-slate-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-950">
          Hold on, {firstName}! 🛑
        </h2>
        <p className="mb-6 leading-relaxed text-slate-600">
          The chapter <strong>"{chapterTitle}"</strong> is currently locked. 
          To unlock it, you need to complete the previous chapter:{" "}
          <strong className="text-slate-800">"{previousChapterTitle}"</strong>.
        </p>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
          onClick={onClose}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default LockedChapterModal;
