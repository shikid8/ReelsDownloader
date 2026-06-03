import axios, { AxiosInstance } from "axios";

export interface VideoInfo {
  downloadUrl: string;
  thumbnail: string;
  caption: string;
  filename: string;
}

// ─── Instagram Session Config ──────────────────────────────────────────────────
interface IGSession {
  sessionId: string;
  csrfToken: string;
  dsUserId: string;
  appId: string;
}

function getSession(): IGSession {
  const sessionId = process.env["IG_SESSION_ID"];
  const csrfToken = process.env["IG_CSRF_TOKEN"];
  const dsUserId  = process.env["IG_DS_USER_ID"];
  const appId     = process.env["IG_APP_ID"] ?? "936619743392459";

  if (!sessionId || !csrfToken || !dsUserId) {
    throw new Error(
      "Instagram session cookies belum dikonfigurasi. " +
      "Isi IG_SESSION_ID, IG_CSRF_TOKEN, dan IG_DS_USER_ID di Vercel Environment Variables."
    );
  }

  return {
    sessionId: decodeURIComponent(sessionId),
    csrfToken: decodeURIComponent(csrfToken),
    dsUserId:  decodeURIComponent(dsUserId),
    appId,
  };
}

// ─── Authenticated Axios Instance ─────────────────────────────────────────────
function createIGClient(session: IGSession): AxiosInstance {
  const cookieStr = [
    `sessionid=${session.sessionId}`,
    `csrftoken=${session.csrfToken}`,
    `ds_user_id=${session.dsUserId}`,
    `rur=PRN`,
  ].join("; ");

  return axios.create({
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "*/*",
      "X-IG-App-ID": session.appId,
      "X-CSRFToken": session.csrfToken,
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookieStr,
      Referer: "https://www.instagram.com/",
      Origin: "https://www.instagram.com",
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function extractShortcode(url: string): string {
  const match = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!match?.[2]) throw new Error("Format URL Instagram tidak valid.");
  return match[2];
}

function shortcodeToMediaId(shortcode: string): string {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = BigInt(0);
  for (const char of shortcode) {
    id = id * BigInt(64) + BigInt(CHARS.indexOf(char));
  }
  return id.toString();
}

// ─── Strategy 1: Instagram API v1 /media/{id}/info/ ───────────────────────────
interface MediaInfoResponse {
  items?: Array<{
    video_versions?: Array<{ url: string; width: number; height: number }>;
    image_versions2?: { candidates?: Array<{ url: string; width: number; height: number }> };
    carousel_media?: Array<{ video_versions?: Array<{ url: string; width: number; height: number }> }>;
    caption?: { text?: string } | null;
  }>;
}

async function fetchViaMediaInfo(
  shortcode: string,
  client: AxiosInstance
): Promise<{ videoUrl: string; thumbnail: string; caption: string }> {
  const mediaId = shortcodeToMediaId(shortcode);
  const res = await client.get<MediaInfoResponse>(
    `https://www.instagram.com/api/v1/media/${mediaId}/info/`
  );

  const item = res.data?.items?.[0];
  if (!item) throw new Error("Data media tidak ditemukan.");

  let videoUrl = "";
  if (item.video_versions?.length) {
    const sorted = [...item.video_versions].sort(
      (a, b) => b.width * b.height - a.width * a.height
    );
    videoUrl = sorted[0]!.url;
  } else if (item.carousel_media) {
    for (const m of item.carousel_media) {
      if (m.video_versions?.[0]?.url) { videoUrl = m.video_versions[0].url; break; }
    }
  }

  if (!videoUrl) throw new Error("URL video tidak ditemukan pada media ini.");

  const candidates = item.image_versions2?.candidates ?? [];
  const thumbnail =
    candidates.sort((a, b) => b.width * b.height - a.width * a.height)[0]?.url ?? "";
  const caption = item.caption?.text ?? "";

  return { videoUrl, thumbnail, caption };
}

// ─── Strategy 2: GraphQL query ────────────────────────────────────────────────
interface GraphQLResponse {
  data?: {
    xdt_shortcode_media?: {
      is_video?: boolean;
      video_url?: string;
      display_url?: string;
      thumbnail_src?: string;
      edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
      edge_sidecar_to_children?: {
        edges?: Array<{ node?: { is_video?: boolean; video_url?: string } }>;
      };
    };
  };
}

async function fetchViaGraphQL(
  shortcode: string,
  client: AxiosInstance
): Promise<{ videoUrl: string; thumbnail: string; caption: string }> {
  const variables = JSON.stringify({
    shortcode,
    __relay_internal__pv__PolarisFeedShareMenurelayprovider: false,
  });

  const res = await client.get<GraphQLResponse>(
    "https://www.instagram.com/graphql/query/",
    { params: { doc_id: "8845758582119845", variables } }
  );

  const media = res.data?.data?.xdt_shortcode_media;
  if (!media) throw new Error("Data tidak ditemukan via GraphQL.");

  let videoUrl = "";
  if (media.is_video && media.video_url) {
    videoUrl = media.video_url;
  } else {
    const edges = media.edge_sidecar_to_children?.edges ?? [];
    const videoNode = edges.find((e) => e.node?.is_video && e.node.video_url);
    if (videoNode?.node?.video_url) videoUrl = videoNode.node.video_url;
  }

  if (!videoUrl) throw new Error("URL video tidak ditemukan via GraphQL.");

  const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const thumbnail = media.thumbnail_src ?? "";

  return { videoUrl, thumbnail, caption };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function fetchInstagramVideo(url: string): Promise<VideoInfo> {
  const session = getSession();
  const shortcode = extractShortcode(url);
  const filename  = `reel_${shortcode}.mp4`;
  const client    = createIGClient(session);
  const errors: string[] = [];

  try {
    const { videoUrl, thumbnail, caption } = await fetchViaMediaInfo(shortcode, client);
    console.log(`[fetcher] ✅ MediaInfo succeeded for ${shortcode}`);
    return { downloadUrl: videoUrl, thumbnail, caption, filename };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`MediaInfo: ${msg}`);
    console.warn(`[fetcher] ⚠️ MediaInfo failed: ${msg}`);
  }

  try {
    const { videoUrl, thumbnail, caption } = await fetchViaGraphQL(shortcode, client);
    console.log(`[fetcher] ✅ GraphQL succeeded for ${shortcode}`);
    return { downloadUrl: videoUrl, thumbnail, caption, filename };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`GraphQL: ${msg}`);
    console.warn(`[fetcher] ⚠️ GraphQL failed: ${msg}`);
  }

  const isAuthError = errors.some(
    (m) => m.includes("401") || m.includes("403") || m.includes("login_required")
  );

  throw new Error(
    isAuthError
      ? "Autentikasi gagal. Pastikan cookies Instagram di Vercel Environment Variables masih valid."
      : "Tidak dapat mengunduh video. Pastikan link valid dan akun bersifat publik."
  );
}
