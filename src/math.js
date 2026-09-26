// Finanzmathematik und automatisch erzeugte Rechen-Posts.
// Alle Zahlen in den Posts werden hier berechnet – nichts ist von Hand eingetippt.

export const euro = (x) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(x);

export const percent = (r) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(r * 100) + '\u00a0%';

/** Rundet große Beträge auf „schöne“ Werte, damit Posts nicht falsche Präzision vortäuschen. */
export function roundNice(x) {
  const abs = Math.abs(x);
  const step = abs >= 100000 ? 1000 : abs >= 10000 ? 100 : abs >= 1000 ? 10 : 1;
  return Math.round(x / step) * step;
}

/** Endwert eines Sparplans: Einzahlung zu Monatsbeginn, Jahresrendite effektiv. */
export function futureValue({ start = 0, monthly, years, annualReturn }) {
  if (![start, monthly, years, annualReturn].every(Number.isFinite)) throw new Error('Ungültige Eingabe');
  if (start < 0 || monthly < 0 || years < 0 || annualReturn <= -1) throw new Error('Ungültige Eingabe');
  const rm = Math.pow(1 + annualReturn, 1 / 12) - 1;
  let balance = start;
  for (let m = 0; m < Math.round(years * 12); m++) {
    balance = (balance + monthly) * (1 + rm);
  }
  return balance;
}

export function doublingYears(annualReturn) {
  if (!(annualReturn > 0)) throw new Error('Rendite muss positiv sein');
  return Math.log(2) / Math.log(1 + annualReturn);
}

export function realValue(amount, inflation, years) {
  return amount / Math.pow(1 + inflation, years);
}

const HINT = 'Beispielrechnung – Renditen schwanken und sind nicht garantiert.';

function sparplanPost(monthly, years, r) {
  const fv = futureValue({ monthly, years, annualReturn: r });
  const paid = monthly * 12 * years;
  return {
    id: `rechnung-sparplan-${monthly}-${years}-${r}`,
    type: 'rechnung',
    title: `${euro(monthly)} im Monat – was wird daraus?`,
    body: `Bei ${percent(r)} Rendite pro Jahr hast du nach ${years} Jahren ca. *${euro(roundNice(fv))}*.\nEingezahlt hast du nur ${euro(paid)}. Der Rest sind Zinsen und Zinseszinsen.`,
    note: HINT,
  };
}

function doublingPost(r) {
  const rule = 72 / (r * 100);
  const exact = doublingYears(r);
  const fmt = (x) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(x);
  return {
    id: `rechnung-72er-${r}`,
    type: 'rechnung',
    title: `Die 72er-Regel bei ${percent(r)}`,
    body: `72 ÷ ${fmt(r * 100)} = *${fmt(rule)} Jahre*.\nSo lange dauert es ungefähr, bis sich dein Geld bei ${percent(r)} Zinsen pro Jahr verdoppelt. Exakt gerechnet: ${fmt(exact)} Jahre.`,
    note: HINT,
  };
}

function inflationPost(amount, i, years) {
  const real = realValue(amount, i, years);
  return {
    id: `rechnung-inflation-${amount}-${i}-${years}`,
    type: 'rechnung',
    title: `Was sind ${euro(amount)} in ${years} Jahren noch wert?`,
    body: `Bei ${percent(i)} Inflation pro Jahr kaufst du dir in ${years} Jahren mit ${euro(amount)} nur noch so viel wie heute mit *${euro(roundNice(real))}*.\nGeld, das nur rumliegt, verliert jedes Jahr an Wert.`,
    note: 'Beispielrechnung mit konstanter Inflation.',
  };
}

function costPost(monthly, years, r, cost) {
  const low = roundNice(futureValue({ monthly, years, annualReturn: r }));
  const high = roundNice(futureValue({ monthly, years, annualReturn: r - cost }));
  return {
    id: `rechnung-kosten-${monthly}-${years}-${r}-${cost}`,
    type: 'rechnung',
    title: `Wie teuer sind ${percent(cost)} Kosten pro Jahr?`,
    body: `${euro(monthly)} im Monat, ${years} Jahre, ${percent(r)} Rendite:\nOhne Kosten: ca. ${euro(low)}\nMit ${percent(cost)} Kosten: ca. ${euro(high)}\nDas sind ca. *${euro(low - high)}* weniger – nur durch Gebühren.`,
    note: HINT,
  };
}

function dailyPost(perDay, years, r) {
  const monthly = (perDay * 365) / 12;
  const fv = futureValue({ monthly, years, annualReturn: r });
  return {
    id: `rechnung-taeglich-${perDay}-${years}-${r}`,
    type: 'rechnung',
    title: `${euro(perDay)} am Tag sind mehr, als du denkst`,
    body: `${euro(perDay)} täglich sind ${euro(perDay * 365)} im Jahr.\nAngelegt mit ${percent(r)} Rendite werden daraus in ${years} Jahren ca. *${euro(roundNice(fv))}*.`,
    note: HINT,
  };
}

function earlyStartPost(monthly, r, startA, startB, endAge) {
  // Differenz aus den gerundeten Werten, damit die Zahlen im Bild zusammenpassen.
  const a = roundNice(futureValue({ monthly, years: endAge - startA, annualReturn: r }));
  const b = roundNice(futureValue({ monthly, years: endAge - startB, annualReturn: r }));
  return {
    id: `rechnung-frueh-${monthly}-${r}-${startA}-${startB}-${endAge}`,
    type: 'rechnung',
    title: `Mit ${startA} oder mit ${startB} anfangen?`,
    body: `Jeweils ${euro(monthly)} im Monat bis zum Alter von ${endAge} bei ${percent(r)} Rendite:\nStart mit ${startA}: ca. ${euro(a)}\nStart mit ${startB}: ca. ${euro(b)}\n*${startB - startA} Jahre* früher anfangen macht ca. ${euro(a - b)} Unterschied.`,
    note: HINT,
  };
}

/** Feste, reproduzierbare Liste an Rechen-Posts. */
export function generateMathPosts() {
  return [
    sparplanPost(50, 10, 0.05),
    doublingPost(0.06),
    inflationPost(1000, 0.02, 10),
    dailyPost(3, 30, 0.05),
    earlyStartPost(100, 0.05, 20, 30, 67),
    costPost(200, 30, 0.06, 0.01),
    sparplanPost(100, 20, 0.05),
    doublingPost(0.03),
    inflationPost(10000, 0.03, 20),
    dailyPost(5, 20, 0.05),
    sparplanPost(25, 40, 0.05),
    earlyStartPost(50, 0.05, 18, 25, 67),
    costPost(100, 40, 0.05, 0.015),
    doublingPost(0.08),
    sparplanPost(200, 15, 0.04),
    inflationPost(500, 0.025, 30),
    dailyPost(10, 10, 0.04),
    sparplanPost(150, 30, 0.06),
    doublingPost(0.02),
    earlyStartPost(200, 0.06, 25, 35, 67),
  ];
}
