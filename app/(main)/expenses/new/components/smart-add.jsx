"use client";

import { useRef, useState } from "react";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useConvexAction } from "@/hooks/use-convex-query";
import { toast } from "sonner";

// Resizes/compresses the photo client-side before it ever leaves the
// browser — a full-resolution phone photo can be 5-10MB, which is slow to
// upload and unnecessarily close to Convex's action-argument size limit.
// A 1280px-wide JPEG is still plenty sharp for Gemini to read a receipt.
function fileToResizedBase64(file, maxDim = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function SmartAdd({ type, onParsed }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null); // { previewUrl, base64 }
  const fileInputRef = useRef(null);
  const { execute, isLoading } = useConvexAction(api.ai.parseExpenseInput);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      const base64 = await fileToResizedBase64(file);
      setImage({ previewUrl: URL.createObjectURL(file), base64 });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleParse = async () => {
    if (!text.trim() && !image) {
      toast.error("Type a description or add a receipt photo first");
      return;
    }
    try {
      const result = await execute({
        text: text.trim() || undefined,
        imageBase64: image?.base64,
        mimeType: "image/jpeg",
      });
      toast[result.amount ? "success" : "warning"](
        result.amount
          ? "Filled in the details below — check them before saving"
          : "Couldn't find a clear amount — check the fields below"
      );
      onParsed(result);
    } catch {
      // useConvexAction already surfaced a toast for this
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-brand/40 bg-lilac/20 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-brand">
        <Sparkles className="h-4 w-4" />
        Smart add (AI)
      </div>
      <p className="text-xs text-slate-500">
        Describe the expense in your own words, or attach a photo of the
        receipt — Gemini will fill in the fields below for you to check.
        {type === "group" &&
          " Group expenses still split across every group member; use this for the description, amount, category and date."}
      </p>

      <Textarea
        placeholder='e.g. "Dinner with Sam and Priya, split equally, about $60"'
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {image ? "Change photo" : "Add receipt photo"}
        </Button>

        {image && (
          <span className="flex items-center gap-1.5">
            <img
              src={image.previewUrl}
              alt="Receipt preview"
              className="h-8 w-8 rounded object-cover"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        <Button
          type="button"
          size="sm"
          className="ml-auto rounded-full"
          onClick={handleParse}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Reading\u2026" : "Parse with AI"}
        </Button>
      </div>
    </div>
  );
}
