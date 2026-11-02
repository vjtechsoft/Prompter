import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ShareLinkRedirect({ params, searchParams }: Props) {
  const queryStr = searchParams
    ? '?' +
      new URLSearchParams(
        Object.entries(searchParams).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((item) => [k, item]) : v ? [[k, v]] : []
        )
      ).toString()
    : '';

  redirect(`/prompt/${params.slug}${queryStr}`);
}
