/* TooGoodTech — data layer.
   Production file lives at ./channel-data.json (refreshed outside the browser;
   no API key is ever shipped to the client). FALLBACK below mirrors the
   snapshot dated 2026-08-16T22:05:37.2429729Z and is used only if that fetch fails. */

export const FALLBACK = {
  "schemaVersion": 1,
  "source": "YouTube public pages",
  "channelId": "UCHPes4lqVxxQ0KG8mNfGcAw",
  "handle": "@toogoodtech",
  "fetchedAt": "2026-08-16T22:05:37.2429729Z",
  "public": {
    "title": "Too Good Tech",
    "subscriberCount": 332,
    "viewCount": 98795,
    "videoCount": 93
  },
  "creatorAnalytics": {
    "source": "YouTube Studio",
    "snapshotLabel": "Creator-provided Studio snapshot",
    "uniqueViewersLast28Days": 9100,
    "age": {
      "13-17": 6.2,
      "18-24": 8.7,
      "25-34": 36.1,
      "35-44": 30.3,
      "45-54": 11,
      "55-64": 3.9,
      "65+": 4
    },
    "gender": {
      "male": 82.3,
      "female": 17.7
    },
    "device": {
      "tv": 39.4,
      "desktop": 34.9,
      "mobile": 20.6,
      "tablet": 5
    },
    "geographyLast28Days": {
      "United States": 40.4,
      "United Kingdom": 8.5,
      "Canada": 3.9,
      "Australia": 2.4,
      "India": 2.2
    },
    "geographyMetric": "Views",
    "geographyWindow": "Last 28 days",
    "geographyContentFilter": "All",
    "geographyCapturedAt": "2026-08-12",
    "audienceType": {
      "new": 98.8,
      "casual": 1.1
    }
  },
  "brandProof": {
    "paidPartnerships": 5,
    "paidPartnerNames": [
      "FIFINE",
      "Hume Health",
      "Stellar Data Recovery",
      "NUBWO",
      "Arboleaf"
    ],
    "productCollaborations": 3,
    "productCollaborationNames": [
      "Keychron",
      "Neewer",
      "Sabrent"
    ],
    "featuredCampaign": {
      "brand": "Hume Health",
      "videoId": "h-HXN-outqk",
      "title": "Hume Band 2.0 Review — A Huge Upgrade, But Not Perfect",
      "publishedAt": "2026-08-06T22:29:57Z",
      "views": 3913,
      "likes": 50,
      "comments": 40
    }
  },
  "recentVideos": [
    {
      "id": "iG0tiBATHlQ",
      "title": "The Walmart Keyboard That Gamers Are Sleeping On | K2 HE",
      "publishedAt": "2026-08-16T21:11:00Z",
      "views": 9,
      "likes": 3,
      "comments": 0,
      "duration": "PT8M42S"
    },
    {
      "id": "t6nAgEWURKE",
      "title": "This $22 Gaming Headset Is Shockingly Good… But There’s a Catch",
      "publishedAt": "2026-08-10T17:43:13Z",
      "views": 546,
      "likes": 8,
      "comments": 19,
      "duration": "PT8M40S"
    },
    {
      "id": "h-HXN-outqk",
      "title": "Hume Band 2.0 Review — A Huge Upgrade, But Not Perfect",
      "publishedAt": "2026-08-06T22:29:57Z",
      "views": 3913,
      "likes": 50,
      "comments": 40,
      "duration": "PT11M47S"
    },
    {
      "id": "_uQBnNE71Ds",
      "title": "I Turned My Laptop Into a Triple Monitor Setup... Here's What Happened",
      "publishedAt": "2026-07-14T17:29:43Z",
      "views": 381,
      "likes": 13,
      "comments": 14,
      "duration": "PT11M"
    },
    {
      "id": "vyO3QzSO4Gc",
      "title": "I Tested the Arboleaf Full Body Scale — Worth It?",
      "publishedAt": "2026-06-30T14:48:51Z",
      "views": 860,
      "likes": 15,
      "comments": 14,
      "duration": "PT10M54S"
    },
    {
      "id": "W-88B2ch21g",
      "title": "The Best Streaming Setup for Beginners | WORTH IT?",
      "publishedAt": "2026-06-16T21:31:38Z",
      "views": 1300,
      "likes": 25,
      "comments": 34,
      "duration": "PT11M21S"
    }
  ]
};

export const CHANNEL_DATA_URL = './channel-data.json';

export async function loadChannelData(url = CHANNEL_DATA_URL) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('channel-data.json unavailable (' + res.status + ')');
    const c = await res.json();
    if (!c?.public?.viewCount || !c?.fetchedAt) throw new Error('channel-data.json malformed');
    return { data: c, live: true };
  } catch (err) {
    console.info('TooGoodTech: using embedded snapshot —', err.message);
    return { data: FALLBACK, live: false };
  }
}

export function fmt(n) {
  n = Math.round(Number(n) || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
export function fullNum(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); }

export function parseDuration(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return '';
  const h = +m[1] || 0, min = +m[2] || 0, s = +m[3] || 0;
  return h ? h + ':' + String(min).padStart(2, '0') + ':' + String(s).padStart(2, '0')
           : min + ':' + String(s).padStart(2, '0');
}

export function ago(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 3600) return Math.max(1, Math.floor(d / 60)) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  if (d < 2592000) return Math.floor(d / 86400) + 'd ago';
  if (d < 31536000) return Math.floor(d / 2592000) + 'mo ago';
  return Math.floor(d / 31536000) + 'y ago';
}

export function longDate(iso) {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' }).format(new Date(iso));
  } catch { return ''; }
}

export function isStale(iso, days = 21) {
  return (Date.now() - new Date(iso).getTime()) / 86400000 > days;
}

export const watchUrl = (id) => 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
export const thumbUrl = (id, q = 'hqdefault') => 'https://i.ytimg.com/vi/' + id + '/' + q + '.jpg';

/* Category labels are editorial, derived from each video's own subject. */
const CATEGORY = {
  iG0tiBATHlQ: 'Keyboards',
  t6nAgEWURKE: 'Audio',
  'h-HXN-outqk': 'Wearables',
  _uQBnNE71Ds: 'Desk Setup',
  vyO3QzSO4Gc: 'Smart Home',
  'W-88B2ch21g': 'Creator Gear'
};
export const categoryOf = (id) => CATEGORY[id] || 'Review';

/* Brand relationships, exactly as recorded in channel-data.json brandProof. */
export const BRANDS = [
  { name: 'FIFINE', category: 'Microphones & audio', url: 'https://fifinemicrophone.com', kind: 'Paid' },
  { name: 'Hume Health', category: 'Health & wellness tech', url: 'https://humehealth.com', kind: 'Paid' },
  { name: 'Stellar Data Recovery', category: 'Software', url: 'https://stellarinfo.com', kind: 'Paid' },
  { name: 'NUBWO', category: 'Gaming audio', url: 'https://www.nubwo.com', kind: 'Paid' },
  { name: 'Arboleaf', category: 'Smart wellness', url: 'https://www.arboleaf.com', kind: 'Paid' },
  { name: 'Keychron', category: 'Mechanical keyboards', url: 'https://keychron.com', kind: 'Collab' },
  { name: 'Neewer', category: 'Lighting & photography', url: 'https://neewer.com', kind: 'Collab' },
  { name: 'Sabrent', category: 'Storage & accessories', url: 'https://sabrent.com', kind: 'Collab' }
];

export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjglwkgw';

/* ── DOM hydration ───────────────────────────────────────────────
   Pages print the snapshot values as real markup so they paint instantly
   and survive a missing JSON file; these helpers then reconcile that markup
   with ./channel-data.json when it loads. */

export function hydrateNumbers(root, data) {
  const map = {
    subs: data.public.subscriberCount,
    views: data.public.viewCount,
    videos: data.public.videoCount,
    unique: data.creatorAnalytics?.uniqueViewersLast28Days,
    paid: data.brandProof?.paidPartnerships,
    collabs: data.brandProof?.productCollaborations
  };
  root.querySelectorAll('[data-num]').forEach((el) => {
    const v = map[el.dataset.num];
    if (v == null) return;
    const style = el.dataset.numStyle || 'compact';
    if (el.hasAttribute('data-count-to')) el.dataset.countTo = String(v);
    el.textContent = style === 'full' ? fullNum(v) : fmt(v);
  });
  const label = longDate(data.fetchedAt);
  root.querySelectorAll('[data-snapshot-date]').forEach((el) => { el.textContent = label; });
  if (isStale(data.fetchedAt)) {
    root.querySelectorAll('[data-freshness]').forEach((el) => {
      el.textContent = 'Snapshot due for refresh';
      el.style.color = '#f0b429';
    });
  }
}

export function hydrateVideoSlots(root, videos) {
  root.querySelectorAll('[data-video-slot]').forEach((card) => {
    const v = videos[Number(card.dataset.videoSlot)];
    if (card.dataset.tgtDisplay === undefined) card.dataset.tgtDisplay = card.style.display || '';
    if (!v) { card.style.display = 'none'; card.setAttribute('aria-hidden', 'true'); return; }
    card.style.display = card.dataset.tgtDisplay;
    card.removeAttribute('aria-hidden');
    if (card.tagName === 'A') card.href = watchUrl(v.id);
    const q = (sel) => card.querySelector(sel);
    const thumb = q('[data-v-thumb]');
    if (thumb) { thumb.src = thumbUrl(v.id, thumb.dataset.vThumb || 'hqdefault'); thumb.alt = 'Thumbnail — ' + v.title; }
    const title = q('[data-v-title]'); if (title) title.textContent = v.title;
    const cat = q('[data-v-cat]'); if (cat) cat.textContent = categoryOf(v.id);
    const views = q('[data-v-views]'); if (views) views.textContent = v.views > 0 ? fmt(v.views) + ' views' : 'Just published';
    const when = q('[data-v-ago]'); if (when) when.textContent = ago(v.publishedAt);
    const dur = q('[data-v-dur]'); if (dur) dur.textContent = parseDuration(v.duration);
  });
}

export function hydrateCampaign(root, data) {
  const c = data.brandProof?.featuredCampaign;
  if (!c) return;
  root.querySelectorAll('[data-campaign-link]').forEach((a) => { a.href = watchUrl(c.videoId); });
  root.querySelectorAll('[data-campaign-title]').forEach((el) => { el.textContent = c.title; });
  root.querySelectorAll('[data-campaign-views]').forEach((el) => { el.textContent = fmt(c.views); });
  root.querySelectorAll('[data-campaign-engagements]').forEach((el) => {
    el.textContent = fmt((+c.likes || 0) + (+c.comments || 0));
  });
}

export async function hydratePage(root) {
  if (!root) return null;
  const { data } = await loadChannelData();
  hydrateNumbers(root, data);
  hydrateVideoSlots(root, data.recentVideos || []);
  hydrateCampaign(root, data);
  return data;
}
