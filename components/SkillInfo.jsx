"use client";

import Image from "next/image";
import { byId } from "@/data";
import { effectText, raritiesOf } from "@/lib/skills";

const GOD_NAMES = {
  APH: "Aphrodite",
  ARE: "Ares",
  ART: "Artemis",
  ATH: "Athena",
  DEM: "Demeter",
  DIO: "Dionysus",
  HER: "Hermes",
  POS: "Poseidon",
  ZEU: "Zeus",
  CHA: "Chaos",
};

const KIND_LABEL = {
  boon: "Boon",
  duo: "Duo Boon",
  hammer: "Hammer Upgrade",
  aspect: "Weapon Aspect",
  keepsake: "Keepsake",
  companion: "Companion",
  ware: "Well of Charon",
  curse: "Chaos Curse",
};

/** A row of icon + name, used for requirement and exclusion lists. */
function ItemRow({ id }) {
  const item = byId(id);
  if (!item) return null;
  return (
    <li className="info-ref">
      <Image
        src={item.iconsrc}
        alt=""
        width={28}
        height={28}
        draggable={false}
      />
      <span>{item.title}</span>
    </li>
  );
}

export default function SkillInfo({ item, level, onClose }) {
  if (!item) {
    return (
      <aside className="skill-info">
        <h2 className="info-heading">Skill Info</h2>
        <p className="info-empty">Right-click a skill to see its details.</p>
      </aside>
    );
  }

  const kind = KIND_LABEL[item.kind] ?? "Item";
  const rarities = raritiesOf(item);

  return (
    <aside className="skill-info">
      <div className="info-top">
        <h2 className="info-heading">Skill Info</h2>
        {onClose && (
          <button
            type="button"
            className="info-close"
            onClick={onClose}
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      <div className={`info-card ${level?.rarity ?? ""}`}>
        <Image
          src={item.iconsrc}
          alt=""
          width={72}
          height={72}
          draggable={false}
        />
        <div className="info-card-text">
          <p className="info-name">{item.title}</p>
          <p className="info-effect">{effectText(item, level ?? {})}</p>
        </div>
      </div>

      <dl className="info-meta">
        <div>
          <dt>Type</dt>
          <dd>
            {kind}
            {item.legendary ? " (Legendary)" : ""}
          </dd>
        </div>

        {item.god && (
          <div>
            <dt>God</dt>
            <dd>{GOD_NAMES[item.god] ?? item.god}</dd>
          </div>
        )}

        {item.gods && (
          <div>
            <dt>Gods</dt>
            <dd>{item.gods.map((g) => GOD_NAMES[g] ?? g).join(" + ")}</dd>
          </div>
        )}

        {item.weapon && (
          <div>
            <dt>Weapon</dt>
            <dd className="cap">{item.weapon}</dd>
          </div>
        )}

        {item.slot && (
          <div>
            <dt>Slot</dt>
            <dd className="cap">{item.slot}</dd>
          </div>
        )}

        {item.affects && (
          <div>
            <dt>Affects</dt>
            <dd className="cap">{item.affects.replace("-", " ")}</dd>
          </div>
        )}

        {level?.rarity && rarities.length > 1 && (
          <div>
            <dt>Rarity</dt>
            <dd className="cap">
              {level.rarity} — {rarities.indexOf(level.rarity) + 1} of{" "}
              {rarities.length}
            </dd>
          </div>
        )}

        {level?.rank && (
          <div>
            <dt>Rank</dt>
            <dd>
              {level.rank} of {item.ranks.length}
            </dd>
          </div>
        )}

        {item.source && (
          <div>
            <dt>From</dt>
            <dd>{item.source}</dd>
          </div>
        )}

        {item.price && (
          <div>
            <dt>Price</dt>
            <dd>{item.price.text}</dd>
          </div>
        )}

        {item.duration && (
          <div>
            <dt>Duration</dt>
            <dd>
              {item.duration.text ??
                `${item.duration.min}–${item.duration.max} ${item.duration.unit}`}
            </dd>
          </div>
        )}
      </dl>

      {item.stats?.length > 0 && (
        <section className="info-block">
          <h3>Values</h3>
          <ul className="info-list">
            {item.stats.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {item.requires?.length > 0 && (
        <section className="info-block">
          <h3>Requires one from each</h3>
          {item.requires.map((r) => (
            <div key={r.god} className="info-group">
              <p className="info-group-label">{GOD_NAMES[r.god] ?? r.god}</p>
              <ul className="info-refs">
                {r.any.map((id) => (
                  <ItemRow key={id} id={id} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {item.prerequisites?.length > 0 && (
        <section className="info-block">
          <h3>Prerequisites</h3>
          {item.prerequisites.map((g, i) => (
            <div key={i} className="info-group">
              <p className="info-group-label">
                {g.count === 1 ? "One of" : `${g.count} of`}
              </p>
              <ul className="info-refs">
                {g.any.map((id) => (
                  <ItemRow key={id} id={id} />
                ))}
              </ul>
            </div>
          ))}
          {item.prerequisiteItems?.map((x) => (
            <p key={x} className="info-note">
              Or: {x}
            </p>
          ))}
        </section>
      )}

      {item.excludes?.length > 0 && (
        <section className="info-block">
          <h3>Cannot combine with</h3>
          <ul className="info-refs">
            {item.excludes.map((id) => (
              <ItemRow key={id} id={id} />
            ))}
          </ul>
        </section>
      )}

      {item.softConflicts?.length > 0 && (
        <section className="info-block">
          <h3>Interacts poorly with</h3>
          <ul className="info-refs">
            {item.softConflicts.map((id) => (
              <ItemRow key={id} id={id} />
            ))}
          </ul>
        </section>
      )}

      {item.aspectExclusive && (
        <p className="info-note accent">
          Aspect of {item.aspectExclusive} only.
        </p>
      )}

      {item.aspectIncompatible?.length > 0 && (
        <p className="info-note">
          Not available with Aspect of {item.aspectIncompatible.join(" or ")}.
        </p>
      )}

      {item.restriction && <p className="info-note warn">{item.restriction}</p>}

      {item.drops?.length > 0 && (
        <section className="info-block">
          <h3>Drops</h3>
          <ul className="info-list">
            {item.drops.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {item.notes?.length > 0 && (
        <section className="info-block">
          <h3>Additional Information</h3>
          <ul className="info-list">
            {item.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
