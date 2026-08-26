# Referrals

Owns referral discovery, requests, offers, details, status tracking, user-owned referrals, consent, and privacy boundaries.

The first Stitch batch routes `/referrals`, `/referrals/request`, `/referrals/offer`, `/referrals/[referralId]`, and `/referrals/mine` share `screens/ReferralsHomeScreen.tsx`, `referralsFallbacks.ts`, and the read-only demo endpoint `GET /api/v1/referrals/screens/{screenId}`.

Additional screens: `RequestReferralScreen`, `OfferReferralScreen`, `ReferralDetailsScreen`, `MyReferralsScreen`.
