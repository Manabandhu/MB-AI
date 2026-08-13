---
name: manabandhu-referrals
description: Maintain ManaBandhu referral requests, offers, details, status tracking, consent, privacy, and user-owned referrals. Use for any change under the referrals module or its contracts.
---

# Referrals

1. Read `frontend/src/modules/referrals/MODULE.md` and affected contracts first.
2. Model request, offer, acceptance, completion, expiry, and withdrawal states explicitly.
3. Require consent before sharing identity, employer, contact, resume, or referral details; enforce access server-side.
4. Test duplicate offers, revoked consent, status races, notifications, empty/error states, and adaptive layouts.
5. Update contracts, module documentation, and this skill together.
