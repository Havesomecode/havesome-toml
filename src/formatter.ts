import { createStreaming, type Formatter } from "@dprint/formatter";
import tomlPluginUrl from "@dprint/toml/plugin.wasm?url";

let formatterPromise: Promise<Formatter> | undefined;

async function loadFormatter(): Promise<Formatter> {
  if (!formatterPromise) {
    formatterPromise = createStreaming(fetch(tomlPluginUrl)).catch((cause) => {
      formatterPromise = undefined;
      throw cause;
    });
  }
  return formatterPromise;
}

export async function getTomlSourceFormatter(): Promise<
  (source: string) => string
> {
  const formatter = await loadFormatter();
  return (source) =>
    formatter.formatText({ filePath: "config.toml", fileText: source });
}
