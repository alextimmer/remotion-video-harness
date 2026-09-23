# Craft: legal checklist for food advertising

A generic checklist for any food or supplement client, written for the EU/DE
market. It is a craft aid, **not legal advice**: the client's legal owner
clears the final wording, and the client's `agents/rules/20-legal.md` — the
list of phrasings they have allowed and forbidden — always overrides this file.
Every claim that appears on screen must have a row there.

## The rule of thumb

Say what the product **is**, where it **comes from**, what it **costs**, how it
was **tested**. Do not say what it does **in the body**. "Same effect" as a
comparative statement is the strongest thing that has survived legal review;
anything stronger needs an authorised claim behind it.

## Checklist by claim type

| Claim type | Rule | Source of the rule |
|---|---|---|
| Health claim ("supports the immune system", "for your health") | Only if it is an **authorised** claim in the EU register, worded as authorised, and the product meets the conditions. Non-specific well-being claims only together with a specific authorised one. | Regulation (EC) 1924/2006 |
| Disease-risk claim ("reduces the risk of …") | Separate authorisation category; assume not available. | Regulation (EC) 1924/2006, Art. 14 |
| Medicinal claim ("heals", "prevents", "treats", "antibacterial", "against viruses/bacteria", "kills germs") | **Forbidden for a food.** It presents the food as a medicine. Includes indirect forms: images of pathogens being destroyed, medical iconography, "clinically proven". | Directive 2001/83/EC (presentation medicine), national medicines and health-advertising law |
| Nutrition claim ("high in …", "low sugar", "source of …") | Only the listed claims with their thresholds. | Regulation (EC) 1924/2006, Annex |
| Ingredient / property statement ("contains glucose oxidase", "active ingredient: MGO") | Allowed if true and verifiable; must not imply an effect in the body. | Regulation (EU) 1169/2011, Art. 7 |
| Origin ("regional", "from …", "short distances") | Allowed if true and verifiable for the actual product; the map or route shown must match. | Regulation (EU) 1169/2011, Art. 7; general misleading-advertising law |
| "Bio" / "organic" | Protected term: only with certification and the control code. | Regulation (EU) 2018/848 |
| "Natural", "pure", "traditional" | Careful: must not suggest a special property that all comparable foods have. | Regulation (EU) 1169/2011, Art. 7 |
| Test / laboratory / seal claims | Say what was tested, by whom, when, against what; the seal issuer is named; no implied health outcome from the test. | Misleading-advertising law; 1924/2006 if the test implies an effect |
| Comparative advertising (naming a competitor category or product) | Allowed if objective, verifiable, comparing like with like, on material features, and **not disparaging**. Category references ("imported premium products", "conventional alternatives") are safer than brand names. | Directive 2006/114/EC; national unfair-competition law |
| Price claims ("fair", "60 € vs 12 €") | Prices shown must be real and current for comparable quantities; "fair" is opinion, a price pair is a factual comparison. | Price-indication and unfair-competition law |
| Authenticity / counterfeit statements ("often faked") | About the **category**, with a factual basis the client can cite; never about a named competitor. | Comparative-advertising and defamation law |
| Superlatives ("best", "healthiest") | Avoid; "healthiest" is a health claim, "best" needs proof. | 1924/2006; unfair-competition law |

## Visual claims count too

A claim is not only text. A shield around a body, a thermometer with a
medical cross, germs shattering, a lab coat — all imply effect. Check the
stills for implied claims, not just the copy.

## Process

1. Before building: every intended statement gets a row in the client's
   `20-legal.md` (allowed / forbidden / wording). Unknown → ask the client's
   legal owner; do not draft from general knowledge alone.
2. While building: copy uses only allowed rows, verbatim where the wording
   was cleared.
3. Before delivery: the reviewer checks each still against `20-legal.md` and
   this table, text **and** imagery.
4. A cleared reel's claims are recorded in its `reels/<id>.md`; a wording
   change is a new review.

## Red flags — stop and ask

- "It's just the category, so the effect claim is fine."
- "Everyone in this market says antibacterial."
- "The lab result speaks for itself." (It speaks about the test, not about the body.)
- "We'll soften it to 'may support'." (Still a health claim.)
- "It's implied by the picture, not written." (Pictures are claims.)
