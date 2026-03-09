import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, FileText, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Claim = {
  claimSnippet?: string;
  text: string;
  verdict: string;
  color: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
};

type AnalysisResult = {
  trustScore: number;
  verdict: string;
  claims: Claim[];
};

const verdictColorMap: Record<string, string> = {
  Verified: "#16A34A",
  Uncertain: "#D97706",
  Hallucinated: "#DC2626",
  Unverifiable: "#6B7280",
};

const MAX_CHARS = 4000;
const MAX_PDF_SIZE = 5 * 1024 * 1024;

const Index = () => {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("paste");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // PDF state
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const processPdf = useCallback(async (f: File) => {
    if (f.size > MAX_PDF_SIZE) {
      setPdfError("This PDF is too large. Please try a smaller file.");
      return;
    }

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
    setShowResults(false);
    setResult(null);
    setApiError(null);
  };

  const handleClear = () => {
    setText("");
    clearPdf();
    setShowResults(false);
    setResult(null);
    setApiError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      if (f.size > MAX_PDF_SIZE) {
        setPdfError("This PDF is too large. Please try a smaller file.");
        return;
      }
      processPdf(f);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === "application/pdf") {
      if (f.size > MAX_PDF_SIZE) {
        setPdfError("This PDF is too large. Please try a smaller file.");
        return;
      }
      processPdf(f);
    }
  };

  const handleAnalyse = async () => {
    let inputText = activeTab === "paste" ? text : pdfText;
    if (!inputText?.trim()) {
      toast.error("Please paste text or upload a PDF first.");
      return;
    }

    inputText = inputText.slice(0, MAX_CHARS);

    setLoading(true);
    setShowResults(false);
    setResult(null);
    setApiError(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-claims", {
        body: { inputText },
      });

      if (error) {
        console.error("Edge function error:", error);
        setApiError("Audit failed. Check your API key and try again.");
        return;
      }

      if (data?.error) {
        console.error("API error:", data.error);
        setApiError("Audit failed. Check your API key and try again.");
        return;
      }

      setResult(data as AnalysisResult);
      setShowResults(true);
    } catch (e) {
      console.error("Unexpected error:", e);
      setApiError("Audit failed. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isAllUnverifiable = result && (result.trustScore === -1 || result.trustScore === null || result.trustScore === 0) && result.claims?.every(c => c.verdict === "Unverifiable");
  const scoreColor = isAllUnverifiable
    ? "#6B7280"
    : result && result.trustScore >= 70
    ? "#16A34A"
    : result && result.trustScore >= 40
    ? "#D97706"
    : "#DC2626";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[hsl(0_0%_11%)] px-4 sm:px-6 py-4 flex items-center justify-between gap-4 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-primary-foreground tracking-tight shrink-0">TruthLens AI</h1>
        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate min-w-0">
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

        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto bg-secondary">
            <TabsTrigger value="paste" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Paste Text</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-6">
            <Textarea
              rows={8}
              placeholder="Paste any AI-generated text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="resize-none text-base text-foreground"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
              </span>
              {text.length > MAX_CHARS && (
                <span className="text-[hsl(38_92%_50%)] font-medium">
                  Long document — only the first 4,000 characters will be audited
                </span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            {pdfFileName && !pdfLoading ? (
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
                    <p className="text-xs text-muted-foreground">PDF files only (max 5 MB)</p>
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

        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleAnalyse}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 text-base font-semibold rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysing...
              </>
            ) : (
              "Analyse Now"
            )}
          </Button>

          {apiError && (
            <div className="w-full rounded-lg border border-[hsl(30_80%_60%)] bg-[hsl(30_100%_95%)] px-4 py-3 text-sm text-[hsl(30_80%_30%)]">
              {apiError}
            </div>
          )}
        </div>

        {showResults && result ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left — Circular Gauge */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    {isAllUnverifiable ? (
                      <>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#6B7280" strokeWidth="8" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="0" transform="rotate(-90 60 60)" />
                        <text x="60" y="58" textAnchor="middle" className="text-3xl font-bold fill-foreground" fontSize="28" fontWeight="700">--</text>
                      </>
                    ) : (
                      <>
                        <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round" strokeDasharray="327" strokeDashoffset={327 * (1 - result.trustScore / 100)} transform="rotate(-90 60 60)" />
                        <text x="60" y="55" textAnchor="middle" className="text-3xl font-bold fill-foreground" fontSize="28" fontWeight="700">{result.trustScore}</text>
                        <text x="60" y="75" textAnchor="middle" className="fill-muted-foreground" fontSize="12">/100</text>
                      </>
                    )}
                  </svg>
                  <span className="text-sm font-bold" style={{ color: isAllUnverifiable ? "#6B7280" : scoreColor }}>
                    {isAllUnverifiable ? "Not Applicable" : result.verdict}
                  </span>
                </div>

                {/* Right — Verdict Cards */}
                <div className="flex flex-col gap-4">
                  {result.claims.map((claim, i) => {
                    let subtext = "";
                    if (claim.verdict === "Verified") subtext = "Confirmed by live sources";
                    else if (claim.verdict === "Uncertain") subtext = "Partially supported by available sources";
                    else if (claim.verdict === "Hallucinated") subtext = "Flagged: statistic could not be verified by live sources";
                    else if (claim.verdict === "Unverifiable") subtext = "Personal statement — cannot be fact-checked";
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card p-4 shadow-sm"
                      >
                        <p className="text-foreground font-medium mb-3">"{claim.claimSnippet || claim.text}"</p>
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ color: claim.color, backgroundColor: `${claim.color}18` }}
                          >
                            {claim.verdict}
                          </span>
                          {claim.sourceUrl ? (
                            <a
                              href={claim.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline"
                            >
                              {claim.sourceTitle || "View source →"}
                            </a>
                          ) : (
                            <span className="text-sm italic text-muted-foreground">
                              {subtext}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="rounded-lg bg-muted p-12 text-center">
            <p className="text-muted-foreground">Your audit will appear here</p>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Index;
