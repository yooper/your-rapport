import * as React from "react";
import Box from "@mui/material/Box";
import Badge from '@mui/material/Badge';
import { useEffect, useMemo, useRef, useState } from 'react';
import MUIDataTable, {
  type MUIDataTableColumnDef,
  type MUIDataTableOptions,
} from "mui-datatables";
import {
  Alert,
  Autocomplete,
  Stack,
  TextField,
  Typography,
  Link, Tooltip, FormGroup, InputAdornment,
} from '@mui/material';

import { hideLoader, showLoader } from "../../utilities/loaders";
import * as cheerio from 'cheerio';
import { ExtractContext, IExtractedData, MetaTagRecord, PageInfo, PreExistingFilter } from '../../types';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DiscoveryPlugin } from '../../models/schemas/DiscoveryPlugin';
import DiscoveryPluginDialog from '../dialogs/DiscoveryPluginDialog';
import { getIntegratedPlugins } from '../../services/discovery_plugin_services';


function getBaseUrl(url: string) {
  const u: URL = new URL(url);
  return u.origin;
}

function summarizeExtractedData(items: IExtractedData[]): IExtractedData[] {
  const map = items.reduce<Map<string, IExtractedData>>((acc, item) => {
    if (!item?.value) return acc;

    const key = `${item.value}`;
    const existing = acc.get(key);

    if (existing) {
      existing.count += item.count > 0 ? item.count : 1; // supports pre-counted inputs
    } else {
      acc.set(key, {
        pluginType: item.pluginType ?? "url",
        value: item.value,
        count: item.count > 0 ? item.count : 1,
      });
    }

    return acc;
  }, new Map());

  // optional: sort by frequency desc, then value
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value)
  );
}


const isJunkUrl = (v: string) => {
  const s = v.trim().toLowerCase();
  return (
    !s ||
    s === "#" ||
    s.startsWith("javascript:") ||
    s.startsWith("mailto:") ||
    s.startsWith("tel:") ||
    s.startsWith("data:")
  );
};

const toAbsUrl = (raw: string, baseUrl: string) => {
  const v = raw.trim();
  if(!v.startsWith('http')){
    return baseUrl + v;
  }

  return v;
};



/** ---------- generic extraction helpers ---------- */

function extractAttrUrls(
  $: cheerio.CheerioAPI,
  selector: string,
  attr: string,
  baseUrl: string
): IExtractedData[] {
  const out: IExtractedData[] = [];
  $(selector).each((_i, el) => {
    const raw = $(el).attr(attr);
    if (!raw) return;
    if (isJunkUrl(raw)) return;
    out.push({ pluginType: "url", value: toAbsUrl(raw, baseUrl), count: 1 });
  });
  return out;
}

function extractMetaContent(
  $: cheerio.CheerioAPI,
  metaNameOrProp: string[],
  baseUrl: string
): IExtractedData[] {
  const out: IExtractedData[] = [];
  for (const key of metaNameOrProp) {
    const sel = `meta[name="${key}"], meta[property="${key}"]`;
    $(sel).each((_i, el) => {
      const raw = $(el).attr("content");
      if (!raw) return;
      const v = raw.trim();
      if (!v) return;

      // If the content looks like a URL, normalize it
      if (/^(https?:\/\/|\/\/|\/|#)/i.test(v)) {
        if (!isJunkUrl(v)) out.push({ pluginType: "url", value: toAbsUrl(v, baseUrl), count: 1 });
      } else {
        out.push({ pluginType: "username", value: v, count: 1 });
      }
    });
  }
  return out;
}

function extractTextMatches(
  html: string,
  re: RegExp,
  pluginType: IExtractedData["pluginType"],
  group = 0
): IExtractedData[] {
  const out: IExtractedData[] = [];
  for (const m of html.matchAll(re)) {
    const v = (m[group] ?? "").toString().trim();
    if (!v) continue;
    out.push({ pluginType, value: v, count: 1 });
  }
  return out;
}

function extractLinkRelCanonical($: cheerio.CheerioAPI, baseUrl: string): IExtractedData[] {
  return extractAttrUrls($, 'link[rel="canonical"][href]', "href", baseUrl);
}

/** ---------- social site specific helpers ---------- */

function extractUsernamesFromProfileLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  hostMatcher: RegExp,
  pathRe: RegExp
): IExtractedData[] {
  const out: IExtractedData[] = [];
  $("a[href]").each((_i, el) => {
    const raw = $(el).attr("href");
    if (!raw || isJunkUrl(raw)) return;

    const href = toAbsUrl(raw, baseUrl);
    try {
      const u = new URL(href);
      if (!hostMatcher.test(u.hostname)) return;

      const m = u.pathname.match(pathRe);
      if (!m) return;

      const username = (m[1] ?? "").trim();
      if (!username) return;

      out.push({ pluginType: "username", value: username, count: 1 });
    } catch {
      // ignore
    }
  });
  return out;
}

function extractDomainsFromUrls(items: IExtractedData[]): IExtractedData[] {
  const out: IExtractedData[] = [];
  for (const it of items) {
    if (it.pluginType !== "url") continue;
    try {
      const u = new URL(it.value);
      out.push({ pluginType: "domain", value: u.hostname, count: 1 });
    } catch {
      // ignore
    }
  }
  return out;
}

export function extractAllMetaTags(html: string): MetaTagRecord[] {
  const $ = cheerio.load(html);

  return $("meta")
    .toArray()
    .map((el) => {
      const $el = $(el);
      return {
        name: $el.attr("name") ?? null,
        property: $el.attr("property") ?? null,
        httpEquiv: $el.attr("http-equiv") ?? null,
        charset: $el.attr("charset") ?? null,
        content: $el.attr("content") ?? null,
      } satisfies MetaTagRecord;
    });
}

/**
 * Optional: return as IExtractedData rows.
 * Key is (name|property|http-equiv|charset) and value includes content.
 */
export function extractAllMetaTagsAsExtractedData(html: string): IExtractedData[] {
  const rows = extractAllMetaTags(html);

  return rows.map((m) => {
    const key =
      m.name
        ? `name:${m.name}`
        : m.property
        ? `property:${m.property}`
        : m.httpEquiv
        ? `http-equiv:${m.httpEquiv}`
        : m.charset
        ? `charset:${m.charset}`
        : "meta:unknown";

    const value = m.content ?? m.charset ?? "";

    return {
      pluginType: "meta",
      value: `${key}=${value}`,
      count: 1,
    };
  });
}

/** ---------- Filters: maintainable registry ---------- */

export const PRE_EXISTING_FILTERS: PreExistingFilter[] = [
  {
    id: "a-hrefs",
    name: "Links (a[href])",
    description: "Extract all anchor href URLs",
    pluginType: "url",
    extractor: ({ $, baseUrl }) => extractAttrUrls($, "a[href]", "href", baseUrl),
  },
  {
    id: "img-src",
    name: "Images (img[src])",
    description: "Extract image URLs",
    pluginType: "url",
    extractor: ({ $, baseUrl }) => extractAttrUrls($, "img[src]", "src", baseUrl),
  },
  {
    id: "scripts",
    name: "Scripts (script[src])",
    description: "Extract script URLs",
    pluginType: "url",
    extractor: ({ $, baseUrl }) => extractAttrUrls($, "script[src]", "src", baseUrl),
  },

  // ---------- General “social footprint” extractors ----------
  {
    id: "meta-social-handles",
    name: "Social meta handles (twitter, og, etc.)",
    description: "Extract usernames/ids from common social meta tags",
    pluginType: "username",
    extractor: ({ $, baseUrl }) =>
      extractMetaContent(
        $,
        [
          "twitter:creator",
          "twitter:site",
          "profile:username",
          "al:android:url", // can contain app links with ids
          "al:ios:url",
        ],
        baseUrl
      ),
  },
  {
    id: "canonical-url",
    name: "Canonical URL",
    description: "Extract canonical link (often the ‘real’ permalink)",
    pluginType: "url",
    extractor: ({ $, baseUrl }) => extractLinkRelCanonical($, baseUrl),
  },

  // ---------- X / Twitter ----------
  {
    id: "x-usernames",
    name: "X/Twitter usernames (links)",
    description: "Find @usernames by parsing x.com/twitter.com profile links",
    pluginType: "username",
    extractor: ({ $, baseUrl }) =>
      extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)twitter\.com$|(^|\.)x\.com$/i,
        /^\/([A-Za-z0-9_]{1,15})(?:\/|$)/ // @ handle
      ),
  },

  // ---------- Instagram ----------
  {
    id: "instagram-usernames",
    name: "Instagram usernames (links)",
    description: "Extract instagram.com profile usernames from links",
    pluginType: "username",
    extractor: ({ $, baseUrl }) =>
      extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)instagram\.com$/i,
        /^\/([A-Za-z0-9._]{1,30})(?:\/|$)/
      ),
  },

  // ---------- Facebook ----------
  {
    id: "facebook-usernames",
    name: "Facebook usernames/pages (links)",
    description: "Extract facebook.com/{username} and fb.me shortlinks",
    pluginType: "username",
    extractor: ({ $, baseUrl }) => [
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)facebook\.com$/i,
        /^\/(?!sharer\.php|share\.php|login\.php|events|pages|watch|groups)([^/?#]+)(?:\/|$)/
      ),
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)fb\.me$/i,
        /^\/([^/?#]+)(?:\/|$)/
      ),
    ],
  },

  // ---------- LinkedIn ----------
  {
    id: "linkedin-profiles",
    name: "LinkedIn profiles/orgs (links)",
    description: "Extract linkedin.com/in and /company identifiers",
    pluginType: "username",
    extractor: ({ $, baseUrl }) => [
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)linkedin\.com$/i,
        /^\/in\/([^/?#]+)(?:\/|$)/
      ),
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)linkedin\.com$/i,
        /^\/company\/([^/?#]+)(?:\/|$)/
      ),
    ],
  },

  // ---------- YouTube ----------
  {
    id: "youtube-channels",
    name: "YouTube channels (links)",
    description: "Extract /@handle, /channel/ID, /c/ vanity",
    pluginType: "username",
    extractor: ({ $, baseUrl }) => [
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)youtube\.com$/i,
        /^\/@([^/?#]+)(?:\/|$)/
      ),
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)youtube\.com$/i,
        /^\/channel\/([^/?#]+)(?:\/|$)/
      ),
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)youtube\.com$/i,
        /^\/c\/([^/?#]+)(?:\/|$)/
      ),
    ],
  },

  // ---------- TikTok ----------
  {
    id: "tiktok-usernames",
    name: "TikTok usernames (links)",
    description: "Extract tiktok.com/@handle",
    pluginType: "username",
    extractor: ({ $, baseUrl }) =>
      extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)tiktok\.com$/i,
        /^\/@([^/?#]+)(?:\/|$)/
      ),
  },

  // ---------- Reddit ----------
  {
    id: "reddit-users-subs",
    name: "Reddit users/subreddits (links)",
    description: "Extract reddit.com/u and /r identifiers",
    pluginType: "username",
    extractor: ({ $, baseUrl }) => [
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)reddit\.com$/i,
        /^\/(?:user|u)\/([^/?#]+)(?:\/|$)/
      ),
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)reddit\.com$/i,
        /^\/r\/([^/?#]+)(?:\/|$)/
      ),
    ],
  },

  // ---------- GitHub ----------
  {
    id: "github-users-orgs",
    name: "GitHub users/orgs (links)",
    description: "Extract github.com/{user} and github.com/orgs/{org}",
    pluginType: "username",
    extractor: ({ $, baseUrl }) => [
      ...extractUsernamesFromProfileLinks(
        $,
        baseUrl,
        /(^|\.)github\.com$/i,
        /^\/(orgs\/)?([^/?#]+)(?:\/|$)/ // group 2 is the name; we’ll handle below
      ).map((x) => ({ ...x, value: x.value.replace(/^orgs\//, "") })),
    ],
  },

  // ---------- Mastodon (best-effort) ----------
  {
    id: "mastodon-handles",
    name: "Mastodon handles (text best-effort)",
    description: "Extract @user@instance patterns from visible HTML text",
    pluginType: "username",
    extractor: ({ html }) =>
      extractTextMatches(
        html,
        /@([A-Za-z0-9_]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
        "username",
        1
      ),
  },

  // ---------- Domains from extracted URLs ----------
  {
    id: "domains-from-links",
    name: "Domains (from extracted URLs)",
    description: "Derive domain list from anchor hrefs",
    pluginType: "domain",
    extractor: ({ $, baseUrl }) => {
      const urls = extractAttrUrls($, "a[href]", "href", baseUrl);
      return extractDomainsFromUrls(urls);
    },
  },
  {
    id: "meta-tags",
    name: "Meta tags (all <meta>)",
    description: "Extract every meta tag as key=value rows (name/property/http-equiv/charset)",
    pluginType: "meta",
    extractor: extractAllMetaTagsAsExtractedData,
  },
];


/**
 * Maintainable processing entrypoint:
 * - registry-driven (no huge switch)
 * - consistent URL resolution + summarization
 * - safe errors
 */
export function processHtmlString(html: string, filterId: string, baseUrl: string): IExtractedData[] {
  if (!filterId) return [];
  if (!html?.trim()) return [];

  const filter = PRE_EXISTING_FILTERS.find((f) => f.id === filterId);
  if (!filter) return [];

  try {
    const $ = cheerio.load(html);
    const ctx: ExtractContext = { html, baseUrl, $ };

    const extracted = filter.extractor(ctx) ?? [];
    return summarizeExtractedData(extracted);
  } catch {
    return [];
  }
}

type Props = {
  pageInfo?: PageInfo|null
  discoveryPlugins: DiscoveryPlugin[]
  activeTabUrl: string|null
  cacheRef: Record<string, PageInfo>
  fetchDataForUrl: Function
};

export default function SidePanelDataTable(
  {
    pageInfo = null,
    discoveryPlugins = [],
    activeTabUrl = null,
    cacheRef = {},
    fetchDataForUrl
  }: Props) {
  const [rows, setRows] = useState<IExtractedData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filterValue, setFilterValue] = useState<PreExistingFilter | null>(
    PRE_EXISTING_FILTERS[0] ?? null
  );
  const [filterInput, setFilterInput] = useState<string>(PRE_EXISTING_FILTERS[0]?.name ?? "");

  const selectedFilterId = filterValue?.id ?? "";

  const columns: MUIDataTableColumnDef[] =
    [
      {
        label: "Actions",
        name: "pluginType",
        options: {
          filter: false,
          sort: false,
          searchable: false,
          customBodyRenderLite: (dataIndex: number) => {
            if (!rows[dataIndex].value) {
              return <div></div>;
            }
            const value = rows[dataIndex].value;
            const pluginType = rows[dataIndex].pluginType;

            return (
              <DiscoveryPluginDialog
                key={`selector-${value}-${pluginType}`}
                plugins={getIntegratedPlugins().filter(p => p.pluginType === 'url').concat(discoveryPlugins.filter((plugin) => {
                  return plugin.pluginType === pluginType;
                }))}
                title={'Discovery Plugin Guide'}
                rapport={null}
                uxType={'icon'}
                selectorValue={value}
                refreshRows={null}
              />
            )
            // TODO: render action based on data type
          },
        },
      },
      {
        label: "Value",
        name: "value",
        options: {
          filter: false,
          sort: true,
          searchable: true,
          customBodyRenderLite: (dataIndex: number) => {
            if (!rows[dataIndex].value) {
              return <div></div>;
            }
            switch (rows[dataIndex]) {
              default:

                return (
                  <>
                    <Tooltip title={'Frequency of value throughout the document'}>
                      <Badge
                        badgeContent={rows[dataIndex].count}
                        color="primary"
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                      >
                        <span> </span>
                      </Badge>
                    </Tooltip>
                    <Link sx={{m:2}} href={rows[dataIndex].value} rel="noreferrer" target={'_blank'}>{rows[dataIndex].value}</Link>
                  </>
                )
            }
          },
        },
      },
    ]


  // Centralized parse runner with cancelation + error handling
  const runParse = async (signal: AbortSignal) => {
    setError(null);
    setIsLoading(true);
    showLoader();

    try {
      if (!selectedFilterId) {
        setRows([]);
        return;
      }
      if (!pageInfo || !pageInfo.html.trim()) {
        setRows([]);
        return;
      }

      const data: IExtractedData[] = processHtmlString(pageInfo.html, selectedFilterId, getBaseUrl(pageInfo.url));

      if (signal.aborted) return;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      if (signal.aborted) return;
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        hideLoader();
      } else {
        hideLoader();
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void runParse(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo, selectedFilterId]);

  const options: MUIDataTableOptions = useMemo(
    () => ({
      searchAlwaysOpen: true,
      responsive:"standard",
      rowsPerPageOptions: [],
      pagination: true,
      rowsPerPage: 10000,
      setTableProps: () => ({ size: "small" }),
      print: false,
      filter: false,
      download: true,
      viewColumns: false,

    }),
    []
  );

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 1,
        gap: 1,
      }}
    >
      {/* Autocomplete is NOT in the custom toolbar anymore */}
      <Box sx={{ flex: "0 0 auto" }}>
        <Stack spacing={0.5}>
          <Autocomplete<PreExistingFilter, false, false, false>
            options={PRE_EXISTING_FILTERS}
            value={filterValue}
            inputValue={filterInput}
            onChange={(_e, newValue) => {
              setFilterValue(newValue);
              if (newValue?.name) setFilterInput(newValue.name);
            }}
            onInputChange={(_e, newInput) => setFilterInput(newInput)}
            getOptionLabel={(o) => o?.name ?? ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Extractor"
                placeholder="Type to filter…"
                InputProps={{
                  ...params.InputProps,
              // Add the InputAdornment with the PlaceIcon to the start
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title={'Refresh page contents. This will update the discovered links and selectors'}>
                    <IconButton>
                      <RefreshIcon onClick={() => {
                        fetchDataForUrl(activeTabUrl, false);
                      }}/>
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
              />
            )}
          />

          {filterValue?.description ? (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              {filterValue.description}
            </Typography>
          ) : null}

          {error ? (
            <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
              {error}
            </Alert>
          ) : null}
        </Stack>
      </Box>

      {/* Table fills remaining height */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <MUIDataTable
          title={"Extraction Results"}
          data={rows}
          columns={columns}
          options={options}
        />
      </Box>
    </Box>
  );
}
