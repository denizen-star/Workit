"use client";

import { ExternalLink, X } from "lucide-react";
import { youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/exerciseMedia";

interface VideoModalProps {
  open: boolean;
  title: string;
  videoId: string;
  onClose: () => void;
}

export default function VideoModal({ open, title, videoId, onClose }: VideoModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="glass-card relative w-full max-w-3xl overflow-hidden">
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
        <div className="aspect-video w-full bg-black">
          <iframe
            src={youtubeEmbedUrl(videoId)}
            title={`${title} demonstration`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/10">
          <div className="aspect-square bg-black">
            <img
              src={`/api/exercise-image?name=${encodeURIComponent(title)}&type=start&v=2`}
              alt={`${title} start position`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="aspect-square bg-black">
            <img
              src={`/api/exercise-image?name=${encodeURIComponent(title)}&type=end&v=2`}
              alt={`${title} end position`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
        <div className="px-5 py-4">
          <a
            href={youtubeWatchUrl(videoId)}
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
