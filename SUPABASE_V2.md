# Rapid Campaign V2 backend

This frontend is pointed at the dedicated Supabase project `Rapid Campaign V2` (`lrgljkpgmsjeufyqqqfi`).

Implemented in the live project:

- Auth-ready organisation and membership model
- first-user bootstrap to `global_admin`
- campaigns and areas
- forms, responses/supporters and visits
- creative and audience records
- Meta campaign/ad set/ad/result tables
- Row Level Security
- `campaign-assets` Storage bucket
- core campaign compatibility RPCs
- public landing-page capture/attribution RPCs
- attribution/geography reporting RPCs

## First account

On a brand-new backend, the first person to use **Create my account** becomes the initial Rapid Campaign `global_admin` for the default organisation. Supabase may require email confirmation before the first login.

## Important

The old standalone frontend still contains some advanced screens that call legacy Campaign Platform RPC/Edge Function names. Those are being migrated progressively onto the clean V2 backend rather than copying the old database wholesale.
