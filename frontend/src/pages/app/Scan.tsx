import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

type ScanResult = {
  disease?: string;
  crop?: string;
  severity?: "low" | "medium" | "high";
  confidence?: number;
  symptoms?: string[];
  treatment?: string[];
  prevention?: string[];
  organic?: string[];
  chemical?: string[];
  raw?: string;
};

export default function Scan() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // wait until next paint so the <video> element is mounted
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch (e: any) {
      toast.error(t("scan.cameraError"));
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        setFile(captured);
        setResult(null);
        setPreview(canvas.toDataURL("image/jpeg"));
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const pick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const r = await api.ai.scan(file);
      setResult(r.result);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const severityColor =
    result?.severity === "high" ? "text-destructive" :
    result?.severity === "medium" ? "text-warning" : "text-primary";

  return (
    <div>
      <AppHeaderBack title={t("scan.title")} />
      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
          {cameraOn ? (
            <div className="relative">
              <video ref={videoRef} playsInline muted className="mx-auto max-h-72 w-full rounded-xl bg-black object-contain" />
              <button
                onClick={stopCamera}
                className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white"
                aria-label={t("scan.stop")}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : preview ? (
            <img src={preview} alt="preview" className="mx-auto max-h-72 rounded-xl object-contain" />
          ) : (
            <div className="py-6">
              <Camera className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{t("scan.upload")}</p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] || null)}
          />

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {cameraOn ? (
              <Button onClick={capture} className="bg-primary hover:bg-primary-dark">
                <Camera className="size-4" /> {t("scan.capture")}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={startCamera}>
                  <Camera className="size-4" /> {t("scan.camera")}
                </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4" /> {t("scan.choose")}
                </Button>
                {file && (
                  <Button onClick={analyze} disabled={loading} className="bg-primary hover:bg-primary-dark">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : t("scan.analyze")}
                  </Button>
                )}
                {preview && (
                  <Button variant="ghost" onClick={reset}>
                    <X className="size-4" /> {t("common.cancel")}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                {result.disease || result.crop || "Result"}
              </h3>
              {result.severity && (
                <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${severityColor}`}>
                  {result.severity === "low" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                  {result.severity}
                </span>
              )}
            </div>
            {typeof result.confidence === "number" && (
              <p className="text-xs text-muted-foreground">
                {t("scan.confidence")}: {Math.round(result.confidence * 100)}%
              </p>
            )}
            {result.symptoms?.length ? <Section title={t("scan.symptoms")} items={result.symptoms} /> : null}
            {result.treatment?.length ? <Section title={t("scan.treatment")} items={result.treatment} /> : null}
            {result.organic?.length ? <Section title="Organic" items={result.organic} /> : null}
            {result.chemical?.length ? <Section title="Chemical" items={result.chemical} /> : null}
            {result.prevention?.length ? <Section title={t("scan.prevention")} items={result.prevention} /> : null}
            {result.raw && <pre className="whitespace-pre-wrap text-xs">{result.raw}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
