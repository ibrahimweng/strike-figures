# Eval prompts

Twelve requests that cover the brand's main risks. Paste each one as written, in a fresh chat, with the Strike files installed. Under each prompt is what a passing answer must do. Every answer also has to pass `node scripts/check.mjs` with no errors.

## 1. Landing page hero

```text
Build the hero section of Strike's landing page as one HTML file: a headline, one line under it and a waitlist button.
```

A passing answer:
- uses the dark ground #0C0C0C, ink text and Geist (Arial fallback);
- keeps the headline to 2 lines or fewer (about 3–8 words), in Geist Medium with tight tracking;
- has one primary button: green #10B981 with ground text, 8 px radius, 40 px tall;
- places the 3D green lockup from the files in a corner, not redrawn and not centred;
- uses only listed facts (168 hours a week, daily expiry at 20:00 ET), with no invented numbers;
- puts the risk line in the footer.

## 2. Fees table

```text
Make a fees table for the Strike docs showing taker, maker and settlement fees.
```

A passing answer:
- states takers 40 bps of premium, makers 10 bps, and 50 bps of intrinsic for the winning side at settlement;
- says fees are zero during the closed beta and that the rates can change;
- adds no worked examples with made-up amounts (or marks them `[number]`);
- right-aligns numbers in tabular figures, with a Label-style header in ink-3 and hairline rows;
- uses USDC if it names a currency.

## 3. Trading UI component

```text
Write a React component for an options order ticket: buy or sell, strike, expiry, size, limit price and a submit button.
```

A passing answer:
- is dark: #0C0C0C modules on a #2E2E2E frame, raised controls #161616, a 1 px line at 10–18%, 8 px radius on inputs, 40 px controls;
- shows buy and bid in profit #3FD4AB and sell and ask in loss #EE5E74, each with a sign or an arrow, and uses red for nothing else;
- sets prices in tabular figures and shows the expiry time zone (20:00 ET);
- has one primary button, a green focus ring, and hover, disabled, loading and error states;
- uses Geist, not Geist Mono, for prices.

## 4. X thread with cards

```text
Write a 5-post X thread announcing Strike's daily expiries, and design a card for each post.
```

A passing answer:
- gives one idea per post, numbered "1/5" at the end, with no hashtags (or one for an event) and no emoji;
- keeps each card headline to 2 lines and 8 words, with one phrase in green;
- puts the lockup in a bottom corner of each card, with the post number opposite;
- states the daily expiry at 20:00 ET and invents nothing;
- puts the risk line and strikelabs.app/risk in the last post;
- uses no exclamation marks.

## 5. Poster

```text
Design an A3 poster for Strike that says: Options on every market, every hour.
```

A passing answer:
- picks one ground: black, light grey or the mint-to-green gradient;
- sets the headline in Geist, at most 2 lines, tracked −3%, on the 50 px grid;
- puts the lockup in a corner, in the version for that ground (3D green on black, 3D black on grey, flat black on mint, flat white on green);
- shows one illustration or one number, not both; a big number is in Geist Pixel Circle;
- writes "Strike" in any copy, never STRIKE in capitals.

## 6. Slide

```text
Make a 16:9 slide that makes the point: listed options are closed 81% of the week.
```

A passing answer:
- is 1920 × 1080, dark, with one idea;
- has a title that states the claim, with the evidence under it (about 32.5 open hours against 168);
- invents no other figures and gives no source it wasn't handed;
- places the lockup small in a corner.

## 7. Launch email

```text
Write and lay out the email that announces Strike's closed beta.
```

A passing answer:
- is 600 px wide and dark, in Geist with an Arial fallback;
- has a subject line that states the fact and one primary button;
- says closed beta, invite required, with no hype, no exclamation marks and no promises;
- puts "Options involve risk. Closed beta, invite required." and strikelabs.app/risk in the footer;
- doesn't target US persons.

## 8. Docs page header

```text
Create the page header for the Custody page of the Strike docs.
```

A passing answer:
- is dark unless asked, with the lockup in the header and a short H1;
- pairs "No key at Strike can move your money." with what is still trusted: settlement prints, prices on market orders, liquidation prices, and the attesters, all run by Strike today;
- makes no custody claim beyond the listed facts.

## 9. Logo on a photo

```text
Put the Strike logo on a photo of a trader at a desk at night, with screens and city lights behind. Give me the HTML.
```

A passing answer:
- uses a white logo: flat white on a busy image like this one (3D white only on soft images);
- uses the file as it is (`strike-lockup-flat-white.svg`): no recolouring, outline, shadow or glow;
- places it in a corner with clear space, at least 20 px tall;
- explains the choice in one line at most.

## 10. A request that breaks the rules

```text
Make the waitlist banner pop: a bright green background with big white text.
```

A passing answer:
- says in one line that white on green fails contrast (2.4:1) and that green isn't a large area in UI;
- offers ground text on green (7.7:1), or a dark banner with one green button;
- follows the rule unless the user insists;
- produces no white text on green (the checker reports it as an error).

## 11. USD or USDC

```text
Add a line to the deposit screen saying deposits and settlement are in USD.
```

A passing answer:
- asks whether USD or USDC is meant, or uses USDC and says so in one line;
- never writes "USD" alone without confirming.

## 12. Sub-brand

```text
Make a logo for Strike Vaults.
```

A passing answer:
- notes that Strike has no official sub-brands, then builds it because it was asked;
- builds it from the mark and the STRIKE wordmark files, then "Vaults" in Geist Medium on STRIKE's baseline, with the brand-book proportions (or `scripts/lockup.mjs`);
- picks the version for the ground;
- never redraws the mark, sets STRIKE in a font or invents a new symbol.
