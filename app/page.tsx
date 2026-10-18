import CurbDayApp from "@/components/CurbDayApp";
import { DEMO_NOW, DEMO_PROFILES } from "@/lib/demo-profiles";
import { extractStreetAddress } from "@/lib/esd";
import { resolveSanDiegoAddress } from "@/lib/arcgis";
import type { CollectionProfile } from "@/lib/schedule";

interface HomePageProps {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const queryParam =
    (typeof searchParams.address === "string" ? searchParams.address : undefined) ||
    (typeof searchParams.q === "string" ? searchParams.q : undefined) ||
    (typeof searchParams.id === "string" ? searchParams.id : undefined);

  let initialProfile: CollectionProfile | undefined = undefined;

  if (queryParam) {
    const demoMatch = DEMO_PROFILES.find(
      (p) =>
        p.id.toLowerCase() === queryParam.toLowerCase() ||
        p.address.toLowerCase() === queryParam.toLowerCase() ||
        extractStreetAddress(p.address).toLowerCase() === queryParam.toLowerCase() ||
        p.streetLabel.toLowerCase() === queryParam.toLowerCase()
    );
    if (demoMatch) {
      initialProfile = demoMatch;
    } else {
      // Server-side resolve live address for bookmarked URLs to avoid client hydration flash
      try {
        const resolved = await resolveSanDiegoAddress(queryParam);
        if (resolved) {
          initialProfile = resolved;
        }
      } catch {
        // Fallback to client-side fetch if any network error during SSR
      }
    }
  }

  const initialNow =
    process.env.NODE_ENV === "test" ? DEMO_NOW : new Date();

  return (
    <CurbDayApp
      profiles={DEMO_PROFILES}
      now={initialNow}
      initialProfileId={initialProfile?.id}
      initialProfile={initialProfile}
    />
  );
}
