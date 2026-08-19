import Link from "next/link";
import { notFound } from "next/navigation";
import { loadNotices } from "@/lib/notices";

export default async function NoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = loadNotices().find((n) => n.id === id);
  if (!notice) notFound();

  return (
    <article className="hero" style={{ maxWidth: 800 }}>
      <p className="muted mono">{notice.ref_no}</p>
      <h1>{notice.title}</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <dl className="dl">
          <dt>Office</dt>
          <dd>{notice.office_country}</dd>
          <dt>Process</dt>
          <dd>{notice.process}</dd>
          <dt>Posted</dt>
          <dd>{notice.posted_at}</dd>
          <dt>Deadline</dt>
          <dd className="mono">{notice.deadline}</dd>
          <dt>Source</dt>
          <dd>
            {notice.source_url ? (
              <a href={notice.source_url} target="_blank" rel="noreferrer">
                {notice.source_url}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </dl>
        {notice.description ? <p>{notice.description}</p> : null}
        <p className="muted">
          Citation is the source URL. Spinneret does not invent award amounts or
          eligibility. Staff contacts on the source page are dropped.
        </p>
        <p>
          <Link href="/">← Feed</Link>
        </p>
      </div>
    </article>
  );
}
