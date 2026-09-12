export function toPlain(doc: { toObject: () => unknown }): unknown {
  return JSON.parse(JSON.stringify(doc.toObject()));
}
