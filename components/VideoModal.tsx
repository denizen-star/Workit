"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { youtubeEmbedUrl, youtubeWatchUrl, type ExerciseVideo } from "@/lib/exerciseMedia";
import { getExerciseImages } from "@/lib/exerciseImages";

interface VideoModalProps {
  open: boolean;
  title: string;
  videoId: string;
  videos?: ExerciseVideo[];
  how?: string | null;
  onClose: () => void;
}

export default function VideoModal({ open, title, videoId, videos, how, onClose }: VideoModalProps) {
  const options = videos?.length ? videos : videoId ? [{ id: videoId, label: "Form video" }] : [];
  const [activeId, setActiveId] = useState(options[0]?.id || videoId);

  useEffect(() => {
    if (!open) return;
    setActiveId(options[0]?.id || videoId);
  }, [open, title, videoId, videos]);

  if (!open) return null;

  const current = options.find((item) => item.id === activeId) || options[0];
  const currentId = current?.id || videoId;
  const photos = title.includes(' · ') ? null : getExerciseImages(title);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="glass-card relative max-h-[min(92dvh,100%)] w-full max-w-3xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Form video</p>
            <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {options.length > 1 && (
          <div className="flex gap-2 px-5 pb-3">
            {options.map((video) => {
              const selected = video.id === currentId;
              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setActiveId(video.id)}
                  className={`min-h-11 flex-1 rounded-2xl border px-3 text-sm font-semibold ${
                    selected
                      ? "border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]"
                      : "border-white/10 bg-black/25 text-[#f6f1e3]/75"
                  }`}
                >
                  {video.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="aspect-video w-full bg-black">
          {currentId ? (
            <iframe
              src={youtubeEmbedUrl(currentId)}
              title={`${current?.label || title} demonstration`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>
        {photos && (
          <div className="grid grid-cols-2 gap-px bg-white/10">
            <div className="aspect-square bg-black">
              <img
                src={photos.start}
                alt={`${title} start position`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="aspect-square bg-black">
              <img
                src={photos.end}
                alt={`${title} end position`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
        <div className="px-5 py-4">
          {how ? <p className="mb-4 text-base leading-relaxed text-[#f6f1e3]/80">{how}</p> : null}
          <a
            href={youtubeWatchUrl(currentId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white hover:text-gray-200"
          >
            <ExternalLink className="h-4 w-4" />
            Open short video on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
