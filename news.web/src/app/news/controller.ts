/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INews, INewsFilters } from "./interface";
import useIsMobile from "../shared/hooks/use-mobile";

const useNewsController = () => {
  const dataRef = useRef<INews[]>([]);
  const [count, setCount] = useState(0);

  const [worker, setWorker] = useState<Worker>();
  const [readyState, setReadyState] = useState();

  const [keywords, setKeywords] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [filters, setFilters] = useState<INewsFilters>({
    keywords: new Set<string>(),
    assets: new Set<string>(),
    sources: new Set<string>(),
  });

  const isMobile = useIsMobile();
  const newsHeight = useMemo(
    // window.innerHeight - fixed elements
    () => (isMobile ? window.innerHeight - 310 : window.innerHeight - 170),
    [isMobile]
  );

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    const queryParams = new URLSearchParams(window.location.search);
    const isDebugMode = queryParams.get("debug");

    worker.postMessage({
      type: "WS_INIT",
      payload: {
        isDebugMode: isDebugMode === "true",
      },
    });

    worker.onmessage = function (event: MessageEvent) {
      const message = event.data;

      switch (message.type) {
        case "WS_READY_STATE":
          setReadyState(message.payload);
          break;

        case "WS_DATA": {
          const initialState: INewsFilters = {
            keywords: new Set<string>(),
            assets: new Set<string>(),
            sources: new Set<string>(),
          };
          const options = (message.payload as INews[]).reduce(
            (acc: INewsFilters, item) => {
              // remove duplicates
              item.assets = Array.from(new Set(item.assets));
              item.keywords = Array.from(new Set(item.keywords));

              // build unique set of entities options
              acc.sources.add(item.source);
              item.assets.forEach((item) => acc.assets.add(item));
              item.keywords.forEach((item) => acc.keywords.add(item));
              return acc;
            },
            initialState
          );

          // update `keywords`
          setKeywords((prevKeywords) => {
            let hasChanged = false;
            const keywords = Array.from(options.keywords).reduce(
              (acc, item) => {
                if (prevKeywords.includes(item)) {
                  return acc;
                }

                hasChanged = true;
                return acc.concat([item]);
              },
              prevKeywords
            );

            return hasChanged ? keywords.sort() : prevKeywords;
          });

          // update `assets`
          setAssets((prevAssets) => {
            let hasChanged = false;
            const assets = Array.from(options.assets).reduce((acc, item) => {
              if (prevAssets.includes(item)) {
                return acc;
              }

              hasChanged = true;
              return acc.concat([item]);
            }, prevAssets);

            return hasChanged ? assets.sort() : prevAssets;
          });

          // update `sources`
          setSources((prevSources) => {
            let hasChanged = false;
            const sources = Array.from(options.sources).reduce((acc, item) => {
              if (prevSources.includes(item)) {
                return acc;
              }

              hasChanged = true;
              return acc.concat([item]);
            }, prevSources);

            return hasChanged ? sources.sort() : prevSources;
          });

          // udpate `dataState`
          dataRef.current.unshift(...message.payload);
          setCount((c) => c + 1);
          break;
        }

        default:
          console.log("unhandled message", message);
      }
    };

    setWorker(worker);
    return () => {
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!worker) return;
    // ws handshake
    worker.postMessage({
      type: "WS_SEND_MESSAGE",
      payload: "hello",
    });
  }, [worker]);

  const rowData = useMemo<INews[]>(() => {
    if (!count || !dataRef.current.length) {
      return;
    }

    return dataRef.current.filter((news) => {
      return (
        (filters.sources.size === 0 || filters.sources.has(news.source)) &&
        (filters.keywords.size === 0 ||
          news.keywords.some((k) => filters.keywords.has(k))) &&
        (filters.assets.size === 0 ||
          news.assets.some((a) => filters.assets.has(a)))
      );
    });
  }, [count, filters]);

  const logToConsole = useCallback((item: INews) => {
    console.log("Log News ::", item);
  }, []);

  return {
    keywords,
    assets,
    sources,
    rowData,
    readyState,
    filters,
    newsHeight,
    setFilters,
    logToConsole,
  };
};

export default useNewsController;
