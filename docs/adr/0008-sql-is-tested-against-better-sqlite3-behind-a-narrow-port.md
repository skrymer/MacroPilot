# The stores' SQL is tested against better-sqlite3, behind a narrow port

A table store's bugs live in the SQL: a `NULL` that comes back as `0`, parameters bound out of order, a join that drops a Food with no Entry. A stub that records calls and returns canned rows passes all of those. And expo-sqlite cannot run in Jest: it is a native module with no Node counterpart.

## The decision

**A store takes a narrow `SqlDatabase` by constructor**: the subset of expo-sqlite's async `SQLiteDatabase` it calls, and nothing else. The real one satisfies it as it stands, and `app/_layout.tsx` hands it in. In Jest a small wrapper over **`better-sqlite3`**, opened on `:memory:` per test, satisfies the same interface, so the adapter's tests run the real schema and queries against a real engine. `better-sqlite3` is a dev dependency and never reaches the bundle.

**Above the adapter, screen tests use the in-memory fake of the store's port.** Only the adapter's own test touches SQL.

This is [`0001`](./0001-a-unit-owes-its-own-test-when-it-owns-something.md)'s storage boundary drawn one layer lower, for the code that owns the translation.

**The schema is not migrated in development.** A changed one means deleting the app and reinstalling it, since an install over the app keeps its database. This ends the first time a build holds data someone would miss, and that day is its own decision.

## Alternatives rejected

- **`node:sqlite`**: needs no dependency, but is marked experimental, and a test boundary should not rest on an API that may change under a Node upgrade.
- **`expo-sqlite-mock`**: replaces the module globally, where every port here is handed in by constructor.
- **A hand-written stub**: no SQL runs, so a wrong query is found on the phone.

## Consequences

- The engine is not the phone's. A query reaching for a recent SQLite feature is checked against the version expo-sqlite bundles.
- The adapter's test owns the round trip: an unknown stays unknown, and a zero stays zero.
- The interface grows only when an adapter calls a method it lacks.
