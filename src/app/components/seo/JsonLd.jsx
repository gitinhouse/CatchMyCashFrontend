// schema.org structured data for the page it is rendered on. `data` is one
// object or a list of them. "<" is escaped so no string in the data can close
// the script element early.
export default function JsonLd({ data }) {
  const items = Array.isArray(data) ? data : [data];
  return items.map((item, i) => (
    <script
      key={i}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(item).replace(/</g, '\\u003c'),
      }}
    />
  ));
}
