import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Download, Copy, Check } from 'lucide-react';
import { convertAllMathToImages, createWordDocument } from '../utils/mathUtils';

interface LessonRendererProps {
  content: string;
}

const LessonRenderer: React.FC<LessonRendererProps> = ({ content }) => {
  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = async () => {
    if (!contentRef.current) return;

    setExporting(true);
    
    try {
      console.log('Starting Word export with math formula conversion...');

      // Convert all math formulas to base64 images
      const processedContainer = await convertAllMathToImages(contentRef.current, {
        scale: 3, // High resolution
        backgroundColor: 'white',
        foregroundColor: 'black'
      });

      // Get HTML content
      const htmlContent = processedContainer.innerHTML;

      // Create Word document
      const wordDocument = createWordDocument(htmlContent);

      // Create and download file
      const blob = new Blob(['\ufeff', wordDocument], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KHBD_TichHopNLS_${new Date().toISOString().slice(0, 10)}.doc`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✓ Word export completed successfully!');
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Có lỗi xảy ra khi xuất file Word. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in-up">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10 no-print">
        <h3 className="font-semibold text-slate-700">Kết Quả Tạo Bởi AI</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
          <button
            onClick={handleExportWord}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} className={exporting ? 'animate-bounce' : ''} />
            {exporting ? 'Đang xử lý...' : 'Tải File Word Đẹp'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-8 bg-white">
        {/* Reference div for export */}
        <div ref={contentRef} className="prose prose-slate prose-sm md:prose-base max-w-none markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-blue-800 border-b pb-2 mb-4 uppercase text-center" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 border-l-4 border-sky-500 pl-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-700 mt-6 mb-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-3" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-3" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border border-slate-400" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-sky-100" {...props} />,
                tbody: ({node, ...props}) => <tbody className="bg-white" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-3 text-center font-bold text-slate-800 border border-slate-400 bg-sky-50" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 text-slate-700 border border-slate-400 align-top" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-700 text-justify" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default LessonRenderer;
