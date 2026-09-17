# RADIUS

**How far apart are your copies, really?**

Redundancy is a distance, and almost nobody knows theirs. Two copies can sit in different
buildings, on different continents, under different providers — and still share one event, one key,
or one jurisdiction that ends all of them at once.

**Live: https://radius-self-six.vercel.app**

---

## The sentence this turns on

> "Availability Zones in a Region are meaningfully distant from each other, up to 60 miles
> (~100 km)… but close enough to use synchronous replication."

That is AWS describing its own architecture. A hundred kilometres is a serious distance for a power
cut and no distance at all for a hurricane, a war, or a court order.

Multi-AZ is not multi-region. Multi-region is not multi-provider. Multi-provider is not
multi-jurisdiction. And none of those four is a defence against somebody holding your keys.

## Why now

AWS said this week that it could not restore some customer data from facilities that had been
physically destroyed — 400 comments followed, and the sharpest were geometric rather than political:

> "10s of miles is close enough that they are functionally in the same place in a military
> context… if you want protection against those risks you have to use multiple regions."

> "I would love if someone could tell me the name for this phenomena." — on feeling assured by a
> system you have not checked.

> "Once a malware infects a machine, any machine with shared credentials in the vicinity is
> infected within seconds." — *"Backups Aren't Simple"*, front page the same day.

## What it computes

Plot your copies and it returns the **smallest circle containing every one of them**. Any event at
least that wide reaches all of them at once, so the radius is a floor rather than a guess. It then
checks that circle against five hazards by scale — a rack, a metro, a cloud region, a hurricane, a
country — and against three things that have no radius at all: one provider, one credential set,
one jurisdiction.

The four presets are not strawmen. *Multi-AZ*, *the 3-2-1 you think you have*, *two regions one
account*, and *actually separated* are the arrangements described in the thread.

## Things it refuses to overstate

**Zones are not one point.** Two copies in one region used to come back as *0 m apart, destroyed by
a 200 m rack fire*, which is wrong in the dangerous direction. Where copies share a region but
differ by zone, the span falls back to AWS's own documented ~100 km and is labelled **inferred, not
measured** — and the hazard blamed becomes regional, which is the truth.

**Your laptop is not in Mumbai.** Copies you keep yourself have no fixed coordinates; you say where
you are. Hardcoding a city would have put every reader's laptop in somebody else's country, in a
tool whose entire output is a distance.

**Geography is not the only way to lose everything.** The verdict grades the worst finding, not the
widest circle. *Two regions, one account* reads **"No event reaches all of them. One password
does."** — because an earlier version coloured that green while carrying a critical finding, which
contradicted the whole argument.

**No fake precision.** Coincident points left floating-point residue around 1.2 × 10⁻¹² km.
Anything under a metre is snapped to zero; the underlying data is city-level and pretending
otherwise would be invention.

**City-level, by necessity.** No cloud provider publishes the coordinates of its buildings, so each
region sits at the city it documents. Precise enough to tell 40 km from 4,000 km.

```bash
npm install
npm test      # 56 assertions, including that the enclosing circle always encloses
npm run dev
```

Nothing leaves your browser — there is no server here.

MIT.
