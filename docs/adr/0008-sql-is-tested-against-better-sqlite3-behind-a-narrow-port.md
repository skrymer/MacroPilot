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

## Amended: transactions, and a connection whose calls run in turn

*28 November 2026, on #129, when the review store first wrote two statements as one.*

The port is no longer exactly a subset of expo-sqlite. It is two interfaces: **`SqlStatements`**, the three calls expo-sqlite's `SQLiteDatabase` answers as it stands (`execAsync`, `runAsync`, `getAllAsync`), and **`SqlDatabase`**, which adds `withTransactionAsync(task: (tx) => Promise<void>)`. The stores take `SqlDatabase`. `SerialDatabase` makes one from any `SqlStatements`: `app/_layout.tsx` wraps the phone's connection in it, and `BetterSqliteDatabase` is it wrapped round better-sqlite3, so the adapters' tests run the same queue and transactions the phone does.

**Why our own transaction, not expo-sqlite's.** The stores share one connection, and SQLite holds one transaction per connection: a call made while one is open joins it, whoever made it. expo-sqlite's `withTransactionAsync` is `BEGIN`, the task and `COMMIT` on that connection, and its documentation says other async queries "will be included in the transaction": a screen's write landing between the two statements is rolled back with them, and two saves that overlap fail with *cannot start a transaction within a transaction* (both reproduced against better-sqlite3 before this change). Its `withExclusiveTransactionAsync` opens a new connection for each call instead: foreign keys are off on it, competing writes fail with *database is locked* rather than wait, and better-sqlite3 on `:memory:` cannot open a second connection to mirror it. `SerialDatabase` runs every call on the one connection in turn; a transaction holds the turn from `BEGIN` to `COMMIT`, and a `ROLLBACK` that fails is swallowed, so the caller hears the task's fault. Usually it fails because SQLite has already rolled back (after a full disk or an I/O error). One that failed with the transaction still open (SQLITE_BUSY, or an I/O error while the journal is held) would leave the connection inside it, and every later call would join it. It has not been shown on either engine; [#152](https://github.com/skrymer/MacroPilot/issues/152) holds it.

**Consequences.** A task calls the `tx` it is given, never the database, which would wait for the turn the task holds. Nothing slow goes in a task: every screen's reads wait for it. Each transaction is tested for commit, rollback when either statement fails, and overlapping calls (rn-dev, *Transactions*); `SerialDatabase.test.ts` holds the queue's own guarantees.
