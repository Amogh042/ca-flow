import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, File } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import { useDocument } from "@/hooks/useDocuments";
import { useActivities } from "@/hooks/useActivities";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DocumentDetails() {
  const { id } = useParams();
  const docQuery = useDocument(id);
  const activitiesQuery = useActivities();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const document = docQuery.data;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (_) {}
      }
    };
  }, [previewUrl]);

  async function handleDownload() {
    if (!isSupabaseConfigured()) return;
    if (!document?.storagePath) {
      toast({ title: "No file", description: "No storage path available for this document" });
      return;
    }
    try {
      setLoadingPreview(true);
      const { data, error } = await supabase!.storage.from("client-documents").download(document.storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (err: any) {
      toast({ title: "Download failed", description: err?.message || "Could not download file" });
    } finally {
      setLoadingPreview(false);
    }
  }

  if (docQuery.status === "pending") return <div className="max-w-7xl mx-auto py-8">Loading document...</div>;
  if (!document) return <div className="max-w-7xl mx-auto py-8">Document not found.</div>;

  const relatedActivities = (activitiesQuery.data || []).filter((a) => a.kind === "document" && (a.detail.includes(document.name) || (document.fileName && a.detail.includes(document.fileName))));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="card-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-secondary">Document</div>
            <h2 className="text-2xl font-semibold text-white mt-2">{document.name}</h2>
            <p className="mt-1 text-sm text-secondary">{document.period} · {document.type}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="h-9 px-3 rounded-md bg-white/5 text-sm text-white flex items-center gap-2">
              <Download className="inline-block" /> Preview / Download
            </button>
            <Link to="/documents" className="text-sm text-primary ml-3">Back to documents</Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4 min-h-[220px]">
              <div className="text-sm font-semibold text-white mb-2">Preview</div>
              {loadingPreview ? (
                <div className="text-sm text-secondary">Loading preview…</div>
              ) : previewUrl && document.mimeType?.includes("pdf") ? (
                <iframe title="preview" src={previewUrl} className="w-full h-[480px]" />
              ) : previewUrl ? (
                <div>
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="text-primary">Open file in new tab</a>
                </div>
              ) : (
                <div className="text-sm text-secondary">No preview available. Click preview to download the file.</div>
              )}
            </div>

            <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-sm font-semibold text-white mb-2">Extracted text</div>
              {document.status === "processing" || document.status === "uploaded" ? (
                <div className="text-sm text-secondary">Extraction in progress…</div>
              ) : document.extractedText ? (
                <pre className="whitespace-pre-wrap text-sm text-white max-h-96 overflow-auto">{document.extractedText}</pre>
              ) : (
                <div className="text-sm text-secondary">No extracted text available.</div>
              )}
            </div>

            <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-sm font-semibold text-white mb-2">AI summary</div>
              {document.aiSummary ? (
                <div className="text-sm text-white">{document.aiSummary}</div>
              ) : (
                <div className="text-sm text-secondary">No summary available.</div>
              )}
            </div>

            <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-sm font-semibold text-white mb-2">Extracted structured data</div>
              {document.extractedData ? (
                <pre className="whitespace-pre-wrap text-sm text-white max-h-48 overflow-auto">{JSON.stringify(document.extractedData, null, 2)}</pre>
              ) : (
                <div className="text-sm text-secondary">No structured data available.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-sm font-semibold text-white mb-2">Upload metadata</div>
              <div className="text-sm text-secondary">File name: <span className="text-white">{document.fileName || document.name}</span></div>
              <div className="text-sm text-secondary">Size: <span className="text-white">{document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : "—"}</span></div>
              <div className="text-sm text-secondary">MIME: <span className="text-white">{document.mimeType || "—"}</span></div>
              <div className="text-sm text-secondary">Uploaded by: <span className="text-white">{document.uploadedBy || "—"}</span></div>
              <div className="text-sm text-secondary">Status: <span className="text-white">{document.status}</span></div>
              <div className="text-sm text-secondary">Confidence: <span className="text-white">{document.confidenceScore ?? "—"}</span></div>
            </div>

            <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-sm font-semibold text-white mb-2">Activity</div>
              <div className="space-y-2">
                {relatedActivities.length ? (
                  relatedActivities.map((a) => (
                    <div key={a.id} className="text-sm text-secondary">
                      <div className="text-white">{a.title}</div>
                      <div className="text-xs">{a.detail}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-secondary">No activity yet for this document.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
