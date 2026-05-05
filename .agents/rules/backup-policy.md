---
trigger: always_on
---

# Backup & Sync Rules
- **Local First**: The app must be 100% functional without an internet connection.
- **Backup Format**: Export the database as a `.db` file or a compressed JSON dump for GDrive.
- **Integrity Check**: Before restoring a backup, validate the schema version to avoid app crashes.