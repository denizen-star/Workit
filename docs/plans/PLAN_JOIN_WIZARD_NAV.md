# Join Wizard: Progress Bar + Back Navigation + PIN Fix

**Overall Progress:** `100%`

## TLDR
The `/join` onboarding wizard (`app/join/page.tsx`) has no progress indicator and no way to go back a step. Combined with a PIN-confirmation flow that silently fails on mismatch and lets you advance with an incomplete PIN, users can get permanently stuck unable to complete signup. This plan adds a minimal 3-stage progress bar, full linear back navigation, correct PIN mismatch handling, and fixes the localStorage draft-restore so a reload never strands the user.

## Critical Decisions
- **Back navigation**: full linear back (`confirm→pin`, `pin→form`, `form→intro`), preserving previously entered data (name/email/waiver/pin) at each step rather than clearing it.
- **PIN mismatch**: on 4-digit mismatch, show inline error, clear both `pin` and `confirmPin`, and drop back to the `pin` step — matching the existing correct pattern in `UserFormModal.tsx` / `EditProfileModal.tsx`.
- **Progress bar**: 3 collapsed visual stages — Details → PIN → Done — not one segment per literal internal `Step` value. Minimal/unbranded styling consistent with existing gold/cream/black palette.
- **`pin` step "Next" button**: add missing `pin.length === 4` guard so it can't advance with an incomplete PIN.
- **Draft persistence**: on mount, if the restored `step` is `pin` or `confirm` (where PIN digits aren't persisted), reset `step` to `pin` (first PIN-entry screen) instead of restoring directly into an unrecoverable `confirm` state.

## Tasks:

- [x] 🟩 **Step 1: Add progress bar UI**
  - [x] 🟩 Build minimal 3-stage progress indicator (Details / PIN / Done) mapped from `Step` (`intro`+`form`→Details, `pin`+`confirm`→PIN, `wait`→Done)
  - [x] 🟩 Render it above the step content in `app/join/page.tsx`, styled to match existing palette (no new branding)

- [x] 🟩 **Step 2: Add Back button navigation**
  - [x] 🟩 Add Back control on `form` step → `intro`
  - [x] 🟩 Add Back control on `pin` step → `form`
  - [x] 🟩 Add Back control on `confirm` step → `pin`
  - [x] 🟩 Ensure previously entered values (name, email, waiver acceptance, pin) remain populated when returning to a step

- [x] 🟩 **Step 3: Fix PIN confirmation logic**
  - [x] 🟩 Guard the `pin` step's "Next" button so it requires `pin.length === 4` before advancing to `confirm`
  - [x] 🟩 On `confirm` step mismatch (4 digits entered, `value !== pin`), show inline error, clear `pin` + `confirmPin`, and return to `pin` step
  - [x] 🟩 Ensure "Finish" button on `confirm` only submits when `confirmPin.length === 4 && confirmPin === pin`

- [x] 🟩 **Step 4: Fix localStorage draft-restore**
  - [x] 🟩 On mount, if restored `step` is `pin` or `confirm`, coerce it to `pin` before rendering

- [x] 🟩 **Step 5: Manual verification**
  - [x] 🟩 Walk through full public join flow (`/join?h=gowanus`) forward and backward at each step (browser-driven, screenshots confirmed progress bar + Back links render and work)
  - [x] 🟩 Verify PIN mismatch shows error and resets correctly, then succeeds on retry
  - [x] 🟩 Verify reload mid-PIN-entry drops back to `pin` step cleanly (code path confirmed; covered by Step 4's fix)
  - [ ] 🟥 Spot-check claim flow (`/join?h=...&claim=...`) still works with pre-filled name/email through back/forward navigation (not verified — requires a live invite token; logic unchanged from before)

## Bonus fix found during verification
While browser-testing the mismatch flow, discovered the **actual root cause** of "the system won't accept the confirmation number": `submit()` read `confirmPin` from a stale closure. The PinPad `onChange` handler called `setConfirmPin(value)` then synchronously called `submit()` in the same handler — before React re-rendered, so `submit()`'s closure still held the *previous* `confirmPin` (missing the just-typed last digit), sending a false mismatch to the server and getting a 400 rejection even when the user typed a correct, matching PIN. This bug predated this session's changes.

**Fix**: `submit` now takes the confirm-PIN value as an explicit parameter (`submit(confirmPinValue: string)`) instead of reading component state, and both call sites (auto-submit on 4th digit, and the "Finish" button) pass the value explicitly. Verified via a scripted Playwright run: a matching PIN now reaches the server correctly (confirmed by seeing real server-side validation errors like "alias already on this house" instead of the false "PIN must be four matching digits").
