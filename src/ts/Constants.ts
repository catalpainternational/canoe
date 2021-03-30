/* A place to define various magic strings etc. that do not belong in urls.js */

export const EMPTY_SLATE_BOOT_KEY = "empty_slate_boot";

// Rendition Identifiers
// - see canoe-backend repo - TranscodeDefinition.json
// Image Renditions
export const WEBP_RENDITION = "width-800|format-webp"; // .webp
export const JPEG_RENDITION = "width-600|format-jpeg"; // .jpeg
// Video Renditions
export const ORIG_V_RENDITION = "original-video"; // Any extension
export const H264_360P_RENDITION = "H264-360p-28"; // .mp4
export const H264_480P_RENDITION = "H264-480p-28"; // .mp4
export const H265_360P_RENDITION = "H265-360p-28q"; // .mp4
export const H265_480P_RENDITION = "H265-480p-20q"; // .mp4
export const VP9_360P_RENDITION = "VP9-360p-35q"; // .webm
export const VP9_480P_RENDITION = "VP9-480p-20q"; // .webm
export const WEBM_RENDITION = "webm-mono-360p-25fps-256kbit"; // .webm
// Audio Renditions
export const ORIG_A_RENDITION = "original-audio"; // Any extension
export const OPUS_RENDITION = "opus-mono-32kbit"; // .ogg
// Other Renditions
export const ORIG_RENDITION = "original"; // Any extension

// Inactive (Previous/Unused Transcodes)
export const AV1_360P_RENDITION = "AV1-360p-48q";
export const AV1_480P_RENDITION = "AV1-480p-32q";
export const MP4MUXV_RENDITION = "video-streamcopy-mp4mux";
export const MP4MUXA_RENDITION = "audio-streamcopy-mp4mux";
