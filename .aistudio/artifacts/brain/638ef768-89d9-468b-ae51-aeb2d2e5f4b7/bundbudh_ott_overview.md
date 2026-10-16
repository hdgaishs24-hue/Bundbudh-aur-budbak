# BUNDBUDH AUR BUDBAK — Premium Cartoon Streaming OTT Platform

## 1. Application Overview
**BUNDBUDH AUR BUDBAK** is a full-stack cartoon streaming web application built with a modern OTT user interface (Deep Navy `#070b14`, Electric Blue, and Soft Gold accents) inspired by modern streaming platforms.

### Key Highlights:
- **Official Application Branding & Logo**:
  - Incorporates the official circular logo badge featuring Badrinath and Budhdeb bursting through newspaper with 2.0 branding.
  - Used consistently across application branding, navigation header, hero banner, favicon, and profile sections.
  - Full administrator control to replace or update logos, favicons, and hero banners anytime via direct device upload or URL.
- **Firebase Authentication**:
  - **Google Sign-In**: Unlocks full access to watch episodes, post comments, reply to discussions, react to episodes, save watchlist progress, and manage profile.
  - **Guest Sign-In (Anonymous Auth)**: Allows instant watching, reactions, reading comments, and progress saving. Enforces Google sign-in prompt when attempting to post comments.
  - **Guest Account Upgrade**: Allows seamlessly linking guest accounts to Google profiles.
- **Direct Device Storage Uploads**:
  - Supports uploading directly from mobile device storage (Android Gallery, iPhone Files/Photos, Desktop) or via URL and Google Drive.
  - Equipped with live upload progress percentage, transferred bytes tracking, preview player, file validation, cancel, and retry.
  - Directly uploads to Firebase Storage (`branding/`, `series/`, `seasons/`, `episodes/`) and synchronizes Firestore metadata automatically without manual URL copying.
- **OTT Video Player**:
  - Features custom Play/Pause, Seek bar, current & remaining duration, volume & mute, fullscreen, playback speed controls (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x), buffering indicator, next/previous episode navigation, and Google Drive embed playback support.
  - Automatic watch progress persistence in Firestore every 5 seconds for resume playback and the "Continue Watching" carousel.
- **Interactive Reactions & Comments**:
  - 5 real-time episode reactions: ❤️ Love, 😂 Funny, 🔥 Amazing, 😮 Surprised, 👍 Like.
  - Real-time discussion forum with threaded replies, report flags, and user avatars.
- **Comprehensive Administrator Dashboard**:
  - Restricted to verified owner account (`hdgaishs24@gmail.com`) and custom claims in `/admins/{uid}` with owner PIN override (`2026`).
  - Full CRUD operations:
    - **Dashboard**: Real metrics for Total Series, Seasons, Episodes, Views, Likes, and Comments.
    - **App Branding**: Direct device upload for logos and hero banners.
    - **Manage Series**: Create, edit, publish/draft, and delete series.
    - **Manage Seasons**: Manage unlimited seasons with order and artwork.
    - **Manage Episodes**: Upload video files, change titles, thumbnails, move seasons, and set durations.
    - **Upload Videos**: Dedicated device video uploader component.
    - **Manage Posters & Banners**: Visual asset management gallery.
    - **Manage Comments**: Moderation console for deleting comments and handling reports.
    - **Firebase Status**: Live diagnostic monitoring for Auth, Firestore, and Storage.
