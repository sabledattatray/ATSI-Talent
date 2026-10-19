import { staticMetadata } from "@/lib/seo";
import { PublicBlog } from "@/components/admin/PublicBlog";
export const metadata = staticMetadata("/blog");
export default function Page() { return <PublicBlog />; }
