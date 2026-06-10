# PHASE 3: AUTHENTICATION & ACCOUNT MANAGEMENT
**Goal:** Implement complete authentication system supporting local citizens (phone OTP), diaspora citizens (email only), staff, admin, and 2FA.

## Registration System

| Task ID | Task | Fields | Special Logic |
|---------|------|--------|---------------|
| P3-T1 | Local Citizen Registration | First Name, Middle Name (opt), Last Name, Mobile Number (OTP), Email (opt), Nationality, Location, Password | Auto-assign office from street mapping |
| P3-T2 | Diaspora Citizen Registration | First Name, Middle Name (opt), Last Name, Email (verification), Passport Number, Date of Birth, Gender, Origin Location, Country of Residence, City, Password | No SMS OTP, email-only verification |
| P3-T3 | OTP Service | 6-digit code, 5 min expiry, Redis storage | SMS gateway integration |
| P3-T4 | Email Verification Service | Secure token, 24 hour expiry | For diaspora and optional email |

## Authentication Flows

### Local Citizen Flow
1. Enter mobile number
2. Receive 6-digit OTP via SMS (Africa's Talking)
3. Verify OTP
4. Complete profile (name, location)
5. Auto-assign to office via street mapping
6. Set password
7. Account ready

### Diaspora Citizen Flow
1. Enter email
2. Receive verification link (24h expiry)
3. Click link to verify email
4. Complete profile (passport, date of birth, location)
5. Set password
6. Account ready (no office assignment)

## Database Schema Extensions (Phase 1)
The following tables support Phase 3:
- `profiles` — citizen accounts, identity verification flags
- `citizen_verifications` — verification records with methods & expiry

## Success Criteria for Phase 3

- [ ] OTP generation & validation working
- [ ] SMS delivery confirmed (Africa's Talking test)
- [ ] Email verification links secure & time-limited
- [ ] Local & diaspora flows tested end-to-end
- [ ] Rate limiting on OTP requests (max 5/hour)
- [ ] Account creation audit logged
- [ ] Staff/admin registration separate flow
- [ ] 2FA optional toggle functional
