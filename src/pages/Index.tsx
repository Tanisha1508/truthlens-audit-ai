import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const AI_SOURCES = ["ChatGPT", "Claude", "Gemini", "Copilot", "Other"] as const;

const Index = () => {
  const [selectedSource, setSelectedSource] = useState<string>("ChatGPT");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === "application/pdf") setFile(f);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="bg-[hsl(0_0%_11%)] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">TruthLens AI</h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Audit AI-generated content before it reaches your clients
        </p>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[860px] px-4 py-10 space-y-8">
        {/* Tabs */}
        <Tabs defaultValue="paste" className="w-full">
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
              className="resize-none text-base text-[hsl(0_0%_24%)]"
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary py-16 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {file ? file.name : "Drag a PDF here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">PDF files only</p>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </TabsContent>
        </Tabs>

        {/* AI Source Selector */}
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

        {/* Analyse Button */}
        <div className="flex justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 text-base font-semibold rounded-lg">
            Analyse Now
          </Button>
        </div>

        {/* Results Placeholder */}
        <div className="rounded-lg bg-[hsl(0_0%_96%)] p-12 text-center">
          <p className="text-muted-foreground">Your audit will appear here</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
