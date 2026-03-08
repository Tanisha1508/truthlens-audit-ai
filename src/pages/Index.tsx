import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, FileText, AlertCircle } from "lucide-react";

const AI_SOURCES = ["ChatGPT", "Claude", "Gemini", "Copilot", "Other"] as const;

const Index = () => {
  const [selectedSource, setSelectedSource] = useState<string>("ChatGPT");
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("paste");

  // PDF state
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const processPdf = useCallback(async (f: File) => {
    setPdfLoading(true);
    setPdfError(null);

    try {
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF library not loaded");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const parts: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        parts.push(pageText);
      }

      const extracted = parts.join("\n\n");
      if (!extracted.trim()) throw new Error("empty");

      setPdfText(extracted);
      setPdfFileName(f.name);
      setPdfPageCount(totalPages);
    } catch {
      setPdfError(
        "Could not read this PDF. Please try a different file or paste the text manually."
      );
    } finally {
      setPdfLoading(false);
    }
  }, []);

  const clearPdf = () => {
    setPdfText(null);
    setPdfFileName(null);
    setPdfPageCount(0);
    setPdfError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") processPdf(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === "application/pdf") processPdf(f);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[hsl(0_0%_11%)] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">TruthLens AI</h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Audit AI-generated content before it reaches your clients
        </p>
      </header>

      <main className="mx-auto max-w-[860px] px-4 py-10 space-y-8">
        {pdfError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{pdfError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto bg-secondary">
            <TabsTrigger value="paste" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Paste Text</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-6 space-y-6">
            <Textarea
              rows={8}
              placeholder="Paste any AI-generated text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="resize-none text-base text-[hsl(0_0%_24%)]"
            />
            {/* LLM source selector — only for paste tab */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {AI_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                    selectedSource === source
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            {pdfFileName && !pdfLoading ? (
              /* File confirmation */
              <div className="flex items-center gap-4 rounded-lg border border-border bg-secondary p-6">
                <FileText className="h-10 w-10 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{pdfFileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {pdfPageCount} page{pdfPageCount !== 1 ? "s" : ""} · ready to audit
                  </p>
                </div>
                <button
                  onClick={clearPdf}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary py-16 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {pdfLoading ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm font-medium text-foreground">Reading PDF...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Drag a PDF here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">PDF files only</p>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 text-base font-semibold rounded-lg">
            Analyse Now
          </Button>
        </div>

        <div className="rounded-lg bg-[hsl(0_0%_96%)] p-12 text-center">
          <p className="text-muted-foreground">Your audit will appear here</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
