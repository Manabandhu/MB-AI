# Referrals

Owns referral discovery, requests, offers, details, status tracking, user-owned referrals, consent, and privacy boundaries.

The Stitch-designed routes `/referrals`, `/referrals/request`, `/referrals/offer`, `/referrals/[referralId]`, and `/referrals/mine` fetch live data from `GET /api/v1/referrals` and `GET /api/v1/referrals/screens/{screenId}`. No frontend fallback data is used.

Additional screens: `RequestReferralScreen`, `OfferReferralScreen`, `ReferralDetailsScreen`, `MyReferralsScreen`.
- Phase 1 (2026-10-14): see `.codex/skills/manabandhu-referrals/SKILL.md` for the current API surface, removed fake features, and known gaps.
