---
description: Use when drawing or revising a fantasy-hero thumbnail portrait, including the colored-sketch prompt and what to refuse.
---

# Thumbnail portrait

Load this before calling `render-portrait`.

## When

A person asks for a new hero thumbnail, a revision of one, or a portrait from a short brief. Skip it for chat that is not a portrait.

## Prompt shape

Call `render-portrait` with:

- `name`: the hero's name
- `epithet`: a few words, the second half of the caption
- `brief`: one person, head and shoulders, face large enough to read as a thumbnail, simple background, costume and light only

The tool sends that brief to Cursor's `generateImage` tool with the medium locked: colored pencil and ink sketch, square bust, no lettering. Do not ask for paint, oil, pixels, or a camera.

## Refuse

Do not call the tool. Say what you will not draw, in one sentence.

- Text, letters, captions, or watermarks inside the image
- A full-body figure or a wide scene
- A photoreal or photographic portrait
- Gore, wounds shown for shock, or graphic injury
