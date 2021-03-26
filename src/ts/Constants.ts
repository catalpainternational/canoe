/* A place to define various magic strings etc. that do not belong in urls.js */

export const EMPTY_SLATE_BOOT_KEY = "empty_slate_boot";

// Rendition Identifiers
// - see canoe-backend repo - TranscodeDefinition.json
// Image Renditions
export const WEBP_RENDITION = "width-800|format-webp";
export const JPEG_RENDITION = "width-600|format-jpeg";
// Video Renditions
export const WEBM_RENDITION = "webm-mono-360p-25fps-256kbit";
export const MP4V_RENDITION = "video-streamcopy-mp4mux";
// Audio Renditions
export const OPUS_RENDITION = "opus-mono-32kbit"; // AKA ogg
export const MP4A_RENDITION = "audio-streamcopy-mp4mux";
