# Security Specification for BUNDBUDH AUR BUDBAK

## 1. Data Invariants
- Series, Seasons, and Episodes are published content curated by administrators.
- Anonymous (Guest) users may read published items, record their own watch history, and submit/toggle their own reactions.
- Anonymous users CANNOT create or delete comments.
- Google authenticated users can create comments and delete their own comments.
- Only verified administrators (by email or admin document) can create, update, or delete series, seasons, episodes, and appSettings.
- Reactions and watch history are keyed or owned by `request.auth.uid`.

## 2. The Dirty Dozen Attack Vectors & Prevention
1. **Unauthenticated Content Write:** Guest attempts to create or edit a Series. -> Denied: `isAdmin()` check fails.
2. **Anonymous Comment Insertion:** Guest attempts to write to `/comments`. -> Denied: Requires `!request.auth.token.firebase.sign_in_provider == 'anonymous'` / verified Google user.
3. **Comment Impersonation:** User attempts to post comment with `userId` of another person. -> Denied: `incoming().userId == request.auth.uid`.
4. **Reaction Overwrite of Another User:** User tries to delete or alter another user's reaction document. -> Denied: doc ID / userId matches `request.auth.uid`.
5. **Watch History Poisoning:** User attempts to write to another user's watch history. -> Denied: `incoming().userId == request.auth.uid`.
6. **Admin Escalation via Profile Edit:** User tries to set their role to 'admin' in `/users`. -> Denied: Non-admins cannot update role field.
7. **Junk ID Injection:** Attacker tries to inject 2KB malicious doc ID. -> Denied: `isValidId(id)` limit <= 128 characters regex match.
8. **Malicious Oversized Payload:** Attacker sends 5MB text payload in comment. -> Denied: `incoming().text.size() <= 1000`.
9. **Unpublished Content Leak:** Guest tries to list draft/unreleased episodes. -> Handled: `resource.data.published == true || isAdmin()`.
10. **Unauthorized App Settings Tampering:** Attacker tries to change app logo/branding. -> Denied: `isAdmin()` required for `/appSettings`.
11. **Timestamp Forgery:** Attacker sends fake past/future dates. -> Denied: `request.time` server verification where required.
12. **Comment Moderation Bypass:** Normal user tries to delete another user's comment. -> Denied: `resource.data.userId == request.auth.uid || isAdmin()`.
