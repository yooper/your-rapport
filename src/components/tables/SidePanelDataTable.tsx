import * as React from "react";
import Box from "@mui/material/Box";
import Badge from '@mui/material/Badge';
import { useEffect, useMemo, useState } from "react";
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
  Link, Tooltip,
} from '@mui/material';

import { hideLoader, showLoader } from "../../utilities/loaders";
import * as cheerio from 'cheerio';
import { IExtractedData, PageInfo, PreExistingFilter } from '../../types';


const PRE_EXISTING_FILTERS: PreExistingFilter[] = [
  { id: "a-hrefs", name: "Links (a[href])", description: "Extract all anchor href URLs" },
  { id: "img-src", name: "Images (img[src])", description: "Extract image URLs" },
  { id: "scripts", name: "Scripts (script[src])", description: "Extract script URLs" },
];

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
        dataType: item.dataType ?? "url",
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


function processHtmlString(html: string, filterId: string, baseUrl: string): IExtractedData[] {
  if (!filterId) return [];
  if (!html.trim()) return [];

  const $ = cheerio.load(html);
  let links: IExtractedData[] = []
  switch (filterId) {
    case "a-hrefs":
      $('a[href]').each((index, element) => {
        const href = $(element).attr('href');
        // You might want to resolve relative URLs to absolute URLs here
        if(!href){
          return;
        }
        if(href.startsWith('/') || href.startsWith('#')){
          links.push({pluginType: 'url', value: baseUrl+href, count:1} as IExtractedData);
        }
        else{
          links.push({pluginType: 'url', value: href, count: 1} as IExtractedData);
        }
      });
      break;
    case "img-src":
      $('img[src]').each((index, element) => {
        const src = $(element).attr('src');
        // You might want to resolve relative URLs to absolute URLs here
        if (src) {
          links.push({pluginType: 'url', value: src} as IExtractedData);
        }
      });
      break;
    case "scripts":
      $('script[src]').each((index, element) => {
        const src = $(element).attr('src');
        // You might want to resolve relative URLs to absolute URLs here
        if (src) {
          links.push({ pluginType: 'url', value: src } as unknown as IExtractedData);
        }
      });
      break;
    default:
      break;
  }
  return summarizeExtractedData(links)
}

type Props = {
  pageInfo?: PageInfo|null;
};

export default function SidePanelDataTable({ pageInfo = null }: Props) {
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
        name: "dataType",
        options: {
          filter: false,
          sort: false,
          searchable: false,
          customBodyRenderLite: (dataIndex: number) => {
            if (!rows[dataIndex].value) {
              return <div></div>;
            }
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
      responsive:"scrollFullHeight",
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
