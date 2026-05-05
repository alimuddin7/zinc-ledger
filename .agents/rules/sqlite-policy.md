---
trigger: always_on
---

# SQLite & Persistence Rules
- **Engine**: Use `expo-sqlite` for all database operations.
- **Async Operations**: All DB transactions must be asynchronous to prevent UI blocking.
- **Schema Versioning**: Use a `user_version` PRAGMA or a `migrations` table to handle schema updates without data loss.
- **Temporal Integrity**: Same as before, use Start-Date/End-Date. Never `UPDATE` an amount; always `CLOSE` and `INSERT`.