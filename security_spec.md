# Security Specification for Oneiric

## Data Invariants
- A dream entry must belong to a specific user and cannot be read or modified by others.
- A chat message must belong to a specific dream and inherit its ownership.
- Timestamps must be validated using `request.time`.
- User ID in the document must match the authenticated `request.auth.uid`.

## The "Dirty Dozen" Payloads (Deny List)
1. Creating a dream with a different `userId`.
2. Updating a dream's `userId`.
3. Reading another user's dream by ID.
4. Listing dreams without filtering by `userId`.
5. Injecting a massive string into `transcription`.
6. Creating a dream with a future `createdAt`.
7. Updating the `interpretation` field with invalid structure.
8. Deleting a dream owned by another user.
9. Posting a message to a dream the user doesn't own.
10. Spoofing the `role` in a `ChatMessage` (e.g., user trying to be 'model').
11. Bypassing size limits on symbols.
12. Attempting to update `createdAt` (immutable).

## Test Runner (Logic Simulation)
- Test: `create` dream where `incoming().userId == request.auth.uid` -> ALLOW
- Test: `update` dream where `incoming().userId != existing().userId` -> DENY
- Test: `list` dreams where `resource.data.userId == request.auth.uid` -> ALLOW
