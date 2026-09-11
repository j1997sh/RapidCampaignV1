# Rapid Campaign V7

Backend migrations and Edge Functions have already been deployed to Rapid Campaign V2.

## One manual AI configuration step

Add an Edge Function secret in Supabase named:

`OPENAI_API_KEY`

Optionally set:

`RAPID_CAMPAIGN_AI_MODEL=gpt-5.6-luna`

No API key is stored in browser code or campaign records.

## V7 capabilities

- AI campaign drafting
- AI area localisation
- AI paid-social A/B/C copy drafts
- AI microsite restructuring
- AI history per campaign
- multi-format local creative ZIP generation
- square 1080x1080
- portrait 1080x1350
- landscape 1200x628
- expanded microsite block library: stats, quote, image, FAQ, video, CTA
- public rendering for the new blocks
- V2-compatible public visit and response capture RPCs
