# Pending Tasks for NameAssist

1. **Google Authentication Security**: Verify the Google token via the `google-auth` library rather than blindly trusting the client-supplied payload (in `backend/apps/accounts/views.py`).
2. **Email Verification Flow**: Implement the email verification logic to confirm user emails after sign up (in `backend/apps/accounts/views.py`).
3. **Password Reset Flow**: Implement the password reset logic involving token generation, emailing, and verification (in `backend/apps/accounts/views.py`).
4. **Application Status Notifications**: Dispatch a notification task via `transaction.on_commit(...)` when an application transitions to a new status (in `backend/apps/applications/services.py`).
# SIRI.DEV
